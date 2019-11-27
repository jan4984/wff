/**
 *     历史记录。SQL。数据用JSON.stringify()。历史操作表只能insert、query，不能update
 *     对象/文件 存储。minio
 *     权限检查。SQL。管理员、操作员。管理员可以维护每一步哪些操作员
 */
const uuid = require('uuid/v4');
const ZB = require('zeebe-node');
const fs = require('fs');
const DBService = require('./db-service');
const {OperationHistoryService} = require('./op-history-service');

class WorkflowFramework {
    constructor(jobHookers) {
        this.zbClient = null;
        this.opService = new OperationHistoryService();
        this.jobWorkers = {};
        this.jobHookers = jobHookers || {};
        this.uploadDir = __dirname + '/';
    }

    /*
     * Workflow initialization, include connecting zeebe broker, connecting database
     * @param {Object} props
     * @returns {Promise<>}
     */
    async initialize(props) {
        if (!this.zbClient) {
            let zbClient = new ZB.ZBClient(props.zbInfo);
            let topology = await zbClient.topology();
            console.log(topology);
            this.zbClient = zbClient;
        }

        if (props.dbInfo) {
            await DBService.get(props.dbInfo);
        }

        props.uploadDir || (props.uploadDir = 'upload');
        fs.access(props.uploadDir, err1 => {
            !err1 || fs.mkdir(props.uploadDir, err2 => {
                !err2 || (this.uploadDir += props.uploadDir + '/');
            });
        });
    }

    /*
     * Deploy workflow(s)
     * @param {String} workflow - A path to .bpmn files
     * @returns {Promise<DeployWorkflowResponse>} workflow information
     */
    async deployWorkflow(workflow) {
        this._initCheck();
        let serviceTypes = await this.zbClient.getServiceTypesFromBpmn(workflow);
        let result = await this.zbClient.deployWorkflow(workflow);
        let record = result.workflows[0];
        record.file = workflow;
        record.serviceType = serviceTypes;
        await this.opService.addWorkflow(record);
        return record;
    }

    /*
     * Create a workflow instance
     * @param {String} bpmnProcessId
     * @param {Object} [vars] - Payload to pass in to the workflow
     * @returns {Promise<CreateWorkflowInstanceResponse>} workflow instance information
     */
    async createWorkflowInstance(bpmnProcessId, vars) {
        this._initCheck();

        // get workflow information form database
        let workflow = await this.opService.getWorkflowByBpmnProcessId(bpmnProcessId);
        if (!workflow) {
            throw 'bpmnProcessId does not exist';
        }

        // create worker if it has not been created
        for (const service of workflow.serviceType) {
            if (!this.jobWorkers.hasOwnProperty(service)) {
                this.jobWorkers[service] = await this.zbClient.createWorker(
                    uuid.v4(),
                    service,
                    this._jobHandler.bind(this)
                );
            }
        }

        // create workflow instance in zeebe
        let result = await this.zbClient.createWorkflowInstance(bpmnProcessId, vars);
        await this.zbClient.setVariables({
            elementInstanceKey: result.workflowInstanceKey,
            variables: {instanceKey: result.workflowInstanceKey},
            local: false
        }).catch(async (e)=> {
            await this.zbClient.cancelWorkflowInstance(result.workflowInstanceKey);
            throw e;
        });

        // add workflow instance record in database
        await this.opService.addWorkflowInstance(result.workflowInstanceKey, workflow.id)
            .catch(async (e) => {
                await this.zbClient.cancelWorkflowInstance(result.workflowInstanceKey);
                throw e;
            });

        return result;
    }

    /*
     * Delete a workflow instance
     * @param {String} workflowInstanceKey
     * @returns {Promise<>}
     */
    async deleteWorkflowInstance(workflowInstanceKey) {
        this._initCheck();
        await this.opService.removeWorkflowInstance(workflowInstanceKey);
        await this.zbClient.cancelWorkflowInstance(workflowInstanceKey);
    }

    /*
     * Append a workflow operation by push message
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @param {Object} [data] - Variables published with the message
     * @param {Array} [files] - Files related to this workflow instance
     * @returns {Promise<>}
     */
    async addOperation(workflowInstanceKey, processName, data, files) {
        this._initCheck();
        let vars = {};
        vars[processName] = {};
        vars[processName].data = data || {};
        vars[processName].files = files || [];
        await this.zbClient.publishMessage({
            name: processName,
            messageId: uuid.v4(),
            correlationKey: workflowInstanceKey,
            variables: vars,
            timeToLive: 10000,
        });
    }

    /*
     * Append a workflow operation directly into database
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @param {Object} [data] - Variables published with the message
     * @param {Array} [files] - Files related to this workflow instance
     * @returns {Promise<Object>}
     */
    async recordOperation(workflowInstanceKey, processName, data, files) {
        await this.opService.addOperation(workflowInstanceKey, processName, data, files);
    }

    /*
     * Get the data of a workflow operation(the latest one)
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @returns {Promise<Object>}
     */
    async getOperation(workflowInstanceKey, processName) {
        return this.opService.findOperationByInstanceKey(workflowInstanceKey, processName);
    }

    /*
     * Depend on module 'express-fileupload'
     * Receive file from client and store in specific directory
     * @param {String} workflowInstanceKey
     * @param {Object} file (object defined in package 'express-fileupload')
     * @returns {Promise<int>}
     */
    async uploadFile(workflowInstanceKey, file) {
        await this._instanceKeyCheck();
        const savePath = this.uploadDir + workflowInstanceKey + '_' + Date.now().toString();
        await file.mv(`${savePath}`);
        const result = await this.opService.addFile(workflowInstanceKey, savePath);
        return result.id;
    }

    _initCheck() {
        if (!this.zbClient) {
            throw 'disconnect from Zeebe broker';
        }
    }

    async _instanceKeyCheck(workflowInstanceKey) {
        let result = await this.opService.getWorkflowInstanceByKey(workflowInstanceKey);
        if (!result) {
            throw 'workflow instance does not exit';
        }
    }

    async _jobHandler(job, complete) {
        async function hook(handler) {
            let result = await handler(job.workflowInstanceKey, job.type, job.variables[job.type])
                .catch(e => {
                    console.log('exception in handler of', job.type);
                    result = false;
                });
            return result;
        }

        console.log('work as service type', job.type, job.variables);
        const jobHook = this.jobHookers[job.type];
        if (jobHook && jobHook.preHandler) {
            if (!await hook(jobHook.preHandler)) {
                console.log('fail in preHandler of', job.type);
                return complete.failure();
            }
        }

        const pos = job.type.indexOf('_');
        if (pos !== -1 && job.type.slice(0, pos).toLowerCase() === 'db') {
            const message = job.type.slice(pos + 1);
            let result = true;
            await this.opService.addOperation(job.workflowInstanceKey, message, job.variables[message].data, job.variables[message].files)
                .catch(e => {
                    console.log('fail to addOperation:', e);
                    result = false;
                });
            if (result) {
                return complete.failure();
            }
        }

        if (jobHook && jobHook.postHandler) {
            if (!await hook(jobHook.postHandler)) {
                console.log('fail in postHandler of', job.type);
                return complete.failure();
            }
        }

        await complete.success();
    }
}

module.exports = WorkflowFramework;

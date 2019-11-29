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
        this.defaultWorkflow = null;
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

        let workflow = await this.opService.getDefaultWorkflow();
        this.defaultWorkflow = workflow;
        await this._createWorker();
    }

    /*
     * Deploy workflow(s)
     * @param {String} workflow - A path to .bpmn files
     * @returns {Promise<DeployWorkflowResponse>} workflow information
     */
    async deployWorkflow(workflow, def) {
        this._initCheck();
        let serviceTypes = await this.zbClient.getServiceTypesFromBpmn(workflow);
        let result = await this.zbClient.deployWorkflow(workflow);
        let record = result.workflows[0];
        record.file = workflow;
        record.serviceType = serviceTypes;
        record.default = def || true;
        result = await this.opService.addWorkflow(record);
        if (record.default) {
            this.defaultWorkflow = result;
            await this._createWorker();
        }
        return record;
    }

    /*
     * Create a workflow instance
     * @param {Object} [vars] - Payload to pass in to the workflow
     * @returns {Promise<CreateWorkflowInstanceResponse>} workflow instance information
     */
    async createWorkflowInstance(vars) {
        this._initCheck();
        if (!this.defaultWorkflow) {
            throw 'no default workflow';
        }

        // create workflow instance in zeebe
        !vars && (vars = {});
        vars.instanceKey = '';
        let result = await this.zbClient.createWorkflowInstance(this.defaultWorkflow.bpmnProcessId, vars);
        await this.zbClient.setVariables({
            elementInstanceKey: result.workflowInstanceKey,
            variables: {instanceKey: result.workflowInstanceKey},
            local: false
        }).catch(async (e)=> {
            await this.zbClient.cancelWorkflowInstance(result.workflowInstanceKey);
            throw e;
        });

        // add workflow instance record in database
        await this.opService.addWorkflowInstance(result.workflowInstanceKey, this.defaultWorkflow.id)
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
     * Record file in database
     * @param {String} workflowInstanceKey
     * @param {String|Array} files - A file path or an array of file paths
     * @returns {Promise<int>}
     */
    async addFile(workflowInstanceKey, files) {
        this._instanceKeyCheck();
        return this.opService.addFile(workflowInstanceKey, files);
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

    async _createWorker() {
        if (this.defaultWorkflow) {
            for (const service of this.defaultWorkflow.serviceType) {
                if (!this.jobWorkers.hasOwnProperty(service)) {
                    this.jobWorkers[service] = await this.zbClient.createWorker(
                        uuid.v4(),
                        service,
                        this._jobHandler.bind(this)
                    );
                }
            }
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
            if (!result) {
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

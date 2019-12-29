const uuid = require('uuid/v4');
const fs = require('fs');
const crypto = require('crypto');
const {OperationHistoryService} = require('./op-history-service');
const {parse} = require('./engine');
const WorkflowInstance = require('./workflow-instance');

const {Logger} = require('./utils');
const log = Logger({tag:'workflow-framework'});

class WorkflowFramework {
    constructor(hookers) {
        this.dbService = new OperationHistoryService();
        this.hookers = hookers || {};
        this.wfi = new WorkflowInstance(this.hookers);
    }

    /*
     * Workflow framework initialization
     * @param {Object} props
     * @returns {Promise<>}
     */
    async initialize(props) {
        for (const workflow of await this.dbService.getWorkflows()) {
            this._addHandler(workflow);
        }
    }

    /*
     * Deploy workflow
     * @param {String} bpmnFile - A path to .bpmn files
     * @param {Boolean} def - Set workflow as default or not
     * @returns {Promise<Number>} workflow id
     */
    async deployWorkflow(bpmnFile, def = true) {
        log.info('deploying new workflow', bpmnFile);
        const content = fs.readFileSync(bpmnFile);
        const md5 = await this._getFileMd5(content);
        let workflow = await this.dbService.addWorkflow({content, md5, default: def});
        this._addHandler(workflow);
        return workflow.id;
    }

    /*
     * Delete workflow
     * @param {Number} workflowId - Workflow id
     * @returns {Promise<>}
     */
    async deleteWorkflow(workflowId) {
        //const result = await this.dbService.getProcessingCount();
        // const result = 0;
        // if (result > 0) {
        //     throw 'can not delete workflow while instances are in process';
        // } else {
        //     return this.dbService.deleteWorkflow(workflowId);
        // }
    }

    /*
     * Create a workflow instance
     * @param {Object} [vars] - Payload to pass in to the workflow
     * @param {Number} [workflowId] - Workflow id, use default workflow while it is null
     * @returns {Promise<String>} workflow instance id
     */
    async createWorkflowInstance(vars, workflowId, id) {
        !vars && (vars = {});
        log.info('creating new workflow instance:', workflowId, JSON.stringify(vars));

        let workflow = workflowId
            ? await this.dbService.getWorkflowById(workflowId)
            : await this.dbService.getDefaultWorkflow();
        if (!workflow) {
            throw 'workflow with id ' + workflowId.toString() + ' does not exist';
        }

        const instance = await this.dbService.addInstance({
            id: id || uuid(),
            workflowId: workflow.id,
            variables: vars
        });
        await this.wfi.process(instance.id);
        return instance.id;
    }

    /*
     * Delete a workflow instance
     * @param {String} instanceId - Workflow instance id
     * @returns {Promise<>}
     */
    async deleteWorkflowInstance(instanceId) {
        log.info('deleting workflow instance', instanceId);
        this._instanceCheck(instanceId);
        await this.dbService.deleteInstance(instanceId);
        delete this.processList[instanceId];
        delete this.endList[instanceId];
    }

    /*
     * Get workflow instance status
     * @param {String} instanceId - Workflow instance id
     * @returns {Promise<Object>}
     */
    async getWorkflowInstanceState(instanceId) {
        let state = {};
        let instance = await this.dbService.getInstanceById(instanceId);
        if (!instance) {
            state = {status: 'nonexistent'};
        } else {
            state = {status: instance.status, currentTasks: instance.currentTasks};
        }

        log.info('get workflow instance state', instanceId, JSON.stringify(state));
        return state;
    }

    /*
     * Append a workflow operation by push message
     * @param {String} instanceId - Workflow instance id
     * @param {String} processName - Process name
     * @param {Object} [data] - Variables published with the message
     * @param {Array} [files] - Files related to this operation
     * @returns {Promise<>}
     */
    async addOperation(instanceId, processName, data, files) {
        data || (data = {});
        files || (files = []);
        log.info('add operation', instanceId, processName, JSON.stringify(data), JSON.stringify(files));
        await this.wfi.process(instanceId, processName, data, files);
    }

    /*
     * Append a workflow operation directly into database
     * @param {String} instanceId - Workflow instance id
     * @param {String} processName - Process name
     * @param {Object} [data] - Variables published with the message
     * @param {Array} [files] - Files related to this workflow instance
     * @returns {Promise<>}
     */
    async recordOperation(instanceId, processName, data, files) {
        !data || (data = {});
        !files || (files = []);
        log.info('record operation', instanceId, processName, JSON.stringify(data), JSON.stringify(files));
        await this.dbService.addOperation(instanceId, processName, data, files);
    }

    /*
     * Get the data of a workflow instance operation(the latest one)
     * @param {String} instanceId - Workflow instance id
     * @param {String} processName - Process name
     * @returns {Promise<Object>}
     */
    async getOperation(instanceId, processName) {
        return this.dbService.getOperationByInstanceId(instanceId, processName);
    }

    // async _addWorkflow(workflow) {
    //     try {
    //         const md5 = await this._getFileMd5(workflow.content);
    //         const engine = parse(workflow.content);
    //         const handlers = this._addHandler(engine);
    //         this.workflows[workflow.id] = {engine: engine, handlers: handlers};
    //         this.md5s[md5] = workflow.id;
    //         workflow.default && (this.defaultWorkflowId = workflow.id);
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    _addHandler(workflow) {
        const engine = parse(workflow.content);
        engine.getTasks().forEach(task => {
            if (task.isServiceTask) {
                this.wfi.addHandler(task.name, this._handler.bind(this));
            }
        });
    }

    async _getFileMd5(data) {
        var fsHash = crypto.createHash('md5');
        fsHash.update(data);
        return fsHash.digest('hex');
    }

    async _handler(instanceId, task, vars, complete) {
        console.log('in task handler', instanceId, task, vars);

        const invokeHooker = async (handler) => {
            if (handler) {
                return handler(instanceId, task, vars)
            }
        };

        const hooker = this.hookers[task];
        if (hooker) {
            try {
                await invokeHooker(hooker.preHandler);
                const result = await invokeHooker(hooker.jobHandler);
                const taskResult = {};
                taskResult[task] = {data:result};
                hooker.postHandler && (await hooker.postHandler(instanceId, task, Object.assign({},vars,taskResult)));
                return await complete.success(result);
            } catch (e) {
                console.log('exception in handler of', task, e);
            }
        }
        return complete.failure();
    }
}

module.exports = WorkflowFramework;

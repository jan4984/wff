const uuid = require('uuid/v4');
const fs = require('fs');
const crypto = require('crypto');
const DBService = require('./db-service');
const {OperationHistoryService} = require('./op-history-service');
const {parse} = require('./engine');
const WorkflowInstance = require('./workflow-instance');

const {Logger} = require('./utils');
const log = Logger({tag:'workflow-framework'});

class WorkflowFramework {
    constructor(hookers) {
        this.dbService = new OperationHistoryService();
        this.workflows = {};
        this.processList = {};
        this.endList = {};
        this.md5s = {};
        this.hookers = hookers || {};
        this.defaultWorkflowId = null;
    }

    /*
     * Workflow framework initialization
     * @param {Object} props
     * @returns {Promise<>}
     */
    async initialize(props) {
        await DBService.get(props.dbInfo);
        
        for (const workflow of await this.dbService.getWorkflows()) {
            await this._addWorkflow(workflow);
        }

        for (const instance of await this.dbService.getInstances()) {
            await this._addInstance(instance);
        }
    }

    /*
     * Deploy workflow
     * @param {String} bpmnFile - A path to .bpmn files
     * @param {Boolean} def - Set workflow as default or not
     * @returns {Promise<Number>} workflow id
     */
    async deployWorkflow(bpmnFile, def = true) {
        const content = fs.readFileSync(bpmnFile);
        const md5 = await this._getFileMd5(content);
        if (this.md5s.hasOwnProperty(md5)) {
            return this.md5s[md5];
        } else {
            let workflow = await this.dbService.addWorkflow({content: content, default: def});
            await this._addWorkflow(workflow);
            return workflow.id;
        }
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
    async createWorkflowInstance(vars, workflowId) {
        workflowId || (workflowId = this.defaultWorkflowId);
        if (!this.workflows.hasOwnProperty(workflowId)) {
            throw 'not find workflow with id ' + workflowId;
        }

        !vars && (vars = {});
        const instance = await this.dbService.addInstance({
            id: uuid(),
            workflowId: workflowId,
            variables: vars
        });
        await this._addInstance(instance);
        return instance.id;
    }

    /*
     * Delete a workflow instance
     * @param {String} instanceId - Workflow instance id
     * @returns {Promise<>}
     */
    async deleteWorkflowInstance(instanceId) {
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
    getWorkflowInstanceState(instanceId) {
        if (this.endList.hasOwnProperty(instanceId)) {
            return {status: 'end', currentTasks: []};
        } else if (this.processList.hasOwnProperty(instanceId)) {
            return {status: 'processing', currentTasks: this.processList[instanceId].getCurrentTasks()};
        } else {
            return {status: 'nonexistent'};
        }
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
        this._instanceCheck(instanceId);
        await this.processList[instanceId].message(processName, data, files);
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
        this._instanceCheck(instanceId);
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

    async _addWorkflow(workflow) {
        try {
            const md5 = await this._getFileMd5(workflow.content);
            const engine = parse(workflow.content);
            const handlers = this._addHandler(engine);
            this.workflows[workflow.id] = {engine: engine, handlers: handlers};
            this.md5s[md5] = workflow.id;
            workflow.default && (this.defaultWorkflowId = workflow.id);
        } catch (e) {
            console.log(e);
        }
    }

    _addHandler(engine) {
        const handlers = {};
        engine.getTasks().forEach(task => {
            if (task.isServiceTask) {
                handlers[task.name] = this._handler.bind(this);
            }
        });
        return handlers;
    }

    async _addInstance(instance) {
        if (instance.status === 'end') {
            this.endList[instance.id] = null;
        } else {
            const workflow = this.workflows[instance.workflowId];
            const wfi = new WorkflowInstance(instance.id, workflow, this.hookers);
            await wfi.initialize();
            this.processList[instance.id] = wfi;
            wfi.on('end', this._onInstanceEnd.bind(this));
        }
    }

    async _instanceCheck(instanceId) {
        if (this.endList.hasOwnProperty(instanceId)) {
            throw 'workflow instance is completed';
        } else if (!this.processList.hasOwnProperty(instanceId)) {
            throw 'workflow instance does not exit';
        }
    }

    async _getFileMd5(data) {
        var fsHash = crypto.createHash('md5');
        fsHash.update(data);
        return fsHash.digest('hex');
    }

    _onInstanceEnd(instanceId) {
        this.endList[instanceId] = null;
        delete this.processList[instanceId];
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
                hooker.postHandler && (await hooker.postHandler(instanceId, task, Object.assign({},vars,result,)));
                return await complete.success(result);
            } catch (e) {
                console.log('exception in handler of', task, e);
            }
        }
        return complete.failure();
    }
}

module.exports = WorkflowFramework;

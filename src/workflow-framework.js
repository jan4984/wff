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
     * Workflow initialization, include connecting zeebe broker, connecting database
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
     * Deploy workflow(s)
     * @param {String} bpmnFile - A path to .bpmn files
     * @returns {Promise<string>} workflow id
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

    async deleteWorkflow(workflowId) {

    }

    /*
     * Create a workflow instance
     * @param {Object} [vars] - Payload to pass in to the workflow
     * @returns {Promise<string>} workflow instance information
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
     * @param {String} workflowInstanceKey
     * @returns {Promise<>}
     */
    async deleteWorkflowInstance(instanceId) {

    }

    getWorkflowInstanceState(instanceId) {
        if (this.endList.hasOwnProperty(instanceId)) {
            return {status: 'end', currentTasks: []};
        } else if (this.processList.hasOwnProperty(instanceId)) {
            return {status: 'processing', currentTasks: this.processList[instanceId].getCurrentTasks()};
        } else {
            return {status: 'not exist'};
        }
    }

    /*
     * Append a workflow operation by push message
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @param {Object} [data] - Variables published with the message
     * @param {Array} [files] - Files related to this workflow instance
     * @returns {Promise<>}
     */
    async addOperation(instanceId, task, data, files) {
        this._instanceCheck(instanceId);
        await this.processList[instanceId].message(task, data, files);
    }

    /*
     * Append a workflow operation directly into database
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @param {Object} [data] - Variables published with the message
     * @param {Array} [files] - Files related to this workflow instance
     * @returns {Promise<Object>}
     */
    async recordOperation(instanceId, processName, data, files) {
        this._instanceCheck(instanceId);
        return this.dbService.addOperation(instanceId, processName, data, files);
    }

    /*
     * Get the data of a workflow operation(the latest one)
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @returns {Promise<Object>}
     */
    async getOperation(instanceId, processName) {
        return this.dbService.findOperationByInstanceKey(instanceId, processName);
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
            const wfi = new WorkflowInstance(instance.id, workflow);
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

    async _handler(task, vars, complete) {
        console.log('in task handler', task, vars);

        async function hook(handler) {
            let result = true;
            result = await handler(task, vars)
                .catch(e => {
                    console.log('exception in handler of', task, e);
                    result = false;
                });
            return result;
        }

        const hooker = this.hookers[task];
        if (hooker && hooker.jobHandler) {
            let result = true;
            let retData = await hooker.jobHandler(task, vars)
                .catch(e => {
                    console.log('exception in handler of', task, e);
                    result = false;
                });
            if (!result) {
                await complete.failure();
            } else {
                await complete.success(retData);
            }
            return;
        }

        if (hooker && hooker.preHandler) {
            if (!await hook(hooker.preHandler)) {
                console.log('fail in preHandler of', task);
                return complete.failure();
            }
        }

        if (hooker && hooker.postHandler) {
            if (!await hook(hooker.postHandler)) {
                console.log('fail in postHandler of', task);
                return complete.failure();
            }
        }

        await complete.success({status: '通过'});
    }
}

module.exports = WorkflowFramework;

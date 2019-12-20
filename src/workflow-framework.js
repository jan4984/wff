const uuid = require('uuid/v4');
const fs = require('fs');
var crypto = require('crypto');
const {OperationHistoryService} = require('./op-history-service');
const {BpmnEngine} = require('./engine');
const WorkflowInstance = require('./workflow-instance');

const {Logger} = require('./utils');
const log = Logger({tag:'workflow-framework'});

class WorkflowFramework {
    constructor() {
        this.dbService = new OperationHistoryService();
        this.workflows = {};
        this.instances = {};
        this.md5s = {};
    }

    /*
     * Workflow initialization, include connecting zeebe broker, connecting database
     * @param {Object} props
     * @returns {Promise<>}
     */
    async initialize(props) {
        for (const workflow of await this.dbService.getWorkflows()) {
            await this._addWorkflow(workflow);
        }

        for (const instance of await this.dbService.getInstances()) {
            await this._addInstance(instance);
        }
    }

    /*
     * Deploy workflow(s)
     * @param {String} workflow - A path to .bpmn files
     * @returns {Promise<string>} workflow id
     */
    async deployWorkflow(bpmnFile) {
        const content = fs.readFileSync(bpmnFile);
        const md5 = await this._getFileMd5(content);
        if (this.md5s.hasOwnProperty(md5)) {
            return this.md5s[md5];
        } else {
            let workflow = await this.dbService.addWorkflow({content: content});
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
    async createWorkflowInstance(workflowId, vars) {
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

    /*
     * Append a workflow operation by push message
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @param {Object} [data] - Variables published with the message
     * @param {Array} [files] - Files related to this workflow instance
     * @returns {Promise<>}
     */
    async addOperation(instanceId, task, data, files) {
        if (!this.instances.hasOwnProperty(instanceId)) {
            throw 'no matched instance';
        } else {
            this.instances[instanceId].message(task, data);
        }
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
        return this.opService.addOperation(workflowInstanceKey, processName, data, files);
    }

    /*
     * Get the data of a workflow operation(the latest one)
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @returns {Promise<Object>}
     */
    async getOperation(instanceId, processName) {
        return this.opService.findOperationByInstanceKey(workflowInstanceKey, processName);
    }

    async _addWorkflow(workflow) {
        try {
            const md5 = await this._getFileMd5(workflow.content);
            const engine = new BpmnEngine(workflow.content);
            this.workflows[workflow.id] = engine;
            this.md5s[md5] = workflow.id;
        } catch (e) {
            console.log(e);
        }
    }

    async _addInstance(instance) {
        const workflow = this.workflows[instance.workflowId];
        const wfi = new WorkflowInstance(instance.id, workflow.engine);
        await wfi.initialize();
        this.instances[instance.id] = wfi;
    }

    async _instanceKeyCheck(workflowInstanceKey) {
        let result = await this.opService.getWorkflowInstanceByKey(workflowInstanceKey);
        if (!result) {
            throw 'workflow instance does not exit';
        }
    }

    async _getFileMd5(data) {
        var fsHash = crypto.createHash('md5');
        fsHash.update(data);
        return fsHash.digest('hex');
    }
}

module.exports = WorkflowFramework;

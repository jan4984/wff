/**
 *     历史记录。SQL。数据用JSON.stringify()。历史操作表只能insert、query，不能update
 *     对象/文件 存储。minio
 *     权限检查。SQL。管理员、操作员。管理员可以维护每一步哪些操作员
 */
const ZB = require('zeebe-node');
const uuid = require('uuid/v4');

class WorkflowFramework {
    constructor() {
        this.zbClient = null;

    }

    async initialize(props) {
        if (!this.zbClient) {
            let zbClient = new ZB.ZBClient(props.zbAddr);
            let topology = await zbClient.topology();
            console.log(topology);
            this.zbClient = zbClient;
        }
    }

    /*
     * Deploy workflow(s)
     * @param {String|Object|Array} workflow - A path or array of paths to .bpmn files or an object describing the workflow
     * @returns {Promise<DeployWorkflowResponse>} workflow information
     */
    async deployWorkflow(workflow) {
        this._initCheck();
        await this.zbClient.deployWorkflow(workflow);
    }

    /*
     * Create a workflow instance
     * @param {String} bpmnProcessId
     * @param {Object} [vars] - Payload to pass in to the workflow
     * @returns {Promise<CreateWorkflowInstanceResponse>} workflow instance information
     */
    async createWorkflowInstance(bpmnProcessId, vars) {
        this._initCheck();
        let result = await this.zbClient.createWorkflowInstance(bpmnProcessId, vars);
        await this.zbClient.setVariables({instanceKey: result.workflowInstanceKey});
        //await this.opService.addWorkflowInstance(result.workflowInstanceKey);
        return result;
    }

    /*
     * Delete a workflow instance
     * @param {String} workflowInstanceKey
     * @returns {Promise<>}
     */
    async deleteWorkflowInstance(workflowInstanceKey) {
        this._initCheck();
        let result = await this.zbClient.cancelWorkflowInstance(workflowInstanceKey);
        //await this.opService.removeWorkflowInstance(workflowInstanceKey);
    }

    /*
     * Append a workflow operation
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @param {Object|String} [data] - Variables published with the message
     * @returns {Promise<>}
     */
    async addOperation(workflowInstanceKey, processName, data) {
        this._initCheck();
        let vars = {};
        vars[processName] = data;
        await this.zbClient.publishMessage({
            name: processName,
            messageId: uuid.v4(),
            correlationKey: workflowInstanceKey,
            variables: vars,
            timeToLive: 10000,
        });
    }

    /*
     * Get the data of a workflow operation(the latest one)
     * @param {String} workflowInstanceKey
     * @param {String} processName
     * @returns {Promise<Object>}
     */
    async getOperation(workflowInstanceKey, processName) {

    }

    _initCheck() {
        if (!this.zbClient) {
            throw 'disconnect from Zeebe broker';
        }
    }
}

module.exports = WorkflowFramework;

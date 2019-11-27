const WorkflowFramwork = require('./workflow-framework');

class CAEWorkflow extends WorkflowFramwork {
    constructor(hooks) {
        super();

        this.hooks = hooks;
        this.jobHandler['*'] = this._jobHandler.bind(this);
    }

    async _jobHandler(job, complete) {
        console.log('work as service type', job.type, job.variables);
        const pos = job.type.indexOf('_');
        if (pos === -1 || pos === 0 || pos === job.type.length) {
            console.log('invalid service type');
            await complete.failure();
        } else {
            const prefix = job.type.slice(0, pos).toLowerCase();
            const message = job.type.slice(pos + 1);
            if (job.variables[message]) {
                await this.opService.addOperation(job.workflowInstanceKey, message, job.variables[message].data, job.variables[message].files);
            }

            if (prefix === 'trans') {
                this.addOperation(job.workflowInstanceKey, message, job.variables[message]);
            }

            if (this.hooks[message]) {
                await this.hooks[message](job.workflowInstanceKey, job.variables[message])
                    .catch(e => console.log('hook error', e));
            }
            await complete.success();
        }
    }
}

module.exports = CAEWorkflow;

const uuid = require('uuid/v4');
const fs = require('fs');
const DBService = require('./db-service');
var crypto = require('crypto');
const {OperationHistoryService} = require('./op-history-service');
const {BpmnEngine} = require('./engine');

const {Logger} = require('./utils');
const log = Logger({tag:'workflow-instance'});

class WorkflowInstance {
    constructor(id, engine) {
        this.id = id;
        this.engine = engine;
        this.vars = {};
        this.jobHandlers = {};
        this.dbService = new OperationHistoryService();

        this.next = null;
        this.complete = {
            success: this._success.bind(this),
            failure: this._failure.bind(this),
        };
    }

    message(task) {
        if (task === this.next.name) {

        }
    }

    async initialize() {
        const instance = await this.dbService.getInstanceId(this.id);
        const operation = await this.dbService.getLastOperationByInstanceId(this.id);
        if (instance)
        this.vars = instance.variables;
        operation && (this.next = operation.name);
    }

    _process() {
        !this.next && (this.next = {isStart: true});
        this.next = this.engine.nextProcess(this.next, this.vars);

        if (this.next.isServiceTask) {
            if (!this.jobHandlers.hasOwnProperty(this.next.name)) {
                log.warning('job', this.next.name, 'has no handler, instance id=', this.instanceId);
            } else {
                const job = {};
                this.jobHandlers[this.next.name](job)
                    .catch(e => this.complete.failure(e));
            }
        } else if (this.next.isEnd) {

        }
    }

    _success(vars) {

        this._process();
    }

    _failure() {

    }
}

module.exports = WorkflowInstance;

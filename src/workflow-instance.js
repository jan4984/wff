const uuid = require('uuid/v4');
const fs = require('fs');
const EventEmitter = require('events');
const DBService = require('./db-service');
var crypto = require('crypto');
const {OperationHistoryService} = require('./op-history-service');
const {BpmnEngine} = require('./engine');

const {Logger} = require('./utils');
const log = Logger({tag:'workflow-instance'});

class WorkflowInstance extends EventEmitter {
    constructor(id, workflow) {
        super();
        this.id = id;
        this.vars = {};
        this.engine = workflow.engine;
        this.handlers = workflow.handlers;
        this.dbService = new OperationHistoryService();

        this.next = [];
        this.dones = {isStart: true};
    }

    async initialize() {
        const instance = await this.dbService.getInstanceById(this.id);
        const operation = await this.dbService.getLastOperationByInstanceId(this.id);
        if (instance) {
            this.vars = instance.variables;
        }
        if (operation) {
            this.dones = this.engine.getTaskByName(operation.name);
        }
        this._next();
    }

    getCurrentTasks() {
        const currentTasks = [];
        this.next.forEach(task => currentTasks.push(task.name));
        return currentTasks;
    }

    async message(task, vars, files) {
        for (const item of this.next) {
            if (item.isReceiveTask && item.message === task) {
                if (this.handlers[task] && this.handlers[task].preHandler) {
                    await this.handlers[task].preHandler(this.id, task, this.vars);
                }

                try {
                    const dones = this.dones;
                    const params = this.vars;
                    dones.push(item);
                    params[task] = {};
                    params[task].data = vars || {};
                    params[task].files = files || [];

                    const next = this.engine.nextProcess(dones, params);
                    if (next[0].isParallelGateway) {
                        this.dones.push(item);
                        return true;
                    }
                    await this.dbService.addOperation(this.id, task, vars);
                    await this.dbService.updateInstance(this.id, this.vars);
                    this.dones = [];
                    this.vars = params;
                    this.next = next;
                    this._process();

                    if (this.handlers[task] && this.handlers[task].postHandler) {
                        await this.handlers[task].postHandler(this.id, task, this.vars);
                    }
                    return true;
                } catch (e) {
                    console.log(e);
                    throw '提交的参数格式不正确';
                }
            }
        }
        throw '流程不处于"' + task + '"阶段';
    }

    async _next() {
        this.next = this.engine.nextProcess(this.dones, this.vars);
        this.dones = [];
        this._process();
    }

    async _process() {
        this.next.forEach(task => {
            if (task.isServiceTask) {
                if (!this.handlers.hasOwnProperty(task.name)) {
                    log.warn('job', this.next.name, 'has no handler, instance id=', this.id);
                } else {
                    const complete = {
                        success: this._success.bind(this, task),
                        failure: this._failure.bind(this, task)
                    };
                    this.handlers[task.name](task.id, task.name, this.vars, complete)
                        .catch(e => complete.failure(e));
                }
            } else if (task.isEnd) {
                this.dbService.endInstance(this.id);
                this.emit('end', this.id);
            }
        });
    }

    async _success(task, vars) {
        await this.dbService.addOperation(this.id, task.name, vars);
        this.vars[task.name] = {};
        this.vars[task.name].data = vars;
        this.dones.push(task);
        this._next();
    }

    _failure(task, vars) {

    }
}

module.exports = WorkflowInstance;

const EventEmitter = require('events');
const {OperationHistoryService} = require('./op-history-service');
const {parse} = require('./engine');

const {Logger} = require('./utils');
const log = Logger({tag:'workflow-instance'});

class WorkflowInstance extends EventEmitter {
    constructor() {
        super();

        this.handlers = {};
        this.hookers = {};
        this.dbService = new OperationHistoryService();
    }

    // async initialize() {
    //     const instance = await this.dbService.getInstanceById(this.id);
    //     const operation = await this.dbService.getLastOperationByInstanceId(this.id);
    //     if (instance) {
    //         this.vars = instance.variables;
    //     }
    //     if (operation) {
    //         this.dones = this.engine.getTaskByName(operation.name);
    //     }
    //     this._next();
    // }
    //
    // getCurrentTasks() {
    //     const currentTasks = [];
    //     this.next.forEach(task => currentTasks.push(task.name));
    //     return currentTasks;
    // }

    // async message(task, vars, files) {
    //
    //     for (const item of this.next) {
    //         if (item.isReceiveTask && item.message === task) {
    //             if (this.hookers[task] && this.hookers[task].preHandler) {
    //                 await this.hookers[task].preHandler(this.id, task, this.vars);
    //             }
    //
    //             try {
    //                 this.dones.push(item);
    //                 this.vars[task] = {data: vars || {}, files: files || []};
    //                 const next = this.engine.nextProcess(this.dones, this.vars);
    //                 await this.dbService.addOperation(this.id, task, vars, files);
    //                 await this.dbService.updateInstance(this.id, this.vars);
    //                 if (next.length >= 1 && !next[0].isParallelGateway) {
    //                     this.dones = [];
    //                     this.next = next;
    //                     this._process();
    //                 }
    //             } catch (e) {
    //                 console.log(e);
    //                 this.dones.pop();
    //                 delete this.vars[task];
    //                 throw '提交的参数格式不正确';
    //             }
    //
    //             if (this.hookers[task] && this.hookers[task].postHandler) {
    //                 await this.hookers[task].postHandler(this.id, task, this.vars);
    //             }
    //             return;
    //         }
    //     }
    //     throw '流程不处于"' + task + '"阶段';
    // }

    async process(instanceId, task, vars, files) {
        let instance = await this.dbService.getInstanceById(instanceId);
        if (!instance) {
            throw 'workflow instance ' + instanceId + ' does not exist';
        } else if (instance.status !== 'processing') {
            throw 'workflow instance ' + instanceId + ' does not in process';
        }

        let workflow = await this.dbService.getWorkflowById(instance.workflowId);

        const engine = parse(workflow.content);
        const dones = instance.lastTasks.length
            ? instance.lastTasks.map((v, i) => { return engine.getTaskByName(v); })
            : {isStart: true};
        const next = engine.nextProcess(dones, instance.variables);

        for (const item of next) {
            if (item.isReceiveTask) {
                if (item.message === task) {
                    await this._onReceiveTask(instance, task, vars, files);
                }
            } else if (item.isServiceTask()) {
                this._onServiceTask();
            } else if (item.isEnd) {
                this._onEnd();
            }
        }

        if (task) {
            throw '流程不处于"' + task + '"阶段';
        }
    }

    async _onReceiveTask(instance, task, vars, files) {
        if (this.hookers[task] && this.hookers[task].preHandler) {
            await this.hookers[task].preHandler(this.id, task);
        }

        try {
            const insVars = Object.assign(instance.variables, {[task]: {data: vars, files: files}});
            console.log(await this.dbService.addOperation({
                name: task,
                data: vars,
                files: files,
                instanceId: instance.id
            }));
            await this.dbService.updateInstance(instance.id, {
                variables: insVars,
                lastTasks: []
            });

            this.process(instance.id);
        } catch (e) {
            console.log(e);
            throw '提交的参数格式不正确';
        }

        if (this.hookers[task] && this.hookers[task].postHandler) {
            await this.hookers[task].postHandler(instanceId, task, this.vars);
        }
    }

    async _onServiceTask(instance, task, vars, files) {
        if (!this.handlers.hasOwnProperty(task)) {
            log.warn('job', task, 'has no handler, instance id', instance.id);
        } else {
            const complete = {
                success: this._success.bind(this, task),
                failure: this._failure.bind(this, task)
            };
            this.handlers[task](this.id, task, vars, complete)
                .catch(e => complete.failure(e));
        }
    }

    async _onEnd(instance) {
        await this.dbService.endInstance(instance.id);
        this.emit('end', instance.id);
    }

    async _success(task, vars) {
        // await this.dbService.addOperation(this.id, task.name, vars);
        // this.vars[task.name] = {};
        // this.vars[task.name].data = vars;
        // this.dones.push(task);
        // this._next();
    }

    _failure(task, vars) {

    }
}

module.exports = WorkflowInstance;

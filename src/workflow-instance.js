const EventEmitter = require('events');
const {OperationHistoryService} = require('./op-history-service');
const {parse} = require('./engine');

const {Logger} = require('./utils');
const log = Logger({tag:'workflow-instance'});

class WorkflowInstance extends EventEmitter {
    constructor(hookers) {
        super();

        this.handlers = {};
        this.hookers = hookers;
        this.dbService = new OperationHistoryService();
    }

    addHandler(name, handler) {
        this.handlers[name] = handler;
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
        const instance = await this.dbService.getInstanceById(instanceId);
        if (!instance) {
            throw 'workflow instance ' + instanceId + ' does not exist';
        } else if (instance.status !== 'processing') {
            throw 'workflow instance ' + instanceId + ' does not in process';
        }

        const workflow = await this.dbService.getWorkflowById(instance.workflowId);
        const engine = parse(workflow.content);
        const dones = instance.lastTasks.length
            ? instance.lastTasks.map((v, i) => { return engine.getTaskByName(v); })
            : {isStart: true};
        const next = engine.nextProcess(dones, instance.variables);

        let inProc = false;
        for (const item of next) {
            if (item.isReceiveTask && item.message === task) {
                inProc = true;
                await this._onReceiveTask(engine, instance, task, vars, files);
            } else if (item.isServiceTask) {
                inProc = true;
                this._onServiceTask(engine, instance, item.name, vars);
            } else if (item.isEnd) {
                inProc = true;
                this._onEnd(instance);
            }
        }

        if (task && !inProc) {
            throw '流程不处于"' + task + '"阶段';
        }
    }

    async _onReceiveTask(engine, instance, task, vars, files) {
        try {
            if (this.hookers[task] && this.hookers[task].preHandler) {
                await this.hookers[task].preHandler(instance.id, task, instance.variables);
            }

            const dones = [task].concat(instance.currentTasks).map((v, i) => { return engine.getTaskByName(v)});
            const instVars = Object.assign(instance.variables, {[task]: {data: vars, files: files}});
            const next = engine.nextProcess(dones, instVars);

            let lastTasks = [];
            let currentTasks = [];
            if (next && next[0] && next[0].isParallelGateway) {
                lastTasks = instance.lastTasks;
                currentTasks = instance.currentTasks.concat(task);
            } else {
                lastTasks = instance.currentTasks.concat(task);
                currentTasks = [];
            }

            await this.dbService.addOperation({
                name: task,
                data: vars,
                files: files,
                instanceId: instance.id
            });
            await this.dbService.updateInstance(instance.id, {
                variables: instVars,
                lastTasks: lastTasks,
                currentTasks: currentTasks
            });

            this.process(instance.id);

            if (this.hookers[task] && this.hookers[task].postHandler) {
                await this.hookers[task].postHandler(instance.id, task, instVars);
            }
        } catch (e) {
            console.log(e);
            throw '提交的参数格式不正确';
        }
    }

    async _onServiceTask(engine, instance, task, vars) {
        if (!this.handlers.hasOwnProperty(task)) {
            log.warn('job', task, 'has no handler, instance id', instance.id);
        } else {
            const complete = {
                success: this._success.bind(this, engine, instance, task),
                failure: this._failure.bind(this, engine, instance, task)
            };
            const instVars = Object.assign(instance.variables, {[task]: {data: vars}});
            this.handlers[task](instance.id, task, instVars, complete)
                .catch(e => complete.failure(e));
        }
    }

    async _onEnd(instance) {
        await this.dbService.endInstance(instance.id);
        //this.emit('end', instance.id);
    }

    async _success(engine, instance, task, vars) {
        const dones = [task].concat(instance.currentTasks).map((v, i) => { return engine.getTaskByName(v)});
        const instVars = Object.assign(instance.variables, {[task]: {data: vars, files: []}});
        const next = engine.nextProcess(dones, instVars);

        let lastTasks = [];
        let currentTasks = [];
        if (next && next[0] && next[0].isParallelGateway) {
            lastTasks = instance.lastTasks;
            currentTasks = instance.currentTasks.concat(task);
        } else {
            lastTasks = instance.currentTasks.concat(task);
            currentTasks = [];
        }

        await this.dbService.addOperation({
            name: task,
            data: vars,
            files: [],
            instanceId: instance.id
        });
        await this.dbService.updateInstance(instance.id, {
            variables: instVars,
            lastTasks: lastTasks,
            currentTasks: currentTasks
        });

        this.process(instance.id);
    }

    _failure(task, vars) {

    }
}

module.exports = WorkflowInstance;

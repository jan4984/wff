const db = require('../models');
const Op = db.Sequelize.Op;

const {Logger} = require('./utils');
const log = Logger({tag:'operation-history-service'});

class OperationHistoryService {
    constructor(props){
        this.props = props;
    }

    async getWorkflows() {
        return db.workflow.findAll({where: {status: {[Op.ne]: 'deleted'}}});
    }

    async addWorkflow(workflow) {
        return db.sequelize.transaction(t => {
            return (workflow.default ? db.workflow.update({default: false}, {where: {}, transaction: t}) : Promise.resolve())
                .then(() => { return db.workflow.create(workflow, {transaction: t}) });
        });
    }

    async deleteWorkflow(workflowId) {
        return db.workflow.update({status: 'deleted'}, {where: {id: workflowId}});
    }

    async getInstances() {
        return db.instance.findAll({where: {status: {[Op.ne]: 'deleted'}}});
    }

    async getInstancesByWorkflowId() {
        return db.instance.WFI.findAll({})
    }

    async getInstanceById(instanceId) {
        return db.instance.findOne({where: {id: instanceId}});
    }

    async getInstancesByWorkflowId(workflowId) {

    }

    async getOperationsByInstanceId(instanceId) {
        return db.operation.findAll({where: {instanceId: instanceId}});
    }

    async addInstance(instance) {
        return db.instance.create(instance);
    }

    async updateInstance(instanceId, vars) {
        return db.instance.update({variables: vars}, {where: {id: instanceId}});
    }

    async deleteInstance(instanceId) {
        return db.instance.update({status: 'deleted'}, {where: {id: instanceId}});
    }

    async endInstance(instanceId) {
        return db.instance.update({status: 'end'}, {where: {id: instanceId}});
    }

    async getLastOperationByInstanceId(instanceId) {
        return db.operation.findOne({
            where: {instanceId: instanceId},
            order: [['createdAt', 'DESC']],
            limit: 1
        });
    }

    async getOperationByInstanceId(instanceId, processName) {
        return db.operation.findOne({
            where: {instanceId: instanceId, name: processName},
            order: [['createdAt', 'DESC']],
            limit: 1
        });
    }

    async getDefaultWorkflow() {
        return db.workflow.findOne({where: {default: true}});
    }

    async addWorkflowInstance(instanceKey, workflowId) {
        return db.instance.create({id: instanceKey, workflowId: workflowId});
    }

    async removeWorkflowInstance(instanceKey) {
        return db.instance.update({deleted: true}, {where: {id: instanceKey}});
    }

    async getWorkflowInstanceByKey(instanceKey) {
        return db.instance.findOne({where: {id: instanceKey}});
    }

    async getInstanceById(instanceId) {
        return db.instance.findOne({where: {id: instanceId}});
    }

    // async addFile(instanceKey, file) {
    //     return db.file.create({path: file, workflowInstanceId: instanceKey});
    // }

    // async addOperation(instanceKey, serviceType, fileList, data) {
    //     if (!instanceKey || typeof instanceKey != 'string') {
    //         throw 'instanceKey not a string';
    //     }
    //     if (!serviceType || typeof serviceType != 'string') {
    //         throw 'serviceType not a string';
    //     }
    //     if (!data || typeof data != 'object') {
    //         throw 'operation data not an object';
    //     }
    //
    //     if (!fileList) {
    //         fileList = [];
    //     }
    //     const record = await (await DBSerivce.get()).transaction(t => {
    //         let fileAction;
    //         if (fileList.length === 0) {
    //             fileAction = Promise.resolve();
    //         } else {
    //             fileAction = db.file.update({
    //                 attached: true,
    //             }, {
    //                 where: {
    //                     id: {[Op.in]: fileList},
    //                     workflowInstanceId: instanceKey
    //                 },
    //                 transaction: t
    //             });
    //         }
    //         return fileAction.then(() => db.operation.create({
    //             operationName: serviceType,
    //             operationData: data,
    //             workflowInstanceId: instanceKey,
    //         }, {
    //             transaction: t
    //         })).catch(err => {
    //             log.error(`add operation failed:${err}`);
    //             return Promise.resolve({id: ''});
    //         });
    //     });
    //
    //     return record;
    // }

    async findOperationByWorkflowId(wfiId, userId){
        if(wfiId && userId){
            return await this.findOperationByUserId(userId, wfiId);
        }
        if(!wfiId){
            throw 'no workflow instance id specified';
        }

        const ops = await db.operation.findAll({
            where:{
                workflowInstanceId: wfiId
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });
        return ops;
    }

    async addOperation(instanceKey, processName, data, files) {
        if (!instanceKey) {
            throw 'no workflow instance key specified';
        } else if (!processName) {
            throw 'no process name specified';
        }

        files || (files = []);
        const record = await (db.sequelize.transaction(t => {
            let fileAction;
            if (files.length === 0) {
                fileAction = Promise.resolve();
            } else {
                fileAction = db.file.update({
                    attached: true,
                }, {
                    where: {
                        id: {[Op.in]: files},
                        instanceId: instanceKey
                    },
                    transaction: t
                });
            }
            return fileAction.then(() => db.operation.create({
                name: processName,
                data: data,
                files: files,
                instanceId: instanceKey,
            }, {
                transaction: t
            }));
        }));
        return record;
    }

    async findOperationByInstanceKey(instanceKey, processName) {
        if (!instanceKey) {
            throw 'no workflow instance key specified';
        } else if (processName) {
            let result = await db.operation.findOne({
                attributes: ['data', 'files', 'createdAt'],
                where: {
                    instanceId: instanceKey,
                    name: processName
                },
                order: [['createdAt', 'DESC']]
            });
            return result;
        }
    }

    async clearUnattachedFile(wfiId){
        if(!wfiId){
            throw 'no workflow instance specified';
        }

        const removedCount = await db.file.destroy({
            where:{
                [Op.and]:[{workflowInstanceId:wfiId}, {attached: false}]
            }
        });

        return removedCount;
    }

    async findOperationByUserId(userId, wfiId){
        if(!userId){
            throw 'no userId specified';
        }
        const where = {
            where:{
                userId: userId
            },
            order: [
                ['createdAt', 'DESC']
            ]
        };

        if(wfiId){
            where.where = {
                [Op.and] : [where.where, {workflowInstanceId: wfiId}]
            };
        }
        const ops = await db.operation.findAll(where);
        return ops;
    }
}

module.exports = {
    OperationHistoryService
};

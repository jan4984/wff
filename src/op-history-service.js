const {Logger} = require('./utils');
const {Sequelize, Op} = require('sequelize');
const DBSerivce = require('./db-service');

const log = Logger({tag:'operation-history-service'});

class OperationHistoryService {
    constructor(props){
        this.props = props;
    }

    async getWorkflows() {
        return DBSerivce.models.WF.findAll({where: {status: {[Op.ne]: 'deleted'}}});
    }

    async addWorkflow(workflow) {
        const db = await DBSerivce.get();
        return db.transaction(t => {
            return (workflow.default ? DBSerivce.models.WF.update({default: false}, {where: {}, transaction: t}) : Promise.resolve())
                .then(() => { return DBSerivce.models.WF.create(workflow, {transaction: t}) });
        });
    }

    async deleteWorkflow(workflowId) {
        return DBSerivce.models.WF.update({status: 'deleted'}, {where: {id: workflowId}});
    }

    async getInstances() {
        return DBSerivce.models.WFI.findAll({where: {status: {[Op.ne]: 'deleted'}}});
    }

    async getInstancesByWorkflowId() {
        return DBSerivce.models.WFI.findAll({})
    }

    async getInstanceById(instanceId) {
        return DBSerivce.models.WFI.findOne({where: {id: instanceId}});
    }

    async getInstancesByWorkflowId(workflowId) {

    }

    async getOperationsByInstanceId(instanceId) {
        return DBSerivce.models.OP.findAll({where: {instanceId: instanceId}});
    }

    async addInstance(instance) {
        return DBSerivce.models.WFI.create(instance);
    }

    async updateInstance(instanceId, vars) {
        return DBSerivce.models.WFI.update({variables: vars}, {where: {id: instanceId}});
    }

    async deleteInstance(instanceId) {
        return DBSerivce.models.WFI.update({status: 'deleted'}, {where: {id: instanceId}});
    }

    async endInstance(instanceId) {
        return DBSerivce.models.WFI.update({status: 'end'}, {where: {id: instanceId}});
    }

    async getLastOperationByInstanceId(instanceId) {
        return DBSerivce.models.OP.findOne({
            where: {instanceId: instanceId},
            order: [['createdAt', 'DESC']],
            limit: 1
        });
    }

    async getOperationByInstanceId(instanceId, processName) {
        return DBSerivce.models.OP.findOne({
            where: {instanceId: instanceId, name: processName},
            order: [['createdAt', 'DESC']],
            limit: 1
        });
    }

    async getDefaultWorkflow() {
        return DBSerivce.models.WF.findOne({where: {default: true}});
    }

    async addWorkflowInstance(instanceKey, workflowId) {
        return DBSerivce.models.WFI.create({id: instanceKey, workflowId: workflowId});
    }

    async removeWorkflowInstance(instanceKey) {
        return DBSerivce.models.WFI.update({deleted: true}, {where: {id: instanceKey}});
    }

    async getWorkflowInstanceByKey(instanceKey) {
        return DBSerivce.models.WFI.findOne({where: {id: instanceKey}});
    }

    async getInstanceById(instanceId) {
        return DBSerivce.models.WFI.findOne({where: {id: instanceId}});
    }

    // async addFile(instanceKey, file) {
    //     return DBSerivce.models.File.create({path: file, workflowInstanceId: instanceKey});
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
    //             fileAction = DBSerivce.models.File.update({
    //                 attached: true,
    //             }, {
    //                 where: {
    //                     id: {[Op.in]: fileList},
    //                     workflowInstanceId: instanceKey
    //                 },
    //                 transaction: t
    //             });
    //         }
    //         return fileAction.then(() => DBSerivce.models.OP.create({
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

        const ops = await DBSerivce.models.OP.findAll({
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
        const record = await (await DBSerivce.get()).transaction(t => {
            let fileAction;
            if (files.length === 0) {
                fileAction = Promise.resolve();
            } else {
                fileAction = DBSerivce.models.File.update({
                    attached: true,
                }, {
                    where: {
                        id: {[Op.in]: files},
                        instanceId: instanceKey
                    },
                    transaction: t
                });
            }
            return fileAction.then(() => DBSerivce.models.OP.create({
                name: processName,
                data: data,
                files: files,
                instanceId: instanceKey,
            }, {
                transaction: t
            }));
        });
        return record;
    }

    async findOperationByInstanceKey(instanceKey, processName) {
        if (!instanceKey) {
            throw 'no workflow instance key specified';
        } else if (processName) {
            let result = await DBSerivce.models.OP.findOne({
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

        const removedCount = await DBSerivce.models.File.destroy({
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
        const ops = await DBSerivce.models.OP.findAll(where);
        return ops;
    }
}

module.exports = {
    OperationHistoryService
};

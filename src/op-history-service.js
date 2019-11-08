const {Logger} = require('./utils');
const {Sequelize, Op} = require('sequelize');
const DBSerivce = require('./db-service');

const log = Logger({tag:'operation-history-service'});

class OperationHistoryService {
    constructor(props){
        this.props = props;
    }

    async addOperation(serviceTask, data, userId, wfiId){
        if(!serviceTask || typeof serviceTask != 'string'){
            throw 'service task not a string';
        }
        if(!data || typeof data != 'object'){
            throw 'operation data not a object';
        }
        if(!userId || !wfiId){
            throw 'operation must have a user and workflow instance';
        }

        const created = DBSerivce.models.OP.create({
            workflowServiceTask: serviceTask,
            operationData:JSON.stringify({data}),
            userId: userId,
            workflowInstanceId:wfiId,
        });

        return created;
    }

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
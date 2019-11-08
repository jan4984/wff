const {Client} = require('minio');
const {ActsWithRollback} = require('./utils');
const uuid = require('uuid/v4');
const {Logger} = require('./utils');
const DBService = require('./db-service');

const log = Logger({tag:'file-service'});

class FileService  {
    constructor(props){
        this.props = props;
        const {endPoint,port,accessKey,secretKey} = props;
        this.fs = new Client({
            endPoint, port, accessKey, secretKey,
            useSSL: false,
        });
    }

    async init(){
        const exists = await this.fs.bucketExists(this.props.bucketName);
        if(!exists) {
            log.info(`bucket ${this.props.bucketName} not exists, to create it`);
            await this.fs.makeBucket(this.props.bucketName);
        }else{
            log.info(`bucket ${this.props.bucketName} exists`);
        }
    }

    async upload(name, stream, wfiId) {
        if (!name || typeof (name) !== 'string') {
            throw 'name is not a string';
        }
        if (!stream) {
            throw 'stream not provided';
        }
        if (!wfiId || typeof (wfiId) !== 'string') {
            throw 'workflow instance not specified'
        }
        const id = uuid();
        const save = [
            this.fs.putObject(this.props.bucketName, id, stream, {filename: name}),
            this.fs.removeObject(this.props.bucketName, id),
        ];
        const record = [
            DBService.models.File.create({
                id: id,
                workflowInstanceId: wfiId,
                attached: false
            }),
            DBService.models.File.destroy({
                where:{
                    id: id
                }}),
        ];
        try{
            await ActsWithRollback([save, record]);
        }catch (err){
            return '';
        }
        return id;
    }

    async get(id) {
        const stream = await this.fs.getObject(this.props.bucketName, id);
        const state = await this.fs.statObject(this.props.bucketName, id);
        return {
            id:id,
            name:state.metaData.filename,
            size:state.size,
            timestamp:state.lastModified,
            stream
        }
    }

    async del(id){
        await this.fs.removeObject(this.props.bucketName, id);
    }

    async clear(){
        await this.fs.removeBucket(this.props.bucketName);
    }
};

module.exports =  {
    FileService
};

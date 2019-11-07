const {Client} = require('minio');
const uuid = require('uuid/v4');
const {Logger} = require('./utils');

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

    async upload(name, stream){
        const id = uuid();
        await this.fs.putObject(this.props.bucketName, id, stream, {filename:name});
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

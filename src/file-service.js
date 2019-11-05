const {Client} = require('minio');
const uuid = require('uuid/v4');
const winston = require('winston');

const log = winston.createLogger({
    defaultMeta: {tag: 'file-service'}
});

class FileService  {
    constructor(props){
        this.props = props;
        const {endPoint,port,accessKey,secretKey} = props;
        this.fs = new Client({
            endPoint, port, accessKey, secretKey,
            useSSL: false,
        });
        this.fs.bucketExists(props.bucketName, (err, exists)=>{
            if(err) {
                log.error(`check bucket ${props.bucketName} failed because: $err`);
                throw err;
            }

            if(!exists){
                this.fs.makeBucket(props.bucketName, err=>{
                    if(err){
                        log.error(`crate bucket ${props.bucketName} failed because: $err`);
                        throw err;
                    }
                });
            }
        });
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

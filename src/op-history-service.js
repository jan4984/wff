const {Logger} = require('./utils');

const log = Logger({tag:'operation-history-service'});

class OperationHistoryService {
    constructor(props){
        this.props = props;
    }

    async connectDB(){
        await require('./db-service').init(this.props);
        this.db = require('./db-service').db;
    }

    async disconnectDB(){
        if(this.db) await this.db.close();
    }
}

module.exports = {
    OperationHistoryService
};
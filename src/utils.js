const winston = require('winston');

const defaultConfig = {
    transports:[
        new winston.transports.Console()
    ]
};

function Logger(meta) {
    return winston.createLogger(Object.assign({}, defaultConfig, {
        defaultMeta: {tag: 'file-service'}
    }));
}

module.exports = {
    Logger
};
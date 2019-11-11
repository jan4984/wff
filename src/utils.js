const winston = require('winston');

const defaultConfig = {
    transports:[
        new winston.transports.Console()
    ]
};

function Logger(meta) {
    return winston.createLogger(Object.assign({}, defaultConfig, {
        defaultMeta: meta
    }));
}

const log = Logger({tag:'util'});

function normalizeAct(act){
    if (act.constructor.name === "Promise") {
        return act;
    }

    try{
        return Promise.resolve(act());
    }catch(err){
        return Promise.reject(err);
    }
}

function ActsWithRollback(ars) {
    const done = [];
    const rollbackAllDone = items=>Promise.all(items.map(i => {
        log.info(`submit rollback ${i}`);
        const rollback = ars[i][1];
        return normalizeAct(rollback).then(undefined, err => {
                log.error(`rollback error ignored: ${err}`);//why rollback fail??
            });
    }));

    return Promise.all(ars.map(([act, rollback], idx)=> {
        const i = idx;
        return normalizeAct(act).then(() => {
            done.push(i);
        }, err=>{
            log.error(`${i} actor failed: ${err}`);
            return Promise.resolve(err)
        });//
    })).then(()=>{ //never rejected because we resolve even in error
        if(done.length != ars.length){
            log.warn(`promises not all full-filled: ${done.length} <> ${ars.length}`);
            return rollbackAllDone(done).then(()=>Promise.reject('partly full-filled'));
        }

        return Promise.resolve();
    });
}

module.exports = {
    Logger, ActsWithRollback
};
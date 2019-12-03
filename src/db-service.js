const { Sequelize, Model, QueryTypes, DataTypes } = require('sequelize');

let db = null;

class User extends Model{

}

class OP extends Model{

}

class WF extends Model {

}

class WFI extends Model{

}

class File extends Model{

}

async function get(props) {
    if (db) return db;
    db = new Sequelize(props.database, props.username, props.password, {
        dialect: 'postgres',
        host: props.host,
        port: props.port,
    });
    OP.init({
        operationName: {type: DataTypes.STRING, allowNull: false},
        operationData: {type: DataTypes.JSON, allowNull: false},
        fileData: {type: DataTypes.JSON, allowNull: true},
    }, {
        sequelize: db,
        modelName: 'operation'
    });
    WF.init({
        file: {type: DataTypes.STRING, allowNull: false},
        workflowKey: {type: DataTypes.STRING, allowNull: false},
        bpmnProcessId: {type: DataTypes.STRING, allowNull: false},
        version: {type: DataTypes.INTEGER, allowNull: true},
        serviceType: {type: DataTypes.JSON, allowNull: true},
        default: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
    }, {
        sequelize: db,
        modelName: 'workflow'
    });
    WFI.init({
        id: {type: DataTypes.STRING, primaryKey: true},
        //TODO: user role table
    }, {
        sequelize: db,
        modelName: 'workflowInstance'
    });
    File.init({
        id: {type: DataTypes.STRING, primaryKey: true},
        attached: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
    }, {
        sequelize: db,
        modelName: 'file'
    });

    WF.hasMany(WFI);
    WFI.hasMany(OP);
    WFI.hasMany(File);
    File.belongsTo(WFI);

    //OP.belongsTo(User);
    OP.belongsTo(WFI);

    //WFI.belongsToMany(User, {through: 'WorkflowInstanceUser'});
    //User.belongsToMany(WFI, {through: 'WorkflowInstanceUser'});

    await db.authenticate();
    await db.sync({force:!!props.recreate});
    return db;
}

async function dropAll(){
    if(!db) return;
    await OP.drop();
    await WFI.drop();
    await User.drop();
    await WF.drop();
}

module.exports = {
    get,dropAll,
    models:{OP, WFI, File, WF}
};
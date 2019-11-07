const { Sequelize, Model, QueryTypes, DataTypes } = require('sequelize');

let db = null;

class User extends Model{

}

class OP extends Model{

}

class WFI extends Model{

}

async function get(props){
    if(db) return db;
    db = new Sequelize(props.database, props.username, props.password, {
        dialect: 'postgres',
        host: props.host,
        port:props.port,
    });
    User.init({
        name:{type:DataTypes.STRING, allowNull: false},//the unique id in authType, cached from external user system
        authType:{type:DataTypes.STRING, allowNull: false},//authType is 'iFLYOS' or 'Domain'
    }, {
        sequelize:db,
        modelName:'user'
    });
    OP.init({
        workflowServiceTask:{type:DataTypes.STRING, allowNull: false},
        operationData:{type:DataTypes.TEXT, allowNull: false},
    },{
        sequelize:db,
        modelName:'operation'
    });
    WFI.init({
        id:{type:DataTypes.STRING, primaryKey:true},
        //TODO: user role table
    },{
        sequelize:db,
        modelName:'workflowInstance'
    });

    User.hasMany(OP);
    WFI.hasMany(OP);

    OP.belongsTo(User);
    OP.belongsTo(WFI);

    WFI.belongsToMany(User, {through:'WorkflowInstanceUser'});
    User.belongsToMany(WFI, {through:'WorkflowInstanceUser'});

    await db.authenticate();
    await db.sync({force:!!props.test});
    return db;
}

module.exports = {
    get,
    models:{User, OP, WFI}
};
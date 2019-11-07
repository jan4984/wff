const { Sequelize, Model, QueryTypes, DataTypes } = require('sequelize');

let db;

class User extends Model{

}

class OP extends Model{

}

async function init(props){
    if(db) return;
    db = new Sequelize(props.database, props.username, props.password, {
        dialect: 'postgres',
        host: props.host,
        port:props.port,
    });
    User.init({
        name:{type:DataTypes.STRING, allowNull: false},//the unique id in authType
        authType:{type:DataTypes.STRING, allowNull: false},//authType is 'iFLYOS' or 'Domain'
    }, {
        db,
        modelName:'user'
    });
    OP.init({
        workflowServiceTask:{type:DataTypes.STRING, allowNull: false},
        operationData:{type:DataTypes.STRING, allowNull: false},
    },{
        db,
        modelName:'OP'
    });
    WFI.init({
        id:{type:DataTypes.STRING, primaryKey:true},
        //TODO: user role table
    });
    OP.belongsTo(User);
    User.hasMany(OP);
    WFI.hasMany(User);
    OP.belongsTo(WFI);
    await db.authenticate();
    await db.sync();
}

module.exports = {
    db,
    init
};
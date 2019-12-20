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
    if (!props.db) {
        db = new Sequelize(props.database, props.username, props.password, {
            dialect: 'postgres',
            host: props.host,
            port: props.port,
        });
    } else {
        db = props.db;
    }

    WF.init({
        content: {type: DataTypes.TEXT, allowNull: false},
        default: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
        deleted: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
    }, {
        sequelize: db,
        modelName: 'workflow'
    });
    WFI.init({
        id: {type: DataTypes.STRING, primaryKey: true},
        variables: {type: DataTypes.JSON, allowNull: false, defaultValue: {}},
        deleted: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
    }, {
        sequelize: db,
        modelName: 'instance'
    });
    OP.init({
        name: {type: DataTypes.STRING, allowNull: false},
        data: {type: DataTypes.JSON, allowNull: false, defaultValue: {}},
        files: {type: DataTypes.JSON, allowNull: true, defaultValue: []},
    }, {
        sequelize: db,
        modelName: 'operation'
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
    WFI.belongsTo(WF);
    OP.belongsTo(WFI);
    File.belongsTo(WFI);

    await db.authenticate();
    await db.sync({force: true});
    return db;
}

async function dropAll(){
    if(!db) return;

    await WF.drop();
    await WFI.drop();
    await OP.drop();
    await User.drop();
}

module.exports = {
    get,dropAll,
    models:{WF, WFI, OP, File}
};
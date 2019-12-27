'use strict';
module.exports = (sequelize, DataTypes) => {
  const instance = sequelize.define('instance', {
    id: {type: DataTypes.STRING, primaryKey: true},
    variables: {type: DataTypes.JSON, allowNull: false, defaultValue: {}},
    lastTasks: {type: DataTypes.JSON, allowNull: false, defaultValue: []},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: 'processing'}
  }, {});
  instance.associate = function(models) {
    // associations can be defined here
    instance.hasMany(models.operation);
    instance.hasMany(models.file);
    instance.belongsTo(models.workflow);
  };
  return instance;
};
'use strict';
module.exports = (sequelize, DataTypes) => {
  const operation = sequelize.define('operation', {
    name: {type: DataTypes.STRING, allowNull: false},
    data: {type: DataTypes.JSON, allowNull: false, defaultValue: {}},
    files: {type: DataTypes.JSON, allowNull: true, defaultValue: []},
  }, {
    indexes: [
      {
        unique: false,
        fields: ['instanceId']
      }
    ]
  });
  operation.associate = function (models) {
    // associations can be defined here
    operation.belongsTo(models.instance);
  };
  return operation;
};
'use strict';
module.exports = (sequelize, DataTypes) => {
  const workflow = sequelize.define('workflow', {
    content: {type: DataTypes.TEXT, allowNull: false},
    md5: {type: DataTypes.STRING, allowNull: true, defaultValue: ''},
    default: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false},
    status: {type: DataTypes.STRING, allowNull: false, defaultValue: 'normal'}
  }, {
    indexes: [
      {
        unique: true,
        fields: ['md5']
      }
    ]
  });
  workflow.associate = function (models) {
    // associations can be defined here
    workflow.hasMany(models.instance);
  };
  return workflow;
};
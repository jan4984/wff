'use strict';
module.exports = (sequelize, DataTypes) => {
  const file = sequelize.define('file', {
    id: {type: DataTypes.STRING, primaryKey: true},
    attached: {type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false}
  }, {});
  file.associate = function(models) {
    // associations can be defined here
    file.belongsTo(models.instance);
  };
  return file;
};
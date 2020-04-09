'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Infos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      owner: {
        type: DataTypes.STRING(256),
        allowNull: true
      },
      idToken: {
        type: DataTypes.STRING(256),
        allowNull: false
      },
      type: {
        type: DataTypes.STRING(256),
        allowNull: false
      }
    },
    {
      tableName: 'infos',
      timestamps: false
    });
}

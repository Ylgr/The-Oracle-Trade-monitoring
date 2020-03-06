'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Credentials', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      owner: {
        type: DataTypes.STRING(256),
        allowNull: true
      },
      credential: {
        type: DataTypes.JSON,
        allowNull: false
      }
    },
    {
      tableName: 'credentials',
      timestamps: false
    });
}

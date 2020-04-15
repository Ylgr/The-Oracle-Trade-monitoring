'use strict';
module.exports = (sequelize, DataTypes) => {
  return sequelize.define('ValueOrderDetails', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true
      },
      owner: {
        type: DataTypes.STRING(256),
        allowNull: true
      },
      apiKey: {
        type: DataTypes.STRING(256),
        primaryKey: true,
        allowNull: false
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: true
      }
    },
    {
      tableName: 'value_order_details',
      timestamps: false
    });
}

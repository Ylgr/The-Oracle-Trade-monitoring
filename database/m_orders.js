'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Orders', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            side: {
                type: DataTypes.ENUM('BUY', 'SELL'),
                allowNull: true
            },
            amountRatio: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            pair: {
                type: DataTypes.STRING,
                allowNull: true
            },
            entry: {
                type: DataTypes.JSON,
                allowNull: true
            },
            profit: {
                type: DataTypes.JSON,
                allowNull: true
            },
            stop: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            result: {
                type: DataTypes.JSON,
                allowNull: true
            }
        },
        {
            tableName: 'orders',
            timestamps: false
        });
}

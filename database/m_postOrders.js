'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('PostOrders', {
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
            symbol: {
                type: DataTypes.STRING,
                allowNull: true
            },
            price: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            stopPrice: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            status: {
                type: DataTypes.STRING,
                allowNull: true
            },
            pendingBy: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            result: {
                type: DataTypes.JSON,
                allowNull: true
            },
            originOrderId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            binanceOrderId: {
                type: DataTypes.STRING,
                allowNull: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: true
            },
            role: {
                type: DataTypes.STRING,
                allowNull: true
            },
        },
        {
            tableName: 'post_orders',
            timestamps: false
        });
}

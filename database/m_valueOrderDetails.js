'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ValueOrderDetails', {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            owner: {
                type: DataTypes.STRING(256),
                allowNull: true
            },
            apiKey: {
                type: DataTypes.STRING(256),
                allowNull: false
            },
            amount: {
                type: DataTypes.FLOAT,
                allowNull: true
            },
            originOrderId: {
                type: DataTypes.INTEGER,
                allowNull: true
            },
            fillAmount: {
                type: DataTypes.FLOAT,
                defaultValue: 0
            }
        },
        {
            tableName: 'value_order_details',
            timestamps: false
        });
}

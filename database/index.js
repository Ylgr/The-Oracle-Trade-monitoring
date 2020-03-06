let sequelize = require('./sequelize')

const Sequelize = require("sequelize");
sequelize.Op = Sequelize.Op;

module.exports = {
    db: sequelize
}
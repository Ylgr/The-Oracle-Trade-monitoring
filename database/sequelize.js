"use strict";
const Sequelize = require("sequelize");
const glob = require('glob')
require('dotenv').config()

const sequelize = new Sequelize(process.env.MYSQL_DB || '', process.env.MYSQL_USER || '', process.env.MYSQL_PASSWORD || '', {
    host: process.env.MYSQL_HOST || '',
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },
    define: {
        timestamps: true
    }
  });

let models = {}

glob(`${__dirname}/m_*.js`, { ignore: ['**/index.js', '**/sequelize.js'] }, (err, matches) => {
    if (err) {
        throw err
    }
    matches.forEach((file) => {
        let model = sequelize.import(file)
        models[model.name] = model
    })
})


sequelize
    .sync({force: false, alter: true})
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.log('Unable to connect to the database:', err);
    });

module.exports = models;

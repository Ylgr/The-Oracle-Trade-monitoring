const models = require('../database').db;
const Sequelize = require("sequelize");
async function getCredentialConfiguration() {
  let credentialList = await models.Credentials.findAll({
    where: {
      type: 'CONFIGURATION'
    }
  });
  return credentialList[0].credential;
}

async function getToken() {
  let credentialList = await models.Credentials.findAll({
    where: {
      type: 'TOKEN'
    }
  });
  return credentialList[0].credential;
}

async function saveToken(tokenJson) {
  let credentialList = await models.Credentials.upsert({
    credential: tokenJson,
    type: 'TOKEN'
  });
  return credentialList[0].credential;
}

async function getExecuteSpreadsheet() {
  let spreadsheetList = await models.Spreadsheets.findAll({
    where: {
      type: 'EXECUTE'
    }
  });
  return spreadsheetList[0].idToken;
}

module.exports = {
  getCredentialConfiguration,
  getExecuteSpreadsheet,
  getToken,
  saveToken
};

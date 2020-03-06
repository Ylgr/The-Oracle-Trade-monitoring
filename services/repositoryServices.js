const models = require('../database').db;

async function getCredential() {
  let credentialList = await models.Credentials.all();
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
  getCredential,
  getExecuteSpreadsheet
};

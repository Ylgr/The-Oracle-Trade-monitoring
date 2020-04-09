const models = require('../database').db;
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
  let spreadsheetList = await models.Infos.findAll({
    where: {
      type: 'EXECUTE'
    }
  });
  return spreadsheetList[0].idToken;
}

async function getTelegramBotToken() {
  let telegramBotToken = await models.Infos.findOne({
    where: {
      type: 'TELEGRAM_BOT'
    }
  });
  return telegramBotToken.idToken;
}

module.exports = {
  getCredentialConfiguration,
  getExecuteSpreadsheet,
  getToken,
  saveToken,
  getTelegramBotToken
};

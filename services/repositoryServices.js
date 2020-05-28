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

async function getTelegramChannelId(channelName) {
  let telegramBotToken = await models.Infos.findOne({
    where: {
      type: channelName
    }
  });
  return telegramBotToken.idToken;
}

async function createOrder(side, waitPrice, pair, entry, profit, stop) {
  let order = await models.Orders.create({side, waitPrice, pair, entry, profit, stop});
  return order;
}

async function createPostOrder(order) {
  let result = await models.PostOrders.create(order);
  return result;
}

async function createOrUpdatePostOrder(order) {
  let result = await models.PostOrders.upsert(order);
  return result;
}

async function createPostOrders(orders) {
  let order = await models.PostOrders.bulkCreate(orders);
  return order;
}

async function getPostOrderByStatus(status) {
  let orders = await models.PostOrders.findAll({where: {status} });
  return orders;
}

async function getPostOrderEntryPending() {
  let orders = await models.PostOrders.findAll({where : {status: 'PENDING', role: 'ENTRY'} });
  return orders;
}

async function createValueOrderDetails(detail) {
  let orders = await models.ValueOrderDetails.create(detail);
  return orders;
}

async function updateFillOrders(originOrderIds) {
  const valueOrderDetails = await models.ValueOrderDetails.findAll({where: {originOrderId: originOrderIds}})
  valueOrderDetails.forEach(e => e.isFill = true)
  const updateValueOrder = await models.ValueOrderDetails.bulkCreate(valueOrderDetails, {updateOnDuplicate : true });
  const postOrders = await models.PostOrders.findAll({where: {id: originOrderIds}})
  postOrders.forEach(e => e.status = 'FILLED')
  await models.PostOrders.bulkCreate(postOrders, {updateOnDuplicate : true });
  return updateValueOrder
}

async function getFilledOrderByOriginId(originOrderIds) {
  const valueOrderDetails = await models.ValueOrderDetails.findAll({where: {originOrderId: originOrderIds}})
  return valueOrderDetails;
}

module.exports = {
  getCredentialConfiguration,
  getExecuteSpreadsheet,
  getToken,
  saveToken,
  getTelegramBotToken,
  getTelegramChannelId,
  createOrder,
  createPostOrder,
  createPostOrders,
  getPostOrderByStatus,
  createValueOrderDetails,
  updateFillOrders,
  createOrUpdatePostOrder,
  getPostOrderEntryPending
};

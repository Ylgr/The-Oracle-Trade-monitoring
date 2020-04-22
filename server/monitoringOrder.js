const { loadSpreadsheet } = require('../services/spreadsheetServices');
const { telegramMessageRequest } = require('../services/telegramServices');
const { postOrderAndNotify } = require('../services/marginOrderServices');
const { getPostOrderByStatus, getTelegramChannelId, getTelegramBotToken, updateFillOrders, createOrUpdatePostOrder } = require('../services/repositoryServices');
const { uniq } = require('lodash')
const ccxt = require ('ccxt');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

function parseNumber(numberString) {
    if(isNaN(Number(numberString))) throw new Error(`Cannot detect ${numberString} please try again!`)
    else return Number(numberString)
}

const headquartersSpreadsheetRangeIndex = {
    apiInfo : 'API Info!B3:D10'
};

(async () => {
    const telegramScoutChannel = 'TELEGRAM_CHANNEL_SCOUT'
    const telegramSentinelChannel = 'TELEGRAM_CHANNEL_SENTINEL'
    await sleep(2000);
    try {
        const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
        const token = await getTelegramBotToken();
        const telegramScoutId = await getTelegramChannelId(telegramScoutChannel);
        const sentinelChannelId = await getTelegramChannelId(telegramSentinelChannel);
        const firstAccountInfo = accountKeyInfos[0]
        const binance = new ccxt.binance({
            apiKey: firstAccountInfo[0],
            secret: firstAccountInfo[1],
            enableRateLimit: true
        });
        await binance.loadMarkets ();
        let isOrderFill = false
        // get waiting order
        const waitingPostOrders = await getPostOrderByStatus('WAITING')

        // compare with order in exchange
        const openOrders = await binance.sapiGetMarginOpenOrders()

        // update db if have any waiting order not exist
        let fillOrders = []
        let fillValueOrders = []
        let totalFillAmountRatio = 0
        if (openOrders.length === waitingPostOrders.length) {
            const clientOrderIdsInOpenOrder = openOrders.map(e => e.clientOrderId)
            fillOrders = waitingPostOrders.filter(e => !clientOrderIdsInOpenOrder.include(e.originOrderId.toString()))
            const fillOrderIds = fillOrders.map(e=>e.originOrderId)
            fillValueOrders = await updateFillOrders(fillOrderIds)
            isOrderFill = true
            telegramMessageRequest(token, telegramScoutId, 'Khớp lệnh: ' + fillOrderIds.join(', '))
        }

        const pendingPostOrders = await getPostOrderByStatus('PENDING')

        const stopLossPostOrder = pendingPostOrders.find(e => e.type === 'STOP_LOSS')
        if (stopLossPostOrder) {
            for (const accountKeyInfo of accountKeyInfos) {
                const binance = new ccxt.binance({
                    apiKey: accountKeyInfo[0],
                    secret: accountKeyInfo[1],
                    enableRateLimit: true
                });
                await binance.loadMarkets ();
                let stopLossOrderAmount = 0
                fillValueOrders.filter(e => e.apiKey === accountKeyInfo[0]).forEach(e => {
                    stopLossOrderAmount += e.amount
                })
                await postOrderAndNotify(stopLossPostOrder, token, sentinelChannelId, stopLossOrderAmount)
                stopLossPostOrder.status = 'WAITING'
                await createOrUpdatePostOrder(stopLossPostOrder)
            }
        }
        const symbols = uniq(pendingPostOrders.map(e=>e.symbol))
        for (const symbol of symbols) {
            const priceIndex = await binance.sapiGetMarginPriceIndex({symbol});
            telegramMessageRequest(token, telegramScoutId, JSON.stringify(priceIndex, null, 2))
        }
    } catch (err) {
        console.log(err)
    }
})();

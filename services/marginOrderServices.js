const { loadSpreadsheet, getTelegramChannelId } = require('./services/spreadsheetServices');
const ccxt = require ('ccxt');
const axios = require('axios');

const headquartersSpreadsheetRangeIndex = {
    apiInfo : 'API Info!B3:E10',
    apiMaginOrder : 'API Order!B3:D10',
    apiMarginBalance : 'API Balance!B3:D10',
};

const instance = axios.create({
    headers: {
        'Content-Type': 'application/json'
    },
    responseType: 'json',
    crossDomain: true,
    withCredentials: false
});

function telegramMessageRequest(telegramToken, channelId, text) {
    return instance.get('https://api.telegram.org/bot' + telegramToken + '/sendMessage?chat_id=' + channelId + '&text=' + encodeURIComponent(text))
}

async function notifyOverviewOrder(order, telegramToken, sentinelTelegramChannelId) {
    telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Thực hiện lệnh: \n' + JSON.stringify(order, null, 2))
    const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
    for (const accountKeyInfo of accountKeyInfos) {
        telegramMessageRequest(telegramToken, accountKeyInfo[2], 'Thực hiện lệnh: \n' + JSON.stringify(order, null, 2))
    }
}

async function postOrderAndNotify(orders, telegramToken, sentinelTelegramChannelId) {
    const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
    for (const accountKeyInfo of accountKeyInfos) {
        try {
            const binance = new ccxt.binance({
                apiKey: accountKeyInfo[0],
                secret: accountKeyInfo[1],
                enableRateLimit: true
            });
            await binance.loadMarkets();
            const ordersResult = []
            for (const order of orders) {
                const symbol = order.symbol
                const orderByAsset = symbol.substring(symbol.length - 4, symbol.length) === 'USDT'
                    ? 'USDT' : symbol.substring(symbol.length - 4, symbol.length) === 'BUSD'
                        ? 'BUSD' : symbol.substring(symbol.length - 3, symbol.length) === 'BTC'
                            ? 'BTC' : symbol.substring(symbol.length - 3, symbol.length) === 'ETH'
                                ? 'ETH' : throw new Error('Pair not support by tools!')
                const maxAmount = await binance.sapiGetMarginAsset({"asset":orderByAsset});
                const quantity = maxAmount * order.amountRatio * order.price
                const postOrder = await binance.sapiPostMarginOrder({
                  symbol: symbol,
                  side: order.side,
                  type: order.type,
                  quantity: quantity,
                  price: order.price,
                  timeInForce: 'GTC'
                })
                ordersResult.push(postOrder)
                telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Đặt lệnh thành công cho ' + accountKeyInfo[1] + ': \n' + JSON.stringify(postOrder, null, 2))
                telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Đặt lệnh thành công: \n' + JSON.stringify(postOrder, null, 2))
            }
            return ordersResult
        } catch (e) {
            telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Thất bại khi đặt lệnh, xin thông báo tới Toái Nguyệt để xử lý: \n' + e)
            telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Thất bại khi đặt lệnh, xin thông báo tới Toái Nguyệt để xử lý: \n' + e)
        }
    }
}

module.exports = {
    postOrderAndNotify,
    notifyOverviewOrder
};
const { loadSpreadsheet, getTelegramChannelId } = require('./spreadsheetServices');
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

const mockPostOrderAndNotifyReturn = [
    {
        "clientOrderId": "JHGyd1MoXwSXT8oofF2jqr",
        "cummulativeQuoteQty": "0.00000000",
        "executedQty": "0.00000000",
        "fills": [],
        "orderId": 1826478577,
        "origQty": "0.01270000",
        "price": "3750.25000000",
        "side": "BUY",
        "status": "NEW",
        "symbol": "BTCUSDT",
        "timeInForce": "GTC",
        "transactTime": 1586840046483,
        "type": "LIMIT"
    },
    {
        "clientOrderId": "SNQmYTwfA9XCGOMkHU0lSg",
        "cummulativeQuoteQty": "0.00000000",
        "executedQty": "0.00000000",
        "fills": [],
        "orderId": 1826478719,
        "origQty": "0.01320000",
        "price": "3360.21000000",
        "side": "BUY",
        "status": "NEW",
        "symbol": "BTCUSDT",
        "timeInForce": "GTC",
        "transactTime": 1586840047462,
        "type": "LIMIT"
    },
    {
        "clientOrderId": "YzCxdzMICdmXLexd2qKTJx",
        "cummulativeQuoteQty": "0.00000000",
        "executedQty": "0.00000000",
        "fills": [],
        "orderId": 1826478884,
        "origQty": "0.01320000",
        "price": "3125.50000000",
        "side": "BUY",
        "status": "NEW",
        "symbol": "BTCUSDT",
        "timeInForce": "GTC",
        "transactTime": 1586840048483,
        "type": "LIMIT"
    }
]

function telegramMessageRequest(telegramToken, channelId, text) {
    return instance.get('https://api.telegram.org/bot' + telegramToken + '/sendMessage?chat_id=' + channelId + '&text=' + encodeURIComponent(text))
}

async function notifyOverviewOrder(order, telegramToken, sentinelTelegramChannelId) {
    telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Thực hiện lệnh: \n' + JSON.stringify(order, null, 2))
    const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
    for (const accountKeyInfo of accountKeyInfos) {
        telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Thực hiện lệnh: \n' + JSON.stringify(order, null, 2))
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
                // const orderByAsset = symbol.substring(symbol.length - 4, symbol.length)
                const orderByAsset = symbol.substring(symbol.length - 4, symbol.length) === 'USDT'
                    ? 'USDT' : symbol.substring(symbol.length - 4, symbol.length) === 'BUSD'
                        ? 'BUSD' : symbol.substring(symbol.length - 3, symbol.length) === 'BTC'
                            ? 'BTC' : symbol.substring(symbol.length - 3, symbol.length) === 'ETH'
                                ? 'ETH' : ''
                if (orderByAsset === '') {
                    telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Ko phân tích được tiền sử dụng trong cặp: ' + symbol)
                    return
                }
                const maxAmount = (await binance.sapiGetMarginAccount()).userAssets.find(e=> e.asset === 'USDT').free;
                const quantity =  (maxAmount * order.amountRatio / order.price / orders.length).toFixed(4)
                console.log('quantity: ', quantity)
                // const postOrder = await binance.sapiPostMarginOrder({
                //   symbol: symbol,
                //   side: order.side,
                //   type: order.type,
                //   quantity: quantity,
                //   price: order.price,
                //   timeInForce: 'GTC'
                // })
                // ordersResult.push(postOrder)
                // telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Đặt lệnh thành công cho ' + accountKeyInfo[2] + ': \n' + JSON.stringify(postOrder, null, 2))
                // telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Đặt lệnh thành công: \n' + JSON.stringify(postOrder, null, 2))
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
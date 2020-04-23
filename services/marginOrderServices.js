const { loadSpreadsheet, getTelegramChannelId } = require('./spreadsheetServices');
const { createValueOrderDetails } = require('./repositoryServices');
const { telegramMessageRequest } = require('./telegramServices');
const ccxt = require ('ccxt');

const headquartersSpreadsheetRangeIndex = {
    apiInfo : 'API Info!B3:E10',
    apiMaginOrder : 'API Order!B3:D10',
    apiMarginBalance : 'API Balance!B3:D10',
};

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

async function notifyOverviewOrder(order, telegramToken, sentinelTelegramChannelId) {
    telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Thực hiện lệnh: \n' + JSON.stringify(order, null, 2))
    const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
    for (const accountKeyInfo of accountKeyInfos) {
        telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Thực hiện lệnh: \n' + JSON.stringify(order, null, 2))
    }
}

function parseNumber(numberString) {
    if(isNaN(Number(numberString))) throw new Error(`Cannot detect ${numberString} please try again!`)
    else return Number(numberString)
}

async function loanAndNotify(orders, telegramToken, sentinelTelegramChannelId) {
    const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
    let loanResults = []
    for (const accountKeyInfo of accountKeyInfos) {
        try {
            const binance = new ccxt.binance({
                apiKey: accountKeyInfo[0],
                secret: accountKeyInfo[1],
                enableRateLimit: true
            });
            await binance.loadMarkets();
            for (const order of orders) {
                const maxLoan = await binance.sapiGetMarginMaxBorrowable({"asset": order.asset});
                const loanAmount = maxLoan*orders.amountRatio
                const loanResult = await binance.sapiPostMarginLoan({
                  asset: order.asset,
                  amount: loanAmount
                })
                loanResults.push({ [accountKeyInfo[2]] : loanAmount + ' ' + order.asset })
                telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Vay thành công ' + loanAmount + ' ' + order.asset + ' cho ' + accountKeyInfo[2])
                telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Vay thành công ' + loanAmount + ' ' + order.asset)
            }
        } catch (e) {
            telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Thất bại khi vay tiền sàn, xin thông báo tới Toái Nguyệt để xử lý: \n' + e.stack)
            telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Thất bại khi vay tiền sàn, xin thông báo tới Toái Nguyệt để xử lý: \n' + e.stack)
        }
    }
    return loanResults
}


async function repayAllAndNotify(orders, telegramToken, sentinelTelegramChannelId) {
    const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
    let repayResults = []
    for (const accountKeyInfo of accountKeyInfos) {
        try {
            const binance = new ccxt.binance({
                apiKey: accountKeyInfo[0],
                secret: accountKeyInfo[1],
                enableRateLimit: true
            });
            await binance.loadMarkets();
            for (const order of orders) {
                const loanResult = await binance.sapiGetMarginLoan({
                    asset: order.asset,
                    startTime: order.startTime
                })
                const loanRecords = loanResult.rows.filter(e => e.status === 'CONFIRMED')
                for (const loanRecord of loanRecords) {
                    const result = await binance.sapiPostMarginRepay({
                        asset: order.asset,
                        amount: loanRecord.amount
                    })
                    repayResults.push({ [accountKeyInfo[2]] : loanRecord.amount + ' ' + order.asset })
                }
            }
        } catch (e) {
            telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Thất bại khi vay tiền sàn, xin thông báo tới Toái Nguyệt để xử lý: \n' + e.stack)
            telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Thất bại khi vay tiền sàn, xin thông báo tới Toái Nguyệt để xử lý: \n' + e.stack)
        }
    }
    return repayResults
}

async function postOrderAndNotify(orders, telegramToken, sentinelTelegramChannelId, orderAmount) {
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
            let totalAmount = 0
            let originOrderId
            for (const order of orders) {
                originOrderId = order.originOrderId
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
                const marginAccount = await binance.sapiGetMarginAccount()
                const maxAmount = orderAmount ? orderAmount : marginAccount.userAssets.find(e=> e.asset === 'USDT').free;
                const quantity =  (maxAmount * order.amountRatio / order.price / orders.length).toFixed(4)
                const postOrder = await binance.sapiPostMarginOrder({
                  symbol: symbol,
                  side: order.side,
                  type: order.type,
                  quantity: quantity,
                  price: order.price,
                  timeInForce: 'GTC',
                  newClientOrderId: order.id
                })
                // const postOrder = mockPostOrderAndNotifyReturn[orders.indexOf(order)]
                totalAmount += parseNumber(postOrder.origQty)
                ordersResult.push(postOrder)
                telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Đặt lệnh thành công cho ' + accountKeyInfo[2] + ': \n' + JSON.stringify(postOrder, null, 2))
                telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Đặt lệnh thành công: \n' + JSON.stringify(postOrder, null, 2))
            }
            await createValueOrderDetails({
                owner: escape(accountKeyInfo[2]),
                apiKey: accountKeyInfo[0],
                amount: Math.floor(totalAmount* 10000) / 10000,
                originOrderId: originOrderId,
            })
            return ordersResult
        } catch (e) {
            telegramMessageRequest(telegramToken, sentinelTelegramChannelId, 'Thất bại khi đặt lệnh, xin thông báo tới Toái Nguyệt để xử lý: \n' + e.stack)
            telegramMessageRequest(telegramToken, accountKeyInfo[3], 'Thất bại khi đặt lệnh, xin thông báo tới Toái Nguyệt để xử lý: \n' + e.stack)
        }
    }
}

function getOppositeSide(side) {
    return side === 'BUY' ? 'SELL' : 'BUY'
}

module.exports = {
    postOrderAndNotify,
    notifyOverviewOrder,
    getOppositeSide,
    loanAndNotify,
    repayAllAndNotify
};
const { loadSpreadsheet } = require('../services/spreadsheetServices');
const { telegramMessageRequest } = require('../services/telegramServices');
const { getPostOrderByStatus, getTelegramChannelId, getTelegramBotToken, updateFillOrders } = require('../services/repositoryServices');
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
    await sleep(2000);
    try {
        const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
        const token = await getTelegramBotToken();
        const telegramScoutId = await getTelegramChannelId(telegramScoutChannel);
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
        if (openOrders.length === waitingPostOrders.length) {
            const clientOrderIdsInOpenOrder = openOrders.map(e => e.clientOrderId)
            const fillOrderIds = waitingPostOrders.filter(e => clientOrderIdsInOpenOrder.include(e.originOrderId.toString())).map(e=>e.originOrderId)
            await updateFillOrders(fillOrderIds)
            isOrderFill = true
            telegramMessageRequest(token, telegramScoutId, 'Khớp lệnh: ' + fillOrderIds.join(', '))
        }

        const pendingPostOrders = await getPostOrderByStatus('PENDING')
        const symbols = uniq(pendingPostOrders.map(e=>e.symbol))
        for (const symbol of symbols) {
            const priceIndex = await binance.sapiGetMarginPriceIndex({symbol});
            telegramMessageRequest(token, telegramScoutId, JSON.stringify(priceIndex, null, 2))

            // If current price > market price in BUY market order, stop stop loss order
            // const lowestPriceOrder = pendingPostOrders
            // if (parseNumber(priceIndex.price) > )

            // If orders limit filled, new order stop loss to all accounts, change status limit to filled, stop loss to waiting, market to waiting

            // const pendingOrderCompareSymbol = pendingPostOrders.filter(e => e.symbol === symbol)
            // for(const pendingPostOrder of pendingOrderCompareSymbol) {
            //     if(pendingPostOrder.side === 'BUY') {
            //
            //     } else if (pendingPostOrder.side === 'SELL') {
            //
            //     }
            // }
        }
        // for (const accountKeyInfo of accountKeyInfos) {
        //     const binance = new ccxt.binance({
        //         apiKey: accountKeyInfo[0],
        //         secret: accountKeyInfo[1],
        //         enableRateLimit: true
        //     });
        //     await binance.loadMarkets ();
        //     // const marginBalance = await binance.sapiGetMarginAccount();
        //     // console.log(marginBalance)
        //     // const allAssets = await binance.sapiGetMarginMaxBorrowable({"asset":"XRP"});
        //     // console.log(allAssets)
        //     if(accountKeyInfo[3] === 'TuNV') { // write balance information to sheet
        //     }
        //
        //     // console.log('Test lay balance') // WORK
        //     const maxAmount = await binance.sapiGetMarginAccount();
        //     console.log(maxAmount.userAssets.find(e=> e.asset === 'USDT').free)
        //
        //     // console.log('Test dat lenh') // WORK
        //     // const d = await binance.sapiPostMarginOrder({
        //     //   symbol: 'BTCUSDT',
        //     //   side: 'BUY',
        //     //   type: 'LIMIT',
        //     //   quantity: '0.01',
        //     //   price: '3281',
        //     //   timeInForce: 'GTC'
        //     // })
        //     // console.log(d)
        //
        //     // console.log('Test xoa lenh') // WORK
        //     // const d = await binance.sapiDeleteMarginOrder({
        //     //   symbol: 'BTCUSDT',
        //     //   orderId: 1771090118
        //     // })
        //     // console.log(d)
        //
        //     // console.log('Test vay tien san') // WORK
        //     // const d = await binance.sapiPostMarginLoan({
        //     //   asset: 'USDT',
        //     //   amount: 1
        //     // })
        //     // console.log(d)
        //
        //     // console.log('Test tra tien san') // WORK
        //     // const d = await binance.sapiPostMarginRepay({
        //     //   asset: 'BNB',
        //     //   amount: 0.00000187
        //     // })
        //     // console.log(d)
        //
        //     // console.log(balance.info.balances.filter(balance => balance.free > 0))
        // }
    } catch (err) {
        console.log(err)
    }
})();

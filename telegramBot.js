const TelegramBot = require('node-telegram-bot-api');
const { getTelegramBotToken, createOrder, getTelegramChannelId, createPostOrders, createPostOrder } = require('./services/repositoryServices');
const { postOrderAndNotify, notifyOverviewOrder, getOppositeSide } = require('./services/marginOrderServices');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

function parseNumber(numberString) {
    if(isNaN(Number(numberString))) throw new Error(`Cannot detect ${numberString} please try again!`)
    else return Number(numberString)
}

(async () => {
    await sleep(2000);
    try {
        const token = await getTelegramBotToken();
        // Create a bot that uses 'polling' to fetch new updates
        // const bot = new TelegramBot(token, {polling: true});
        const sentinelChannelId = await getTelegramChannelId('TELEGRAM_CHANNEL_SENTINEL')
        // test message
        const mockMessage = 'buy 20% - pair btcusdt - entry 3750.25 3360.21 3125.5 - profit 4800 5400 - stop 3085'
        const orderProps = mockMessage.split('-')

        let side, pair, entry, profit, stop, amountRatio
        orderProps.forEach(orderInfo => {
            const splitOrderInfo = orderInfo.split(' ').filter(e => e !== '')
            const infoType = splitOrderInfo[0].toUpperCase()
            try {
                if(infoType === 'BUY' || infoType === 'SELL') {
                    side = infoType
                    const amountPrice = splitOrderInfo[1].toUpperCase()
                    const lastInAmountPrice = amountPrice.slice(amountPrice.length - 1)
                    if(lastInAmountPrice === '%' || amountPrice > 1) {
                        amountRatio = parseNumber(amountPrice.slice(0, amountPrice.length - 1))/100
                    } else if (amountPrice <= 1 && amountPrice > 0) {
                        amountRatio = amountPrice
                    }
                } else if(infoType === 'ENTRY') {
                    entry = splitOrderInfo.slice(1).map(e => parseNumber(e))
                } else if(infoType === 'PROFIT') {
                    profit = splitOrderInfo.slice(1).map(e => parseNumber(e))
                } else if(infoType === 'STOP') {
                    stop = splitOrderInfo[1]
                } else if(infoType === 'PAIR') {
                    pair = splitOrderInfo[1].toUpperCase()
                }
            } catch (e) {
                console.log(e)
            }
        })
        if(side && pair && entry && profit && stop && amountRatio) {
            const order = await createOrder(side, amountRatio, pair, entry, profit, stop)
            if (order) {
                await notifyOverviewOrder(order, token, sentinelChannelId)
                const orderId = order.id
                const entryOrders = entry.map(e => {
                    return {
                        side,
                        symbol: pair,
                        amountRatio,
                        price: e,
                        originOrderId: orderId,
                        type: 'LIMIT'
                    }
                })
                const postOrderResult = await postOrderAndNotify(entryOrders, token, sentinelChannelId)
                for (const e of entryOrders) {
                    e.amountRatio = e.amountRatio/entryOrders.length
                    const orderCompareInBinance = postOrderResult
                        .find(order => parseNumber(order.price).toFixed(4) === e.price.toFixed(4))
                    if(orderCompareInBinance) {
                        e['binanceOrderId'] = orderCompareInBinance.clientOrderId
                        e['status'] = 'WAITING'
                    } else {
                        e['status'] = 'FAILED'
                    }
                    await notifyOverviewOrder(e, token, sentinelChannelId)
                }
                const orders = await createPostOrders(entryOrders)
                // create post order stop loss with status = pending, pending by last limit request
                const stopLossOrder = {
                    side: getOppositeSide(side),
                    amountRatio: 1,
                    symbol: pair,
                    price: parseNumber(stop),
                    stopPrice: getOppositeSide(side) === 'BUY' ? stop/1.01 : stop*1.01,
                    status: 'PENDING',
                    pendingBy: orders[orders.length-1].id,
                    originOrderId: orderId,
                    type: 'STOP_LOSS'
                }
                await createPostOrder(stopLossOrder)
                // create post order market  with status = pending, pending by first limit request
                const profitOrders = profit.map(e => {
                    return {
                        side: getOppositeSide(side),
                        amountRatio: Math.floor(amountRatio/profit.length* 10000) / 10000,
                        price: e,
                        originOrderId: orderId,
                        type: 'LIMIT',
                        status: 'PENDING',
                        pendingBy: orders[0].id,
                        symbol: pair,
                    }
                })
                await createPostOrders(profitOrders)
            } else {

            }
        } else {
            console.log('error')
            console.log('side: ', side)
            console.log('amountRatio: ', amountRatio)
            console.log('pair: ', pair)
            console.log('entry: ', entry)
            console.log('profit: ', profit)
            console.log('stop: ', stop)
        }

        // // Matches "/order [whatever]"
        // bot.onText(/order (.+)/, (msg, match) => {
        //     // 'msg' is the received Message from Telegram
        //     // 'match' is the result of executing the regexp above on the text content
        //     // of the message
        //
        //     const chatId = msg.chat.id;
        //     const resp = match[1]; // the captured "whatever"
        //     console.log('resp: ',match)
        //     // send back the matched "whatever" to the chat
        //     bot.sendMessage(chatId, resp);
        // });
        //
        // Matches "/registry [whatever]"

        // const registryChannelId = await getTelegramChannelId('TELEGRAM_CHANNEL_REGISTRY')
        //
        // bot.onText(/registry (.+)/, (msg, match) => {
        //     // 'msg' is the received Message from Telegram
        //     // 'match' is the result of executing the regexp above on the text content
        //     // of the message
        //
        //     const chatId = msg.chat.id;
        //     const resp = match[1] + ' đã yêu cầu tham gia dự án Moon landing! \nId Telegram: ' + chatId; // the captured "whatever"
        //     // send back the matched "whatever" to the chat
        //     bot.sendMessage(registryChannelId, resp);
        // });
    } catch (err) {
        console.log(err)
    }
})()
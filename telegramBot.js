const TelegramBot = require('node-telegram-bot-api');
const { getTelegramBotToken, createOrder, getTelegramChannelId } = require('./services/repositoryServices');
const { notifyOverviewOrder } = require('./services/marginOrderServices');
const { createOrderWithoutWait, createOrderWithWait } = require('./services/orderServices');

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
        const bot = new TelegramBot(token, {polling: true});
        const sentinelChannelId = await getTelegramChannelId('TELEGRAM_CHANNEL_SENTINEL')
        const orderChannelId = await getTelegramChannelId('TELEGRAM_CHANNEL_ORDER')

        bot.onText(/order (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const resp = match[1]; // the captured "whatever"
            if (chatId.toString() === orderChannelId) {
        //         const mockMessageWithWait = 'sell 9152 - pair btcusdt - entry 8871.25 - profit 8213 - stop 9184'
        //         const mockMessageWithoutWait = 'sell 9152 - pair btcusdt - entry 8871.25 - profit 8213 - stop 9184'
                const orderProps = resp.split('-')

                let side, pair, entry, profit, stop
                let waitPrice
                orderProps.forEach(orderInfo => {
                    const splitOrderInfo = orderInfo.split(' ').filter(e => e !== '')
                    const infoType = splitOrderInfo[0].toUpperCase()
                    try {
                        if(infoType === 'BUY' || infoType === 'SELL') {
                            side = infoType
                            waitPrice = splitOrderInfo[1].toUpperCase()
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
                if(side && pair && entry && profit && stop) {
                    const order = await createOrder(side, waitPrice, pair, entry, profit, stop)
                    if(order) {
                        await notifyOverviewOrder(order, token, sentinelChannelId)
                        if(waitPrice) {
                            await createOrderWithWait(order)
                        } else {
                            await createOrderWithoutWait(order, token, sentinelChannelId, bot, chatId)
                        }
                    } else {
                        await bot.sendMessage(chatId, 'Có lỗi khi tạo lệnh, vui lòng báo lại cho Toái Nguyệt xử lý!')
                    }
                } else {
                    await bot.sendMessage(chatId, 'Có lỗi khi tạo lệnh, vui lòng xe, lại các thông tin đã nhập: \n' +
                        `side: ${side}\n` +
                        `waitPrice: ${waitPrice}\n` +
                        `pair: ${pair}\n` +
                        `entry: ${entry}\n` +
                        `profit: ${profit}\n` +
                        `stop: ${stop}`
                    )
                }
            } else await bot.sendMessage(chatId, 'Xin lỗi, phiền bạn xem lại mình đang ở đâu')
        });

        // bot.onText(/loan (.+)/, async (msg, match) => {
        //     const chatId = msg.chat.id;
        //     const resp = match[1]; // the captured "whatever"
        //     console.log('Getting load message: ', resp)
        //     if (chatId.toString() === orderChannelId) {
        //         // const mockMessage = '20% USDT'
        //         const splitOrderInfo = resp.split(' ').filter(e => e !== '')
        //         const amountPrice = splitOrderInfo[0]
        //         const lastInAmountPrice = amountPrice.slice(amountPrice.length - 1)
        //         let amountRatio
        //         if(lastInAmountPrice === '%' || amountPrice > 1) {
        //             amountRatio = parseNumber(amountPrice.slice(0, amountPrice.length - 1))/100
        //         } else if (amountPrice <= 1 && amountPrice > 0) {
        //             amountRatio = amountPrice
        //         }
        //         const asset = splitOrderInfo[1]
        //         const result = await loanAndNotify({asset, amountRatio}, token, sentinelChannelId)
        //         await bot.sendMessage(chatId, JSON.stringify(result))
        //     } else await bot.sendMessage(chatId, 'Xin lỗi, phiền bạn xem lại mình đang ở đâu')
        // });
        //
        // const registryChannelId = await getTelegramChannelId('TELEGRAM_CHANNEL_REGISTRY')
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
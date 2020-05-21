const {getTelegramBotToken, createOrder, getTelegramChannelId} = require('./services/repositoryServices');
const {notifyOverviewOrder} = require('./services/marginOrderServices');
const {createOrderWithoutWait, createOrderWithWait} = require('./services/orderServices');

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
        const sentinelChannelId = await getTelegramChannelId('TELEGRAM_CHANNEL_SENTINEL')
        const orderChannelId = await getTelegramChannelId('TELEGRAM_CHANNEL_ORDER')

        //         const mockMessageWithWait = 'sell 9152 - pair btcusdt - entry 8871.25 - profit 8213 - stop 9184'
        const mockMessageWithoutWait = 'sell 41.98 - pair ltcusdt - entry 43.10 - profit 40.86'

        let side, pair, entry, profit, stop
        let waitPrice
        mockMessageWithoutWait.split('-').forEach(orderInfo => {
            const splitOrderInfo = orderInfo.split(' ').filter(e => e !== '')
            const infoType = splitOrderInfo[0].toUpperCase()
            try {
                if (infoType === 'BUY' || infoType === 'SELL') {
                    side = infoType
                    waitPrice = splitOrderInfo[1]
                } else if (infoType === 'ENTRY') {
                    entry = splitOrderInfo.slice(1).map(e => parseNumber(e))
                } else if (infoType === 'PROFIT') {
                    profit = splitOrderInfo.slice(1).map(e => parseNumber(e))
                } else if (infoType === 'STOP') {
                    stop = splitOrderInfo[1]
                } else if (infoType === 'PAIR') {
                    pair = splitOrderInfo[1].toUpperCase()
                }
            } catch (e) {
                console.log(e)
            }
        })
        if(!stop) stop = side.toUpperCase() === 'BUY' ? entry * 0.98 : entry * 1.02
        if (side && pair && entry && profit && stop) {
            const order = await createOrder(side, waitPrice, pair, entry, profit, stop)
            if (order) {
                await notifyOverviewOrder(order, token, sentinelChannelId)
                if (waitPrice) {
                    await createOrderWithWait(order)
                } else {
                    await createOrderWithoutWait(order, token, sentinelChannelId)
                }
            }
        } else {
            console.log( 'Có lỗi khi tạo lệnh, vui lòng xe, lại các thông tin đã nhập: \n' +
                `side: ${side}\n` +
                `waitPrice: ${waitPrice}\n` +
                `pair: ${pair}\n` +
                `entry: ${entry}\n` +
                `profit: ${profit}\n` +
                `stop: ${stop}`
            )
        }
    } catch (err) {
        console.log(err)
    }
})()
const {postOrderAndNotify, notifyOverviewOrder, getOppositeSide, loanAndNotify} = require('./marginOrderServices');
const {createPostOrders, createPostOrder} = require('./repositoryServices');

function parseNumber(numberString) {
    if (isNaN(Number(numberString))) throw new Error(`Cannot detect ${numberString} please try again!`)
    else return Number(numberString)
}

async function createOrderWithoutWait(order, telegramToken, sentinelChannelId) {
    const orderId = order.id
    const entryOrders = order.entry.map(e => {
        return {
            side: order.side,
            symbol: order.pair,
            amountRatio: 1 / order.entry.length,
            price: e,
            originOrderId: orderId,
            type: 'LIMIT'
        }
    })
    const postOrderResult = await postOrderAndNotify(entryOrders, telegramToken, sentinelChannelId)
    for (const e of entryOrders) {
        e.amountRatio = e.amountRatio / entryOrders.length
        const orderCompareInBinance = postOrderResult
            .find(order => parseNumber(order.price).toFixed(4) === e.price.toFixed(4))
        if (orderCompareInBinance) {
            e['binanceOrderId'] = orderCompareInBinance.clientOrderId
            e['status'] = 'WAITING'
        } else {
            e['status'] = 'FAILED'
        }
        await notifyOverviewOrder(e, telegramToken, sentinelChannelId)
    }
    const orders = await createPostOrders(entryOrders)
    // create post order stop loss with status = pending, pending by last limit request
    const stopLossOrder = {
        side: getOppositeSide(orders.side),
        amountRatio: 1,
        symbol: orders.pair,
        price: parseNumber(orders.stop),
        stopPrice: getOppositeSide(orders.side) === 'BUY' ? orders.stop / 1.01 : orders.stop * 1.01,
        status: 'PENDING',
        pendingBy: orders[orders.length - 1].id,
        originOrderId: orderId,
        type: 'STOP_LOSS'
    }
    await createPostOrder(stopLossOrder)
    // create post order market  with status = pending, pending by first limit request
    const profitOrders = orders.profit.map(e => {
        return {
            side: getOppositeSide(orders.side),
            amountRatio: orders.profit.length,
            price: e,
            originOrderId: orderId,
            type: 'LIMIT',
            status: 'PENDING',
            pendingBy: orders[0].id,
            symbol: orders.pair,
        }
    })
    await createPostOrders(profitOrders)
}

async function createOrderWithWait(order) {
    const entryOrder = order.entry.map(e => {
        return {
            side: order.side,
            symbol: order.pair,
            amountRatio: 1 / order.entry.length,
            price: e,
            stopPrice: order.entry,
            originOrderId: order.id,
            pendingBy: 0,
            status: 'PENDING',
            type: 'STOP_LOSS',
            role: 'ENTRY',
            waitPrice: order.waitPrice
        }
    })
    const entryPostOrders = await createPostOrders(entryOrder)
    // create post order stop loss with status = pending, pending by last limit request
    const stopLossOrder = {
        side: getOppositeSide(order.side),
        amountRatio: 1,
        symbol: order.pair,
        price: parseNumber(order.stop),
        stopPrice: getOppositeSide(order.side) === 'BUY' ? order.stop / 1.01 : order.stop * 1.01,
        status: 'PENDING',
        pendingBy: entryPostOrders[entryPostOrders.length - 1].id,
        originOrderId: order.id,
        type: 'STOP_LOSS',
        role: 'STOP_LOSS'
    }
    await createPostOrder(stopLossOrder)
    // create post order market  with status = pending, pending by first limit request
    const profitOrders = order.profit.map(e => {
        return {
            side: getOppositeSide(order.side),
            amountRatio: 1 / order.profit.length,
            price: e,
            originOrderId: order.id,
            type: 'LIMIT',
            status: 'PENDING',
            pendingBy: entryPostOrders[0].id,
            symbol: order.pair,
            role: 'PROFIT'
        }
    })
    await createPostOrders(profitOrders)
}

module.exports = {
    createOrderWithoutWait,
    createOrderWithWait
};
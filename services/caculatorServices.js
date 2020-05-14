
function isOrderMatching(side, currentPrice, expectedPrice) {
    if(side.toUpperCase() === 'BUY') {
        return currentPrice >= expectedPrice
    }
    if(side.toLowerCase() === 'SELL') {
        return currentPrice <= expectedPrice
    }
}

module.exports = {
    isOrderMatching
}
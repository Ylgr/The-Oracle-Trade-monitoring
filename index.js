const { loadSpreadsheet } = require('./services/spreadsheetServices');
const { headquartersSpreadsheetRangeIndex } = require('./constant/constant');
const ccxt = require ('ccxt');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

(async () => {
  await sleep(2000);
  try {
    const accountKeyInfos = await loadSpreadsheet(headquartersSpreadsheetRangeIndex.apiInfo);
    for (const accountKeyInfo of accountKeyInfos) {
      const binance = new ccxt.binance({
        apiKey: accountKeyInfo[0],
        secret: accountKeyInfo[1],
        enableRateLimit: true
      });
      await binance.loadMarkets ();
      // const marginBalance = await binance.sapiGetMarginAccount();
      // console.log(marginBalance)
      // const allAssets = await binance.sapiGetMarginMaxBorrowable({"asset":"XRP"});
      // console.log(allAssets)
      if(accountKeyInfo[3] === 'TuNV') { // write balance information to sheet
      }

      // console.log('Test lay balance') // WORK
      const maxAmount = await binance.sapiGetMarginAccount();
      console.log(maxAmount.userAssets.find(e=> e.asset === 'USDT').free)

      // DONE test newClientOrderId if it work!! ease game

      // console.log('Test dat lenh') // WORK
      // const d = await binance.sapiPostMarginOrder({
      //   symbol: 'BTCUSDT',
      //   side: 'BUY',
      //   type: 'LIMIT',
      //   quantity: '0.01',
      //   price: '3281',
      //   timeInForce: 'GTC',
      //   newClientOrderId: 0
      // })
      // console.log(d) // 1835673939

      // console.log('Test xoa lenh') // WORK
      // const d = await binance.sapiDeleteMarginOrder({
      //   symbol: 'BTCUSDT',
      //   // orderId: 0
      //   origClientOrderId: 0
      // })
      // console.log(d) //1835673939

      // console.log('Test vay tien san') // WORK
      // const d = await binance.sapiPostMarginLoan({
      //   asset: 'USDT',
      //   amount: 1
      // })
      // console.log(d)

      // console.log('Test tra tien san') // WORK
      // const d = await binance.sapiPostMarginRepay({
      //   asset: 'BNB',
      //   amount: 0.00000187
      // })
      // console.log(d)

      // console.log(balance.info.balances.filter(balance => balance.free > 0))
    }
  } catch (err) {
    console.log(err)
  }
})();

const { loadSpreadsheet } = require('./services/spreadsheetServices');
const ccxt = require ('ccxt');

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
};

const headquartersSpreadsheetRangeIndex = {
  apiInfo : 'API Info!B3:D10',
  apiMaginOrder : 'API Order!B3:D10',
  apiMarginBalance : 'API Balance!B3:D10',
};

(async () => {
  await sleep(2000)
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
      const allAssets = await binance.sapiGetMarginMaxBorrowable({"asset":"XRP"});
      console.log(allAssets)
      if(accountKeyInfo[3] === 'TuNV') {

      }
      // console.log(balance.info.balances.filter(balance => balance.free > 0))
    }
  } catch (err) {
    console.log(err)
  }
})();

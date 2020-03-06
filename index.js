(async () => {
  await require('./database/sequelize')
  const { loadSpreadsheet } = require('./services/spreadsheetServices');
  await loadSpreadsheet()
})();

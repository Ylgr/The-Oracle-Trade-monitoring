const { google } = require('googleapis');
const { getToken, getCredentialConfiguration, getExecuteSpreadsheet } = require('./repositoryServices');


const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

async function authorize(credentials,spreadsheetId, range, actionType = 'read') {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);
  const token = await getToken();
  oAuth2Client.setCredentials(token);
  if ( actionType === "read") {
    return await listMajors(oAuth2Client, spreadsheetId, range);
  } else if (actionType === 'write') {

  }

}

async function listMajors(auth, spreadsheetId, range) {
  const sheets = google.sheets({version: 'v4', auth});
  return (await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: range,
  })).data.values
}

async function writeMajors(auth, spreadsheetId, range, values) {
  const sheets = google.sheets({version: 'v4', auth});
  return (await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId,
    range: range,
  })).updatedCells
}


// Load client secrets from a local file.
async function loadSpreadsheet(range) {
  const credential = await getCredentialConfiguration();
  const spreadsheetId = await getExecuteSpreadsheet();
  return await authorize(credential, spreadsheetId, range);
}

async function writeBalance(range, infos) {
  const credential = await getCredentialConfiguration();
  const spreadsheetId = await getExecuteSpreadsheet();

}

module.exports = {
  loadSpreadsheet
};

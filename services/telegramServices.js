const axios = require('axios');

const instance = axios.create({
    headers: {
        'Content-Type': 'application/json'
    },
    responseType: 'json',
    crossDomain: true,
    withCredentials: false
});

function telegramMessageRequest(telegramToken, channelId, text) {
    return instance.get('https://api.telegram.org/bot' + telegramToken + '/sendMessage?chat_id=' + channelId + '&text=' + encodeURIComponent(text))
}

module.exports = {
    telegramMessageRequest
}
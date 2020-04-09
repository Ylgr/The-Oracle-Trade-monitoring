const TelegramBot = require('node-telegram-bot-api');
const { getTelegramBotToken } = require('./services/repositoryServices');

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

(async () => {
    await sleep(2000);
    try {
        const token = await getTelegramBotToken();
        console.log('token: ', token)
        // Create a bot that uses 'polling' to fetch new updates
        const bot = new TelegramBot(token, {polling: true});

        // Matches "/order [whatever]"
        bot.onText(/order (.+)/, (msg, match) => {
            // 'msg' is the received Message from Telegram
            // 'match' is the result of executing the regexp above on the text content
            // of the message

            const chatId = msg.chat.id;
            const resp = match[1]; // the captured "whatever"
            console.log('resp: ',match)
            // send back the matched "whatever" to the chat
            bot.sendMessage(chatId, resp);
        });

        // Matches "/order [whatever]"
        bot.onText(/registry (.+)/, (msg, match) => {
            // 'msg' is the received Message from Telegram
            // 'match' is the result of executing the regexp above on the text content
            // of the message

            const chatId = msg.chat.id;
            const resp = match[1]; // the captured "whatever"
            console.log('resp: ',match)
            // send back the matched "whatever" to the chat
            bot.sendMessage(chatId, resp);
        });
    } catch (err) {
        console.log(err)
    }
})()
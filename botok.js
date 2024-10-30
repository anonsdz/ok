const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');

// Thay thế BOT_TOKEN với token của bạn
const token = '7258312263:AAGIDrOdqp4vyqwMnB4-gALpK0rGjxkH4s4';
const adminChatIds = ['7371969470']; // ID chat admin

// Tạo bot
const bot = new TelegramBot(token, { polling: true });

// Gửi thông báo kết nối thành công
adminChatIds.forEach(chatId => {
    bot.sendMessage(chatId, 'Bot đã kết nối thành công với Telegram!');
});

// Xử lý tin nhắn
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const command = msg.text;

    // Kiểm tra xem người gửi có phải là admin không
    if (adminChatIds.includes(chatId.toString())) {
        // Chạy lệnh trong terminal
        exec(command, (error, stdout, stderr) => {
            if (error) {
                bot.sendMessage(chatId, `Error: ${error.message}`);
                return;
            }
            if (stderr) {
                bot.sendMessage(chatId, `Stderr: ${stderr}`);
                return;
            }
            bot.sendMessage(chatId, `Output: ${stdout}`);
        });
    } else {
        bot.sendMessage(chatId, 'Bạn không có quyền thực hiện lệnh này.');
    }
});

console.log('Bot đang chạy...');

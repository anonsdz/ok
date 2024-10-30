const TelegramBot = require('node-telegram-bot-api');

// Thay thế BOT_TOKEN với token của bạn
const token = '7258312263:AAGIDrOdqp4vyqwMnB4-gALpK0rGjxkH4s4'; // Token đúng
const adminChatIds = ['7371969470']; // ID chat admin

// Tạo bot
const bot = new TelegramBot(token, { polling: true });

// Gửi thông báo kết nối thành công
adminChatIds.forEach(chatId => {
    bot.sendMessage(chatId, 'Bot đã kết nối thành công với Telegram!')
        .catch(err => console.error(`Lỗi gửi tin nhắn: ${err.message}`)); // Bắt lỗi gửi tin nhắn
});

console.log('Bot đang chạy...');

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

// Lắng nghe tin nhắn
bot.on('message', (msg) => {
    const chatId = msg.chat.id;

    // Kiểm tra nếu tin nhắn đến từ admin
    if (adminChatIds.includes(chatId.toString())) {
        const command = msg.text; // Lệnh được gõ

        // Chạy lệnh trên terminal
        exec(command, (error, stdout, stderr) => {
            let response = '';

            // Kết hợp thông báo lỗi và stdout
            if (error) {
                response += `Lỗi: ${error.message}\n`;
            }
            if (stderr) {
                response += `Lỗi hệ thống: ${stderr}\n`;
            }
            if (stdout) {
                response += stdout;
            }

            // Hiển thị kết quả trên terminal
            console.log(response);

            // Gửi kết quả về Telegram
            if (response) {
                bot.sendMessage(chatId, response);
            }
        });
    }
});

console.log('cc đang chạy...');

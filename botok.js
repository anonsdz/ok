const TelegramBot = require('node-telegram-bot-api');

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

        // Hiển thị lệnh trên terminal
        console.log(`Nhận lệnh từ Telegram: ${command}`);

        // Chạy lệnh (nếu cần)
        const { exec } = require('child_process');
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Lỗi: ${error.message}`);
                return;
            }
            if (stderr) {
                console.error(`Lỗi: ${stderr}`);
                return;
            }
            console.log(`Kết quả: ${stdout}`);
        });
    }
});

console.log('Bot đang chạy...');

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const path = require('path');

// আপনার টেলিগ্রাম বটের টোকেন এখানে বসানো আছে
const token = '7990145229:AAFs514jG9G2D6v5_C7Lp7K-w4p5N6x8'; 
const bot = new TelegramBot(token, { polling: true });

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// সার্ভারের নিজস্ব ফোল্ডার থেকে ফ্রন্টএন্ড মিনি অ্যাপ সার্ভ করা
app.use(express.static(path.join(__dirname, 'public')));

// ইন-মেমোরি ইউজার ডেটাবেস (ইউজার আইডি, নাম ও ব্যালেন্স ট্র্যাক করার জন্য)
const users = {};

// বটের /start কমান্ড হ্যান্ডলার
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userFirstName = msg.from.first_name || 'User';
    const username = msg.from.username || 'No Username';

    // ইউজারের ডাটা সেভ বা ইনিশিয়ালাইজ করা
    if (!users[chatId]) {
        users[chatId] = {
            id: chatId,
            name: userFirstName,
            username: username,
            balance: 0.00
        };
    }

    const webAppUrl = `https://${process.env.RENDER_EXTERNAL_URL ? new URL(process.env.RENDER_EXTERNAL_URL).hostname : 'localhost:' + PORT}`;

    const welcomeMessage = `আসসালামু আলাইকুম, ${userFirstName}! 🌟\n\nআমাদের অফিশিয়াল টাচ আর্নিং বিডি প্ল্যাটফর্মে আপনাকে স্বাগতম। নিচে থেকে মিনি অ্যাপ ওপেন করে আপনার কাজ শুরু করুন এবং ব্যালেন্স চেক করুন।`;

    bot.sendMessage(chatId, welcomeMessage, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Start Earning (Mini App)", web_app: { url: `https://jalukihokal31-crypto.github.io/my-telegram-bot/` } }], // অথবা Render সার্ভার লিংক ব্যবহার করতে পারেন
                [{ text: "💰 My Balance", callback_data: "check_balance" }]
            ]
        }
    });
});

// ব্যালেন্স চেক করার কলব্যাক হ্যান্ডলার
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const user = users[chatId] || { balance: 0.00 };

    if (query.data === 'check_balance') {
        bot.answerCallbackQuery(query.id, {
            text: `আপনার বর্তমান ব্যালেন্স: ৳${user.balance.toFixed(2)}`,
            show_alert: true
        });
    }
});

// অ্যাডমিন প্যানেল রুট (যেকোনো ইউজারের ব্যালেন্স দেখার ও আপডেট করার জন্য)
app.get('/admin-secret-panel', (req, res) => {
    let userListHtml = '';
    for (let id in users) {
        userListHtml += `<tr><td>${users[id].id}</td><td>${users[id].name}</td><td>@${users[id].username}</td><td>৳${users[id].balance}</td></tr>`;
    }

    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Admin Panel - Touch Earning BD</title>
            <style>
                body { font-family: Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px; }
                .container { max-width: 800px; margin: auto; background: #1e293b; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
                h2 { color: #38bdf8; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { padding: 12px; border-bottom: 1px solid #334155; text-align: left; }
                th { background: #0ea5e9; color: white; }
            </style>
        </head>
        <body>
            <div class="container">
                <h2>👑 Secure Admin Control Panel</h2>
                <p>Registered Users on Bot:</p>
                <table>
                    <thead>
                        <tr><th>User ID</th><th>Name</th><th>Username</th><th>Balance</th></tr>
                    </thead>
                    <tbody>
                        ${userListHtml || '<tr><td colspan="4" style="text-align:center;">No users registered yet.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </body>
        </html>
    `);
});

// সার্ভার স্টার্ট
app.listen(PORT, () => {
    console.log(`Server is running smoothly on port ${PORT}`);
});

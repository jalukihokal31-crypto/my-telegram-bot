const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// আপনার আসল টোকেন এখানে বসানো আছে
const TOKEN = '8942840244:AAGs9fFyjtYut4gKuydL7Ciq21TGIe0KkIw';
const bot = new TelegramBot(TOKEN, { polling: true });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let users = {}; // ইউজার ডাটা সংরক্ষণের জন্য

// ১. বট স্টার্ট কমান্ড
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const username = msg.chat.first_name || 'User';

    if (!users[chatId]) {
        users[chatId] = { username: username, balance: 0, referrals: 0 };
    }

    bot.sendMessage(chatId, `স্বাগতম ${username}!\n\nআমাদের আর্নিং মিনি অ্যাপে আপনাকে স্বাগতম। নিচে ক্লিক করে আপনার ড্যাশবোর্ড দেখুন:`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: '🚀 ওপেন অ্যাপ ও ড্যাশবোর্ড', callback_data: 'open_app' }],
                [{ text: '👥 আমার রেফারেল', callback_data: 'my_ref' }]
            ]
        }
    });
});

// ইনলাইন বাটন হ্যান্ডলার
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    if (query.data === 'open_app') {
        bot.sendMessage(chatId, `আপনার বর্তমান ব্যালেন্স: $${users[chatId]?.balance || 0}`);
    } else if (query.data === 'my_ref') {
        // আপনার আসল বটের ইউজারনেম এখানে বসানো আছে
        const refLink = `https://t.me/touchearningbd_bot?start=${chatId}`;
        bot.sendMessage(chatId, `আপনার রেফারেল লিংক:\n${refLink}\n\nমোট রেফার: ${users[chatId]?.referrals || 0} জন`);
    }
});

// ২. আলাদা সিক্রেট অ্যাডমিন প্যানেল রাউট (ব্রাউজারে ওপেন হবে)
app.get('/admin-secret-panel', (req, res) => {
    let userListHtml = '';
    for (let id in users) {
        userListHtml += `<li>ID: ${id} | Name: ${users[id].username} | Balance: $${users[id].balance}</li>`;
    }

    res.send(`
        <html>
        <head><title>Admin Panel</title></head>
        <body style="font-family: Arial; padding: 20px; background: #f4f4f4;">
            <h2>🔐 সিক্রেট অ্যাডমিন প্যানেল</h2>
            <hr>
            <h3>ইউজার তালিকা (${Object.keys(users).length} জন):</h3>
            <ul>${userListHtml}</ul>
            <hr>
            <h3>ইউজারের ব্যালেন্স আপডেট করুন:</h3>
            <form action="/admin/update-balance" method="POST">
                <input type="text" name="chatId" placeholder="User Chat ID" required style="padding: 8px; margin: 5px;"><br>
                <input type="number" step="0.01" name="amount" placeholder="Amount (e.g. 5)" required style="padding: 8px; margin: 5px;"><br>
                <button type="submit" style="padding: 10px 20px; background: green; color: white; border: none;">ব্যালেন্স যোগ করুন</button>
            </form>
        </body>
        </html>
    `);
});

// অ্যাডমিন প্যানেল থেকে ব্যালেন্স আপডেট করার প্রসেস
app.post('/admin/update-balance', (req, res) => {
    const { chatId, amount } = req.body;
    if (users[chatId]) {
        users[chatId].balance += parseFloat(amount);
        bot.sendMessage(chatId, `আপনার অ্যাকাউন্টে $${amount} যোগ করা হয়েছে! নতুন ব্যালেন্স: $${users[chatId].balance}`);
        res.send(`<script>alert('সফলভাবে ব্যালেন্স আপডেট হয়েছে!'); window.location.href='/admin-secret-panel';</script>`);
    } else {
        res.send(`<script>alert('ইউজার পাওয়া যায়নি!'); window.location.href='/admin-secret-panel';</script>`);
    }
});

// সার্ভার চালু করা
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot and Admin Panel running on port ${PORT}`);
});

const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const http = require('http');

const BOT_TOKEN = "8645835190:AAHG0ZIzwvHSyds2B7nfZtnAEdMRhyjBs7U";
const ADMIN_CHAT_ID = "8271325752";
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(BOT_TOKEN);
const STATUS_FILE = path.join(__dirname, 'status.json');

if (!fs.existsSync(STATUS_FILE)) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify([], null, 2));
}

function updateStatus(trxId, status) {
    let data = [];
    try {
        data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    } catch (e) {}

    const index = data.findIndex(item => item.id === trxId);
    if (index !== -1) {
        data[index].status = status;
    } else {
        data.push({ id: trxId, status: status, timestamp: new Date().toISOString() });
    }
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

// Bot Callback
bot.on('callback_query', async (ctx) => {
    try {
        const data = ctx.callbackQuery.data;
        const chatId = ctx.callbackQuery.message.chat.id.toString();

        if (chatId !== ADMIN_CHAT_ID) return ctx.answerCbQuery("❌ Anda bukan admin!");

        if (data.startsWith('acc_')) {
            const [, trxId, nominal] = data.split('_');
            updateStatus(trxId, "SUCCESS");
            await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n✅ Topup Rp ${Number(nominal).toLocaleString('id-ID')} TELAH DITERIMA`);
            await ctx.answerCbQuery("✅ Diterima");
        } else if (data.startsWith('reject_')) {
            const [, trxId] = data.split('_');
            updateStatus(trxId, "REJECT");
            await ctx.editMessageText(ctx.callbackQuery.message.text + `\n\n❌ Topup TELAH DITOLAK`);
            await ctx.answerCbQuery("❌ Ditolak");
        }
    } catch (err) {
        console.error(err);
    }
});

bot.start((ctx) => ctx.reply("✅ GoldPay Bot Aktif!"));

bot.launch().then(() => console.log("Bot berjalan..."));

// ==================== HTTP SERVER + CORS ====================
const server = http.createServer((req, res) => {
    // CORS Header
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('GoldPay Bot is running ✅');
    } 
    else if (req.url.startsWith('/status.json')) {
        fs.readFile(STATUS_FILE, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        });
    } 
    else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
});

console.log("GoldPay Bot + Server siap...");
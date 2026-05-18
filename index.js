const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = "8645835190:AAHG0ZIzwvHSyds2B7nfZtnAEdMRhyjBs7U";
const ADMIN_CHAT_ID = "8271325752";

const bot = new Telegraf(BOT_TOKEN);

const STATUS_FILE = path.join(__dirname, 'status.json');

// Buat file status.json jika belum ada
if (!fs.existsSync(STATUS_FILE)) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify([], null, 2));
}

// Fungsi update status
function updateStatus(trxId, status) {
    let data = [];
    try {
        data = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    } catch (e) {}

    const index = data.findIndex(item => item.id === trxId);
    
    if (index !== -1) {
        data[index].status = status;
    } else {
        data.push({ 
            id: trxId, 
            status: status, 
            timestamp: new Date().toISOString() 
        });
    }

    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

// Handler Callback (Tombol Terima / Tolak)
bot.on('callback_query', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const chatId = ctx.callbackQuery.message.chat.id.toString();

    if (chatId !== ADMIN_CHAT_ID) {
        return ctx.answerCbQuery("❌ Anda bukan admin!");
    }

    if (data.startsWith('acc_')) {
        const [, trxId, nominal] = data.split('_');
        updateStatus(trxId, "SUCCESS");

        await ctx.editMessageText(
            ctx.callbackQuery.message.text + `\n\n✅ Topup Rp ${Number(nominal).toLocaleString('id-ID')} TELAH DITERIMA`,
            { parse_mode: 'HTML' }
        );

        await ctx.answerCbQuery("✅ Topup diterima!");

    } else if (data.startsWith('reject_')) {
        const [, trxId] = data.split('_');
        updateStatus(trxId, "REJECT");

        await ctx.editMessageText(
            ctx.callbackQuery.message.text + `\n\n❌ Topup TELAH DITOLAK`,
            { parse_mode: 'HTML' }
        );

        await ctx.answerCbQuery("❌ Topup ditolak");
    }
});

// Start Command
bot.start((ctx) => {
    ctx.reply("🤖 Bot GoldPay Topup Aktif!\n\nGunakan tombol di pesan topup untuk approve.");
});

bot.launch()
    .then(() => console.log("✅ Bot GoldPay berhasil dijalankan..."))
    .catch(err => console.error("❌ Error:", err));

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

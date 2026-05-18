const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');

const BOT_TOKEN = "8645835190:AAHG0ZIzwvHSyds2B7nfZtnAEdMRhyjBs7U";
const ADMIN_CHAT_ID = "8271325752";

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
        data.push({ 
            id: trxId, 
            status: status, 
            timestamp: new Date().toISOString() 
        });
    }

    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
}

bot.on('callback_query', async (ctx) => {
    try {
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
    } catch (err) {
        console.error(err);
    }
});

bot.start((ctx) => ctx.reply("✅ GoldPay Bot Aktif!"));

bot.launch()
    .then(() => console.log("🤖 Bot GoldPay berjalan..."))
    .catch(err => console.error(err));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
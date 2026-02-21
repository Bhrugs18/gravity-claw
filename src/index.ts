import { Bot, Context, NextFunction, InputFile } from 'grammy';
import axios from 'axios';
import { config } from './config.js';
import { processMessage } from './agent.js';
import { initHeartbeat } from './heartbeat.js';
import { startDashboard } from './dashboard.js';
import { globalState } from './state.js';

export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// Security: User Whitelist Middleware
bot.use(async (ctx: Context, next: NextFunction) => {
    const userId = ctx.from?.id;
    if (userId === config.ALLOWED_USER_ID) {
        await next();
    } else {
        // Helpful for initial setup: log the ID so the user can find it in their terminal
        console.info(`🛡️ Security: Blocked message from ID ${userId}. Expected ${config.ALLOWED_USER_ID}. If this is you, add this ID to ALLOWED_USER_ID in .env`);
    }
});

bot.on('message:text', async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const text = ctx.message?.text;
    if (!text) return;

    // Visual feedback: show "typing" while processing
    await ctx.replyWithChatAction('typing');

    const { reply, audio } = await processMessage(userId, text);

    if (reply) {
        console.log(`✅ Replied to ${userId}: ${reply.substring(0, 50)}...`);
        if (audio) {
            await ctx.replyWithVoice(new InputFile(audio), { caption: reply });
        } else {
            await ctx.reply(reply);
        }
    } else {
        console.log(`⚠️ No response from processMessage for ${userId}`);
    }
});

bot.on('message:voice', async (ctx: Context) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    await ctx.replyWithChatAction('typing');

    try {
        const voice = ctx.message?.voice;
        if (!voice) return;

        const file = await ctx.getFile();
        const fileUrl = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

        const responseBuffer = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const base64Audio = Buffer.from(responseBuffer.data).toString('base64');

        const { reply, audio } = await processMessage(userId, "[Voice Message]", {
            data: base64Audio,
            mimeType: voice.mime_type || "audio/ogg",
        });

        if (reply) {
            if (audio) {
                await ctx.replyWithVoice(new InputFile(audio), { caption: reply });
            } else {
                await ctx.reply(reply);
            }
        }
    } catch (error) {
        console.error("❌ Voice Processing Error:", error);
        await ctx.reply("⚠️ Sorry, I had trouble processing your voice message.");
    }
});

bot.catch((err) => {
    const ctx = err.ctx;
    console.error(`❌ Bot Error for update ${ctx.update.update_id}:`, err.error);
});

console.log('🚀 Gravity Claw is starting...');
initHeartbeat();
startDashboard();
bot.start({
    onStart: (botInfo: { username: string }) => {
        const msg = `✅ Bot @${botInfo.username} is active and polling.`;
        console.log(msg);
        globalState.addLog('system', msg);
    },
});

import { Bot, InputFile } from 'grammy';
import { config } from './src/config.js';
import { generateTTS } from './src/tools/tts.js';

async function testTelegramVoice() {
    console.log("Testing Telegram Voice Message Upload...");
    const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

    try {
        console.log("Generating audio buffer...");
        const audioBuffer = await generateTTS("This is a test message to see if Telegram accepts the audio buffer");
        console.log(`Audio generated: ${audioBuffer.length} bytes`);

        console.log("Sending to Telegram...");
        await bot.api.sendVoice(config.ALLOWED_USER_ID, new InputFile(audioBuffer, "response.ogg"));
        console.log("✅ Successfully sent voice message to Telegram!");
    } catch (e: any) {
        console.error("❌ Failed to send voice message:", e.message || e);
        if (e.response) {
            console.error("Response data:", e.response);
        }
    }
}

testTelegramVoice();

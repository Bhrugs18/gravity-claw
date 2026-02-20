import cron from 'node-cron';
import { bot } from './index.js';
import { config } from './config.js';
import { initiateProactiveCheckIn } from './agent.js';
import { InputFile } from 'grammy';

export function initHeartbeat() {
    console.log('💓 Heartbeat initialized. Scheduling daily check-in at 8 AM.');

    // Schedule: 0 8 * * * (8:00 AM every day)
    // For testing purposes, you can use '* * * * *' to run every minute.
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Heartbeat triggered: Running 8 AM accountability check.');

        try {
            const { reply, audio } = await initiateProactiveCheckIn(config.ALLOWED_USER_ID);

            if (reply) {
                if (audio) {
                    await bot.api.sendVoice(config.ALLOWED_USER_ID, new InputFile(audio), { caption: reply });
                } else {
                    await bot.api.sendMessage(config.ALLOWED_USER_ID, reply);
                }
                console.log(`✅ Heartbeat message sent to ${config.ALLOWED_USER_ID}`);
            }
        } catch (error) {
            console.error('❌ Heartbeat Error:', error);
        }
    });
}

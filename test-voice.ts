import { processMessage } from "./src/agent.js";
import { config } from "./src/config.js";

async function testVoice() {
    console.log("Testing processMessage with voice response capability...");
    try {
        const res = await processMessage(
            config.ALLOWED_USER_ID,
            "Hello! Please respond with a short voice message saying 'Hello there!'"
        );
        console.log("Agent text response:", res.reply);
        console.log("Audio generated:", res.audio ? `Yes (${res.audio.length} bytes)` : "No");
    } catch (e) {
        console.error("Test failed:", e);
    }
}

testVoice();

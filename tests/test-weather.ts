import { config } from "./src/config.js";
import { processMessage } from "./src/agent.js";

async function test() {
    console.log("Testing weather skill locally...");
    try {
        const response = await processMessage(config.ALLOWED_USER_ID, "So what's weather in rajkot");
        console.log("Response:", response.reply);
    } catch (e) {
        console.error("Test failed", e);
    }
}
test();

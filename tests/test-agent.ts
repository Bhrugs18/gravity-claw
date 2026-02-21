import { config } from "./src/config.js";
import { processMessage } from "./src/agent.js";

async function test() {
    console.log("Testing agent locally...");
    try {
        const response = await processMessage(config.ALLOWED_USER_ID, "Hello! Who are you?");
        console.log("Response:", response);
    } catch (e) {
        console.error("Test failed", e);
    }
}
test();

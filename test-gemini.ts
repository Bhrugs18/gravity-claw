import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./src/config.js";

async function test() {
    console.log("Testing with API Key...", config.GEMINI_API_KEY.slice(0, 5) + "...");
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    try {
        const result = await model.generateContent("Hello!");
        console.log(result.response.text());
    } catch (e: any) {
        console.error("FAIL", e);
    }
}
test();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "./src/config.js";

async function test() {
    const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
    const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const res = await embedModel.embedContent("test");
    console.log("Size:", res.embedding.values.length);
}
test();

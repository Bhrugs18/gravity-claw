import { GoogleGenerativeAI, Content, Part, SchemaType } from "@google/generative-ai";
import fs from "node:fs";
import { config } from "./config.js";
import { executeGetTime } from "./tools/time.js";
import { getWeather } from "./tools/weather.js";
import { runTerminalCommand } from "./tools/terminal.js";
import { scrapeWebsite } from "./tools/web_scrape.js";
import { getMemory, saveMemory, upsertEntity } from "./memory.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

const SOUL_CONTENT = fs.readFileSync("./src/soul.md", "utf-8");

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SOUL_CONTENT,
    tools: [
        {
            functionDeclarations: [
                {
                    name: "get_current_time",
                    description: "Get the current local time.",
                },
                {
                    name: "get_weather",
                    description: "Get the current weather for a specific location.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            location: {
                                type: SchemaType.STRING,
                                description: "The city/location to check the weather for (e.g., 'London', 'New York')."
                            }
                        },
                        required: ["location"]
                    }
                },
                {
                    name: "run_terminal_command",
                    description: "Execute a bash/shell command on the host system. Use this to install software, manage the OS, inspect files, or run scripts as requested by the user.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            command: {
                                type: SchemaType.STRING,
                                description: "The raw bash command to execute (e.g., 'apt-get install htop', 'ls -la', 'ps aux')."
                            }
                        },
                        required: ["command"]
                    }
                },
                {
                    name: "scrape_website",
                    description: "Fetch and read the readable text content of a webpage given its URL. Use this tool any time a user provides a link and asks you to analyze it.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            url: {
                                type: SchemaType.STRING,
                                description: "The full URL of the website to scrape (e.g., 'https://example.com/article')."
                            }
                        },
                        required: ["url"]
                    }
                },

                {
                    name: "update_entity",
                    description: "Store or update a core bit of information about the user or world (e.g., favorite food, server IP, birthday). Use this to remember important things for later.",
                    parameters: {
                        type: SchemaType.OBJECT,
                        properties: {
                            key: {
                                type: SchemaType.STRING,
                                description: "A simple key for the information (e.g., 'favorite_food')."
                            },
                            value: {
                                type: SchemaType.STRING,
                                description: "The value to remember (e.g., 'Pizza')."
                            }
                        },
                        required: ["key", "value"]
                    }
                }
            ],
        },
    ],
});

const history: Content[] = [];

export async function initiateProactiveCheckIn(userId: number): Promise<{ reply: string, audio?: Buffer }> {
    const proactivePrompt = `
[PROACTIVE TRIGGER]
It is 8:00 AM. Reach out to the user for their daily accountability check.
Ask them:
1. "Have you tracked your weight?"
2. "What's the biggest goal you want to achieve today?"

Use your 'Soul' and previous knowledge about 'Bhrugesh' to make it personal, direct, and non-sycophantic.
Look around corners—if there's a goal they mentioned previously, bring it up.
`;
    return processMessage(userId, proactivePrompt);
}

export async function processMessage(userId: number, text: string, audio?: { data: string, mimeType: string }): Promise<{ reply: string, audio?: Buffer }> {
    if (userId !== config.ALLOWED_USER_ID) {
        console.log(`🚫 Unauthorized access attempt by user ID: ${userId} (Expected: ${config.ALLOWED_USER_ID})`);
        return { reply: "Unauthorized" };
    }

    try {
        const memory = await getMemory(userId, text);
        const memoryContext = `
[MEMORY CONTEXT]
The following is relevant information from past conversations:
${memory.archival.length > 0 ? memory.archival.join('\n') : "No relevant history found."}

[KNOWN ENTITIES]
${Object.keys(memory.entities).length > 0
                ? Object.entries(memory.entities).map(([k, v]) => `${k}: ${v}`).join('\n')
                : "No entities known yet."}
`;

        const chat = model.startChat({
            history: history,
        });

        const prompt: (string | Part)[] = [];
        if (audio) {
            prompt.push({
                inlineData: {
                    data: audio.data,
                    mimeType: audio.mimeType,
                },
            });
            prompt.push("First, transcribe the audio exactly. Then, reply to it naturally as a helpful AI assistant.");
            prompt.push(memoryContext);
            prompt.push("Format your response as: TRANSCRIPT: [transcript]\n\nREPLY: [reply]");
        } else {
            prompt.push(memoryContext);
            prompt.push(text);
        }
        prompt.push("If you learn something core or important about the user, use the 'update_entity' tool to remember it forever.");

        let result = await chat.sendMessage(prompt);
        let response = result.response;
        let calls = response.functionCalls() || [];
        let finalAudio: Buffer | undefined;

        // Basic Agentic Loop (Level 1 - Gemini version)
        // For simplicity in Level 1, we handle one round of tool calls
        while (calls.length > 0) {
            const toolResults: Part[] = [];

            for (const call of calls) {
                if (call.name === "get_current_time") {
                    const time = await executeGetTime();
                    toolResults.push({
                        functionResponse: {
                            name: "get_current_time",
                            response: { content: time },
                        },
                    });
                } else if (call.name === "get_weather") {
                    const args = call.args as { location: string };
                    const weather = await getWeather(args.location);
                    toolResults.push({
                        functionResponse: {
                            name: "get_weather",
                            response: { content: weather },
                        },
                    });
                } else if (call.name === "run_terminal_command") {
                    const args = call.args as { command: string };
                    const output = await runTerminalCommand(args.command);
                    toolResults.push({
                        functionResponse: {
                            name: "run_terminal_command",
                            response: { content: output },
                        },
                    });
                } else if (call.name === "scrape_website") {
                    const args = call.args as { url: string };
                    const text = await scrapeWebsite(args.url);
                    toolResults.push({
                        functionResponse: {
                            name: "scrape_website",
                            response: { content: text },
                        },
                    });
                } else if (call.name === "update_entity") {
                    const args = call.args as { key: string, value: string };
                    try {
                        await upsertEntity(userId, args.key, args.value);
                        toolResults.push({
                            functionResponse: {
                                name: "update_entity",
                                response: { content: `Successfully remembered: ${args.key} = ${args.value}` },
                            },
                        });
                    } catch (err) {
                        console.error("❌ Entity Error:", err);
                        toolResults.push({
                            functionResponse: {
                                name: "update_entity",
                                response: { content: "Error saving information." },
                            },
                        });
                    }
                }
            }

            if (toolResults.length > 0) {
                result = await chat.sendMessage(toolResults);
                response = result.response;
                calls = response.functionCalls() || [];
            } else {
                break;
            }
        }

        const reply = response.text();

        // 💾 Save to Memory
        await saveMemory(userId, 'user', text);
        await saveMemory(userId, 'assistant', reply);

        // Optional: Local history for session continuity (limited)
        history.push({ role: 'user', parts: [{ text }] });
        history.push({ role: 'model', parts: [{ text: reply }] });
        if (history.length > 20) history.splice(0, 2);

        return {
            reply,
            audio: finalAudio
        };

    } catch (error: any) {
        console.error("❌ Agent Error Detail:", error);
        if (error.response) {
            console.error("❌ Gemini Response Detail:", JSON.stringify(error.response, null, 2));
        }
        return { reply: "⚠️ Sorry, I encountered an error while processing your request with Gemini." };
    }
}

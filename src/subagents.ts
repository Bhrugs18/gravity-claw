import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { config } from "./config.js";
import { globalState } from "./state.js";
import { getWeather } from "./tools/weather.js";
import { runTerminalCommand } from "./tools/terminal.js";
import { scrapeWebsite } from "./tools/web_scrape.js";

const genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);

export interface SubAgentDefinition {
    name: string;
    description: string;
    systemInstruction: string;
    tools: string[];
}

const TOOL_DEFINITIONS: Record<string, any> = {
    get_weather: {
        name: "get_weather",
        description: "Get the current weather for a specific location.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: { location: { type: SchemaType.STRING } },
            required: ["location"]
        }
    },
    run_terminal_command: {
        name: "run_terminal_command",
        description: "Execute a bash/shell command.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: { command: { type: SchemaType.STRING } },
            required: ["command"]
        }
    },
    scrape_website: {
        name: "scrape_website",
        description: "Fetch and read webpage text.",
        parameters: {
            type: SchemaType.OBJECT,
            properties: { url: { type: SchemaType.STRING } },
            required: ["url"]
        }
    }
};

const subAgents = new Map<string, SubAgentDefinition>();

export function registerSubAgent(def: SubAgentDefinition) {
    subAgents.set(def.name, def);
    globalState.updateSubAgent(def.name, { status: 'idle', task: 'Created' });
    globalState.addLog('system', `Sub-agent registered: ${def.name}`);
}

export async function delegateToSubAgent(name: string, task: string): Promise<string> {
    const def = subAgents.get(name);
    if (!def) throw new Error(`Sub-agent ${name} not found.`);

    globalState.updateSubAgent(name, { status: 'working', task });
    globalState.addLog(name, `Starting task: ${task}`);

    const modelTools = def.tools.map(t => TOOL_DEFINITIONS[t]).filter(Boolean);
    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Efficient for sub-tasks
        systemInstruction: def.systemInstruction,
        tools: modelTools.length > 0 ? [{ functionDeclarations: modelTools }] : []
    });

    const chat = model.startChat();
    let result = await chat.sendMessage(task);
    let response = result.response;

    // Mini agent loop
    let calls = response.functionCalls();
    while (calls && calls.length > 0) {
        const toolResults = [];
        for (const call of calls) {
            let output = "";
            if (call.name === "get_weather") output = await getWeather((call.args as any).location);
            if (call.name === "run_terminal_command") output = await runTerminalCommand((call.args as any).command);
            if (call.name === "scrape_website") output = await scrapeWebsite((call.args as any).url);

            toolResults.push({
                functionResponse: { name: call.name, response: { content: output } }
            });
        }
        result = await chat.sendMessage(toolResults);
        response = result.response;
        calls = response.functionCalls();
    }

    const finalReply = response.text();
    globalState.updateSubAgent(name, { status: 'completed', lastResponse: finalReply });
    globalState.addLog(name, `Task finished.`);
    return finalReply;
}

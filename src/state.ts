export interface SubAgentRecord {
    name: string;
    task: string;
    status: 'idle' | 'working' | 'completed' | 'failed';
    lastResponse?: string;
}

export interface LogEntry {
    timestamp: string;
    sender: 'system' | 'agent' | string;
    message: string;
}

class GlobalState {
    public subAgents: Map<string, SubAgentRecord> = new Map();
    public logs: LogEntry[] = [];

    addLog(sender: string, message: string) {
        const entry = {
            timestamp: new Date().toISOString(),
            sender,
            message
        };
        this.logs.push(entry);
        if (this.logs.length > 50) this.logs.shift(); // Keep last 50
        console.log(`[${sender}] ${message}`);
    }

    updateSubAgent(name: string, record: Partial<SubAgentRecord>) {
        const existing = this.subAgents.get(name) || { name, task: '', status: 'idle' };
        this.subAgents.set(name, { ...existing, ...record });
    }

    getState() {
        return {
            subAgents: Array.from(this.subAgents.values()),
            logs: this.logs
        };
    }
}

export const globalState = new GlobalState();

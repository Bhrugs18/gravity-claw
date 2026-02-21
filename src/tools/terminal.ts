import { exec } from 'node:child_process';
import util from 'node:util';

const execPromise = util.promisify(exec);

export async function runTerminalCommand(command: string): Promise<string> {
    try {
        console.log(`🤖 Executing System Command: ${command}`);
        const { stdout, stderr } = await execPromise(command, { timeout: 30000 }); // 30s timeout

        let output = stdout.trim();
        if (stderr) {
            output += `\n[STDERR]:\n${stderr.trim()}`;
        }

        if (!output) {
            return "Command executed successfully with no output.";
        }

        // Cap output length to prevent overloading Gemini context
        if (output.length > 2000) {
            output = output.substring(0, 2000) + "\n...[Output Truncated]";
        }

        return output;
    } catch (error: any) {
        console.error("❌ Terminal Execution Error:", error.message);
        return `Error executing command: ${error.message}\nStdErr: ${error.stderr || 'None'}`;
    }
}

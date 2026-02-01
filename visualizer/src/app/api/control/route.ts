
import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);

// Path to the root directory relative to where this code runs
// In Next.js dev mode/production, resolving paths can be tricky.
// We'll assume the process cwd is the visualizer directory, so we go up one level.
// However, the user is running `make viz-dev` from the root, but that `cd`s into visualizer.
// So `process.cwd()` should be `.../visualizer`.
const ROOT_DIR = path.resolve(process.cwd(), "..");
const LOG_FILE = path.join(ROOT_DIR, "logs", "app.log");

const getServiceStatus = async () => {
    try {
        // Check if the service is running using launchctl list
        // The plist name is com.scribe.service as per Makefile
        const { stdout } = await execPromise("launchctl list | grep com.scribe.service || true");
        const isRunning = stdout.trim().length > 0;

        // If running, try to get the PID to find start time
        let uptimeStr = "0s";

        if (isRunning) {
            // Parse the PID from launchctl output: "PID  Status  Label"
            const parts = stdout.trim().split(/\s+/);
            const pid = parts[0];

            if (pid && pid !== "-") {
                try {
                    // Get elapsed time in seconds using ps
                    const { stdout: etimeOut } = await execPromise(`ps -p ${pid} -o etime=`);
                    uptimeStr = etimeOut.trim();
                } catch (e) {
                    // Ignore error if ps fails
                }
            }
        }

        return { isRunning, uptime: uptimeStr };
    } catch (error) {
        console.error("Error checking status:", error);
        return { isRunning: false, uptime: "0s" };
    }
};

const getLogStats = async () => {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return { success: 0, error: 0 };
        }

        // Read the last N bytes or lines to avoid reading a huge file
        // For now, let's read the whole file if it's not too big, or use tail logic.
        // Given the user request "count of error/failed/exception", scanning the whole file might be slow if it's huge.
        // But for a personal tool, it's likely manageable. Let's read it.

        // Better approach: Read file content
        const content = await fs.promises.readFile(LOG_FILE, "utf-8");
        const lines = content.split("\n");

        let success = 0;
        let error = 0;

        for (const line of lines) {
            const lowerLine = line.toLowerCase();
            if (lowerLine.includes("saved in") || lowerLine.includes("processed in")) {
                success++;
            }
            if (lowerLine.includes("error") || lowerLine.includes("failed") || lowerLine.includes("exception")) {
                error++;
            }
        }

        return { success, error };
    } catch (error) {
        console.error("Error reading logs:", error);
        return { success: 0, error: 0 };
    }
};

export async function GET() {
    const status = await getServiceStatus();
    const stats = await getLogStats();

    return NextResponse.json({
        status: status.isRunning ? "running" : "stopped",
        uptime: status.uptime,
        successCount: stats.success,
        errorCount: stats.error
    });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { command } = body;

        if (command !== "start" && command !== "stop") {
            return NextResponse.json({ error: "Invalid command" }, { status: 400 });
        }

        const cmd = `cd "${ROOT_DIR}" && make ${command}`;
        await execPromise(cmd);

        // Wait a bit for the status to change
        await new Promise(resolve => setTimeout(resolve, 1000));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error executing command:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import util from "util";

const execPromise = util.promisify(exec);






const ROOT_DIR = path.resolve(process.cwd(), "..");
const LOG_FILE = path.join(ROOT_DIR, "logs", "app.log");

const getServiceStatus = async () => {
    try {
        
        
        const { stdout } = await execPromise("launchctl list | grep com.scribe.service || true");
        const isRunning = stdout.trim().length > 0;

        
        let uptimeStr = "0s";

        if (isRunning) {
            
            const parts = stdout.trim().split(/\s+/);
            const pid = parts[0];

            if (pid && pid !== "-") {
                try {
                    
                    const { stdout: etimeOut } = await execPromise(`ps -p ${pid} -o etime=`);
                    uptimeStr = etimeOut.trim();
                } catch (e) {
                    
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

        
        await new Promise(resolve => setTimeout(resolve, 1000));

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Error executing command:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', 'analyse.log');

async function getPm2Status() {
    try {
        const { stdout } = await execAsync('pm2 jlist');
        const processes = JSON.parse(stdout);
        const analyzer = processes.find((p: any) => p.name === 'scribe-analyzer');
        return analyzer ? analyzer.pm2_env.status : 'stopped';
    } catch (error) {
        console.error('Error checking pm2 status:', error);
        return 'unknown';
    }
}

async function getAnalysisStats() {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            return { processed: 0, total: 0, success: 0, failed: 0 };
        }

        const statsResult = await fs.promises.stat(LOG_FILE);
        const size = statsResult.size;
        const bufferSize = Math.min(5000, size);
        if (bufferSize <= 0) return { processed: 0, total: 0, success: 0, failed: 0 };

        const buffer = Buffer.alloc(bufferSize);
        const handle = await fs.promises.open(LOG_FILE, 'r');
        await handle.read(buffer, 0, bufferSize, size - bufferSize);
        await handle.close();

        const content = buffer.toString('utf-8');
        const lines = content.split('\n').reverse();

        const progressRegex = /Progress: (\d+)\/(\d+) \((\d+) success, (\d+) failed\)/;

        for (const line of lines) {
            const match = line.match(progressRegex);
            if (match) {
                return {
                    processed: parseInt(match[1]),
                    total: parseInt(match[2]),
                    success: parseInt(match[3]),
                    failed: parseInt(match[4])
                };
            }
        }

        return { processed: 0, total: 0, success: 0, failed: 0 };
    } catch (error) {
        console.error('Error reading log file:', error);
        return { processed: 0, total: 0, success: 0, failed: 0 };
    }
}

export async function GET() {
    const status = await getPm2Status();
    const stats = await getAnalysisStats();

    return NextResponse.json({
        status,
        ...stats
    });
}

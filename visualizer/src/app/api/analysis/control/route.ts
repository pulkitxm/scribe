import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import util from 'util';

const execAsync = util.promisify(exec);

const PROJECT_ROOT = path.resolve(process.cwd(), '..');
const LOG_FILE = path.join(PROJECT_ROOT, 'logs', 'analyse.log');

export async function POST(req: Request) {
    try {
        const { command, resetLogs } = await req.json();

        if (resetLogs) {
            if (fs.existsSync(LOG_FILE)) {
                await fs.promises.truncate(LOG_FILE, 0);
            }
        }

        let cmd = '';
        // Using make commands from the root directory
        // We append --yes to analyze to skip confirmation if it accepts it via make
        // But Makefile runs: pm2 start ... -- --yes
        // So `make analyze YES=1` or just `make analyze` with `analyze.js` logic handled.
        // The Makefile for analyze says:
        // @pm2 start analyze.js ... $(if $(YES),--yes,)
        // So we can pass YES=1 env var or just rely on the args.

        switch (command) {
            case 'start':
                // Ensure we pass YES=1 to avoid interaction if the script asks (though analyze.js handles flags)
                cmd = `make analyze YES=true`;
                break;
            case 'stop':
                cmd = `make analyze-stop`;
                break;
            case 'restart':
                cmd = `make analyze-restart`;
                break;
            case 'delete':
                cmd = `make analyze-delete`;
                break;
            default:
                return NextResponse.json({ error: 'Invalid command' }, { status: 400 });
        }

        const { stdout, stderr } = await execAsync(cmd, { cwd: PROJECT_ROOT });

        return NextResponse.json({ success: true, stdout, stderr });
    } catch (error: any) {
        console.error('Error executing control command:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

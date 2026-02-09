import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const LOG_FILE = path.join(PROJECT_ROOT, "logs", "analyse.log");

export async function GET() {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return new NextResponse("Log file not found", { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(LOG_FILE);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="analyse.log"',
        "Content-Type": "text/plain",
      },
    });
  } catch (error: any) {
    console.error("Error downloading logs:", error);
    return new NextResponse("Error downloading logs", { status: 500 });
  }
}

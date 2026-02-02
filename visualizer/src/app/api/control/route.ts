import { NextRequest, NextResponse } from "next/server";
import { execPromise, getFullStatus, ROOT_DIR } from "@/lib/control";

export async function GET() {
  const stats = await getFullStatus();
  return NextResponse.json(stats);
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

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error executing command:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

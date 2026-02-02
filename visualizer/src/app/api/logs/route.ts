import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "app";

    let filename = "app.log";
    if (type === "analyze") {
      filename = "analyse.log";
    }

    const logFilePath = path.join(process.cwd(), `../logs/${filename}`);

    if (!fs.existsSync(logFilePath)) {
      return NextResponse.json(
        { error: "Log file not found" },
        { status: 404 },
      );
    }

    const fileContent = fs.readFileSync(logFilePath, "utf-8");
    return NextResponse.json({ content: fileContent });
  } catch (error) {
    console.error("Error reading log file:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

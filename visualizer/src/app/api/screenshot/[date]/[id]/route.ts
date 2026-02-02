import { NextRequest, NextResponse } from "next/server";
import { getScreenshotById } from "@/lib/data";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string; id: string }> },
) {
  const { date, id } = await params;

  const screenshot = getScreenshotById(date, id);

  if (!screenshot) {
    return NextResponse.json(
      { error: "Screenshot not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    id: screenshot.id,
    timestamp: screenshot.timestamp.toISOString(),
    date: screenshot.date,
    imagePath: screenshot.imagePath,
    data: screenshot.data,
  });
}

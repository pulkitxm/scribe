import { NextRequest, NextResponse } from "next/server";
import { getImagePath } from "@/lib/data";
import fs from "fs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date");
  const file = searchParams.get("file");

  if (!date || !file) {
    return NextResponse.json(
      { error: "Missing date or file parameter" },
      { status: 400 },
    );
  }

  const imagePath = getImagePath(date, file);

  if (!imagePath) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const imageBuffer = fs.readFileSync(imagePath);

  return new NextResponse(imageBuffer, {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public, max-age=31536000",
    },
  });
}

import { NextResponse } from "next/server";
import { getAllDates } from "@/lib/data";

export async function GET() {
  const dates = getAllDates();
  return NextResponse.json({ dates });
}

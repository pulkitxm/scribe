import { NextRequest, NextResponse } from "next/server";
import { getAllScreenshots } from "@/lib/data";

export async function GET(request: NextRequest) {
    const screenshots = getAllScreenshots();

    const tagCounts: Record<string, number> = {};

    for (const ss of screenshots) {
        for (const tag of ss.data.summary_tags) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
    }

    const tags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([tag]) => tag);

    return NextResponse.json({ tags, tagCounts });
}

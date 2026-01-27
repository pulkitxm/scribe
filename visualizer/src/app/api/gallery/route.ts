import { NextRequest, NextResponse } from "next/server";
import { getScreenshotsForDate, getAllDates } from "@/lib/data";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const tag = searchParams.get("tag");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");

    let allScreenshots: {
        id: string;
        timestamp: string;
        date: string;
        imagePath: string;
        category: string;
        tags: string[];
    }[] = [];

    const dates = date ? [date] : getAllDates();

    for (const d of dates) {
        const screenshots = getScreenshotsForDate(d);
        allScreenshots = allScreenshots.concat(
            screenshots.map((s) => ({
                id: s.id,
                timestamp: s.timestamp.toISOString(),
                date: s.date,
                imagePath: s.imagePath,
                category: s.data.category,
                tags: s.data.summary_tags || [],
            }))
        );
    }

    allScreenshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (tag) {
        allScreenshots = allScreenshots.filter((s) => s.tags.includes(tag));
    }

    if (category) {
        allScreenshots = allScreenshots.filter((s) => s.category === category);
    }

    const start = (page - 1) * limit;
    const end = start + limit;

    return NextResponse.json({
        screenshots: allScreenshots.slice(start, end),
        total: allScreenshots.length,
        page,
        totalPages: Math.ceil(allScreenshots.length / limit),
        hasMore: end < allScreenshots.length,
    });
}

import { NextRequest, NextResponse } from "next/server";
import { getScreenshotsSummaryForDate, getAllDates } from "@/lib/data";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "24");

    if (date) {
        const screenshots = getScreenshotsSummaryForDate(date);
        const start = (page - 1) * limit;
        const end = start + limit;

        return NextResponse.json({
            screenshots: screenshots.slice(start, end).map((s) => ({
                id: s.id,
                timestamp: s.timestamp.toISOString(),
                date: s.date,
                imagePath: s.imagePath,
            })),
            total: screenshots.length,
            page,
            totalPages: Math.ceil(screenshots.length / limit),
            hasMore: end < screenshots.length,
        });
    }

    const dates = getAllDates();
    let allScreenshots: { id: string; timestamp: string; date: string; imagePath: string }[] = [];

    for (const d of dates) {
        const screenshots = getScreenshotsSummaryForDate(d);
        allScreenshots = allScreenshots.concat(
            screenshots.map((s) => ({
                id: s.id,
                timestamp: s.timestamp.toISOString(),
                date: s.date,
                imagePath: s.imagePath,
            }))
        );
    }

    allScreenshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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

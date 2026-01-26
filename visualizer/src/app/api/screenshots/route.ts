import { NextRequest, NextResponse } from "next/server";
import {
    getAllScreenshots,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getUniqueCategories,
    getUniqueApps,
    getStatsOnly,
} from "@/lib/data";
import { FilterOptions } from "@/types/screenshot";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const statsOnly = searchParams.get("statsOnly") === "true";
    const aggregation = searchParams.get("aggregation") || "daily";

    const filters: FilterOptions = {};
    if (searchParams.get("startDate")) filters.startDate = searchParams.get("startDate")!;
    if (searchParams.get("endDate")) filters.endDate = searchParams.get("endDate")!;
    if (searchParams.get("category")) filters.category = searchParams.get("category")!;
    if (searchParams.get("app")) filters.app = searchParams.get("app")!;
    if (searchParams.get("minFocusScore"))
        filters.minFocusScore = parseInt(searchParams.get("minFocusScore")!);
    if (searchParams.get("minProductivityScore"))
        filters.minProductivityScore = parseInt(searchParams.get("minProductivityScore")!);

    const allScreenshots = getAllScreenshots(filters);
    const categories = getUniqueCategories(allScreenshots);
    const apps = getUniqueApps(allScreenshots);

    if (statsOnly) {
        const stats = getStatsOnly(allScreenshots);
        let aggregatedStats;

        switch (aggregation) {
            case "weekly":
                aggregatedStats = getWeeklyStats(allScreenshots);
                break;
            case "monthly":
                aggregatedStats = getMonthlyStats(allScreenshots);
                break;
            default:
                aggregatedStats = getDailyStats(allScreenshots);
        }

        return NextResponse.json({
            stats,
            aggregatedStats,
            categories,
            apps,
            total: allScreenshots.length,
        });
    }

    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedScreenshots = allScreenshots.slice(start, end);

    let aggregatedStats;
    switch (aggregation) {
        case "weekly":
            aggregatedStats = getWeeklyStats(allScreenshots);
            break;
        case "monthly":
            aggregatedStats = getMonthlyStats(allScreenshots);
            break;
        default:
            aggregatedStats = getDailyStats(allScreenshots);
    }

    return NextResponse.json({
        screenshots: paginatedScreenshots.map((s) => ({
            id: s.id,
            timestamp: s.timestamp.toISOString(),
            date: s.date,
            imagePath: s.imagePath,
            category: s.data.category,
            scores: s.data.scores,
            shortDescription: s.data.short_description,
            activeApp: s.data.evidence.active_app_guess,
        })),
        aggregatedStats,
        categories,
        apps,
        total: allScreenshots.length,
        page,
        totalPages: Math.ceil(allScreenshots.length / limit),
        hasMore: end < allScreenshots.length,
    });
}

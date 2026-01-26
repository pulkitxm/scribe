import { NextRequest, NextResponse } from "next/server";
import {
    getAllScreenshots,
    getDailyStats,
    getWeeklyStats,
    getMonthlyStats,
    getUniqueCategories,
    getUniqueApps,
    getExtendedStats,
} from "@/lib/data";
import { FilterOptions } from "@/types/screenshot";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const statsOnly = searchParams.get("statsOnly") === "true";
    const aggregation = searchParams.get("aggregation") || "daily";
    const extended = searchParams.get("extended") === "true";

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
        const stats = extended ? getExtendedStats(allScreenshots) : getBasicStats(allScreenshots);
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

function getBasicStats(screenshots: any[]) {
    if (screenshots.length === 0) {
        return {
            avgFocus: 0,
            avgProductivity: 0,
            avgDistraction: 0,
            totalScreenshots: 0,
            categories: {},
            apps: {},
            hourlyDistribution: {},
        };
    }

    const categories: Record<string, number> = {};
    const apps: Record<string, number> = {};
    const hourlyDistribution: Record<number, number> = {};

    let totalFocus = 0;
    let totalProductivity = 0;
    let totalDistraction = 0;

    for (const item of screenshots) {
        totalFocus += item.data.scores.focus_score;
        totalProductivity += item.data.scores.productivity_score;
        totalDistraction += item.data.scores.distraction_risk;

        categories[item.data.category] = (categories[item.data.category] || 0) + 1;

        for (const app of item.data.evidence.apps_visible) {
            apps[app] = (apps[app] || 0) + 1;
        }

        const hour = item.timestamp.getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
    }

    return {
        avgFocus: Math.round(totalFocus / screenshots.length),
        avgProductivity: Math.round(totalProductivity / screenshots.length),
        avgDistraction: Math.round(totalDistraction / screenshots.length),
        totalScreenshots: screenshots.length,
        categories,
        apps,
        hourlyDistribution,
    };
}

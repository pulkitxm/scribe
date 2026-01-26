import fs from "fs";
import path from "path";
import { Screenshot, ScreenshotData, DailyStats, FilterOptions } from "@/types/screenshot";

let cachedFolder: string | null = null;
const folderCache: Map<string, Screenshot[]> = new Map();
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000;

function getScribeFolder(): string {
    if (cachedFolder) return cachedFolder;

    const envPath = path.join(process.cwd(), "..", ".env");
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf-8");
        const match = envContent.match(/SCRIBE_FOLDER="([^"]+)"/);
        if (match) {
            cachedFolder = match[1];
            return cachedFolder;
        }
    }
    cachedFolder = process.env.SCRIBE_FOLDER || "";
    return cachedFolder;
}

function isCacheValid(): boolean {
    return Date.now() - cacheTimestamp < CACHE_DURATION;
}

function clearCacheIfStale() {
    if (!isCacheValid()) {
        folderCache.clear();
        cacheTimestamp = Date.now();
    }
}

export function getAllDates(): string[] {
    const folder = getScribeFolder();
    if (!folder || !fs.existsSync(folder)) return [];

    const dirs = fs.readdirSync(folder, { withFileTypes: true });
    return dirs
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort((a, b) => {
            const parseDate = (str: string) => {
                const parts = str.split("-");
                return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            };
            return parseDate(b).getTime() - parseDate(a).getTime();
        });
}

export function getScreenshotsForDate(dateFolder: string): Screenshot[] {
    clearCacheIfStale();

    if (folderCache.has(dateFolder)) {
        return folderCache.get(dateFolder)!;
    }

    const folder = getScribeFolder();
    if (!folder) return [];

    const datePath = path.join(folder, dateFolder);
    if (!fs.existsSync(datePath)) return [];

    const files = fs.readdirSync(datePath);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const screenshots = jsonFiles.map((jsonFile) => {
        const jsonPath = path.join(datePath, jsonFile);
        const imagePath = jsonPath.replace(".json", ".webp");
        const data: ScreenshotData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

        const timestampMatch = jsonFile.match(/screenshot_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
        let timestamp = new Date();
        if (timestampMatch) {
            const [datePart, timePart] = timestampMatch[1].split("_");
            const [year, month, day] = datePart.split("-").map(Number);
            const [hour, minute, second] = timePart.split("-").map(Number);
            timestamp = new Date(year, month - 1, day, hour, minute, second);
        }

        return {
            id: jsonFile.replace(".json", ""),
            timestamp,
            date: dateFolder,
            imagePath: `/api/image?date=${dateFolder}&file=${path.basename(imagePath)}`,
            jsonPath,
            data,
        };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    folderCache.set(dateFolder, screenshots);
    return screenshots;
}

export function getScreenshotById(date: string, id: string): Screenshot | null {
    const folder = getScribeFolder();
    if (!folder) return null;

    const jsonPath = path.join(folder, date, `${id}.json`);
    if (!fs.existsSync(jsonPath)) return null;

    const data: ScreenshotData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    const imagePath = `${id}.webp`;

    const timestampMatch = id.match(/screenshot_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/);
    let timestamp = new Date();
    if (timestampMatch) {
        const [datePart, timePart] = timestampMatch[1].split("_");
        const [year, month, day] = datePart.split("-").map(Number);
        const [hour, minute, second] = timePart.split("-").map(Number);
        timestamp = new Date(year, month - 1, day, hour, minute, second);
    }

    return {
        id,
        timestamp,
        date,
        imagePath: `/api/image?date=${date}&file=${imagePath}`,
        jsonPath,
        data,
    };
}

export function getAllScreenshots(filters?: FilterOptions): Screenshot[] {
    const dates = getAllDates();
    let allScreenshots: Screenshot[] = [];

    for (const date of dates) {
        const screenshots = getScreenshotsForDate(date);
        allScreenshots = allScreenshots.concat(screenshots);
    }

    if (filters) {
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            allScreenshots = allScreenshots.filter((s) => s.timestamp >= start);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59);
            allScreenshots = allScreenshots.filter((s) => s.timestamp <= end);
        }
        if (filters.category) {
            allScreenshots = allScreenshots.filter((s) => s.data.category === filters.category);
        }
        if (filters.app) {
            allScreenshots = allScreenshots.filter((s) =>
                s.data.evidence.apps_visible.includes(filters.app!)
            );
        }
        if (filters.minFocusScore !== undefined) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.scores.focus_score >= filters.minFocusScore!
            );
        }
        if (filters.minProductivityScore !== undefined) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.scores.productivity_score >= filters.minProductivityScore!
            );
        }
        if (filters.project) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.context.code_context?.repo_or_project === filters.project
            );
        }
        if (filters.domain) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.evidence.web_domains_visible.includes(filters.domain!)
            );
        }
        if (filters.language) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.context.code_context?.language === filters.language
            );
        }
        if (filters.workspace) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.workspace_type === filters.workspace
            );
        }
        if (filters.text) {
            const query = filters.text.toLowerCase();
            allScreenshots = allScreenshots.filter((s) =>
                s.data.evidence.text_snippets.some(snippet =>
                    snippet.toLowerCase().includes(query)
                )
            );
        }
        if (filters.tag) {
            const query = filters.tag.toLowerCase();
            allScreenshots = allScreenshots.filter((s) =>
                s.data.summary_tags.some((t) => t.toLowerCase() === query)
            );
        }
    }

    return allScreenshots;
}

export function getExtendedStats(screenshots: Screenshot[]) {
    if (screenshots.length === 0) {
        return {
            avgFocus: 0,
            avgProductivity: 0,
            avgDistraction: 0,
            totalScreenshots: 0,
            categories: {},
            apps: {},
            hourlyDistribution: {},
            workTypes: {},
            languages: {},
            repos: {},
            domains: {},
            tags: {},
            workspaceTypes: {},
            avgConfidence: 0,
        };
    }

    const categories: Record<string, number> = {};
    const apps: Record<string, number> = {};
    const hourlyDistribution: Record<number, number> = {};
    const workTypes: Record<string, number> = {};
    const languages: Record<string, number> = {};
    const repos: Record<string, number> = {};
    const domains: Record<string, number> = {};
    const tags: Record<string, number> = {};
    const workspaceTypes: Record<string, number> = {};

    let totalFocus = 0;
    let totalProductivity = 0;
    let totalDistraction = 0;
    let totalConfidence = 0;

    for (const item of screenshots) {
        totalFocus += item.data.scores.focus_score;
        totalProductivity += item.data.scores.productivity_score;
        totalDistraction += item.data.scores.distraction_risk;
        totalConfidence += item.data.confidence;

        categories[item.data.category] = (categories[item.data.category] || 0) + 1;

        if (item.data.workspace_type) {
            workspaceTypes[item.data.workspace_type] = (workspaceTypes[item.data.workspace_type] || 0) + 1;
        }

        for (const app of item.data.evidence.apps_visible) {
            apps[app] = (apps[app] || 0) + 1;
        }

        for (const domain of item.data.evidence.web_domains_visible || []) {
            domains[domain] = (domains[domain] || 0) + 1;
        }

        for (const tag of item.data.summary_tags) {
            tags[tag] = (tags[tag] || 0) + 1;
        }

        const hour = item.timestamp.getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;

        const workType = item.data.context.work_context?.work_type;
        if (workType) {
            workTypes[workType] = (workTypes[workType] || 0) + 1;
        }

        const language = item.data.context.code_context?.language;
        if (language) {
            languages[language] = (languages[language] || 0) + 1;
        }

        const repo = item.data.context.code_context?.repo_or_project;
        if (repo) {
            repos[repo] = (repos[repo] || 0) + 1;
        }
    }

    return {
        avgFocus: Math.round(totalFocus / screenshots.length),
        avgProductivity: Math.round(totalProductivity / screenshots.length),
        avgDistraction: Math.round(totalDistraction / screenshots.length),
        totalScreenshots: screenshots.length,
        categories,
        apps,
        hourlyDistribution,
        workTypes,
        languages,
        repos,
        domains,
        tags,
        workspaceTypes,
        avgConfidence: Math.round((totalConfidence / screenshots.length) * 100),
    };
}

export function getDailyStats(screenshots: Screenshot[]): DailyStats[] {
    const grouped: Record<string, Screenshot[]> = {};

    for (const ss of screenshots) {
        if (!grouped[ss.date]) {
            grouped[ss.date] = [];
        }
        grouped[ss.date].push(ss);
    }

    return Object.entries(grouped).map(([date, items]) => {
        const categories: Record<string, number> = {};
        const apps: Record<string, number> = {};
        const workTypes: Record<string, number> = {};

        let totalFocus = 0;
        let totalProductivity = 0;
        let totalDistraction = 0;

        for (const item of items) {
            totalFocus += item.data.scores.focus_score;
            totalProductivity += item.data.scores.productivity_score;
            totalDistraction += item.data.scores.distraction_risk;

            categories[item.data.category] = (categories[item.data.category] || 0) + 1;

            for (const app of item.data.evidence.apps_visible) {
                apps[app] = (apps[app] || 0) + 1;
            }

            const workType = item.data.context.work_context?.work_type;
            if (workType) {
                workTypes[workType] = (workTypes[workType] || 0) + 1;
            }
        }

        return {
            date,
            avgFocusScore: Math.round(totalFocus / items.length),
            avgProductivityScore: Math.round(totalProductivity / items.length),
            avgDistraction: Math.round(totalDistraction / items.length),
            totalScreenshots: items.length,
            categories,
            apps,
            workTypes,
        };
    });
}

export function getWeeklyStats(screenshots: Screenshot[]): DailyStats[] {
    const grouped: Record<string, Screenshot[]> = {};

    for (const ss of screenshots) {
        const date = ss.timestamp;
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay() + 1);
        const weekKey = `${weekStart.getDate()}-${weekStart.getMonth() + 1}-${weekStart.getFullYear()}`;

        if (!grouped[weekKey]) {
            grouped[weekKey] = [];
        }
        grouped[weekKey].push(ss);
    }

    return Object.entries(grouped).map(([weekKey, items]) => {
        const categories: Record<string, number> = {};
        const apps: Record<string, number> = {};
        const workTypes: Record<string, number> = {};

        let totalFocus = 0;
        let totalProductivity = 0;
        let totalDistraction = 0;

        for (const item of items) {
            totalFocus += item.data.scores.focus_score;
            totalProductivity += item.data.scores.productivity_score;
            totalDistraction += item.data.scores.distraction_risk;

            categories[item.data.category] = (categories[item.data.category] || 0) + 1;

            for (const app of item.data.evidence.apps_visible) {
                apps[app] = (apps[app] || 0) + 1;
            }

            const workType = item.data.context.work_context?.work_type;
            if (workType) {
                workTypes[workType] = (workTypes[workType] || 0) + 1;
            }
        }

        return {
            date: `Week ${weekKey}`,
            avgFocusScore: Math.round(totalFocus / items.length),
            avgProductivityScore: Math.round(totalProductivity / items.length),
            avgDistraction: Math.round(totalDistraction / items.length),
            totalScreenshots: items.length,
            categories,
            apps,
            workTypes,
        };
    });
}

export function getMonthlyStats(screenshots: Screenshot[]): DailyStats[] {
    const grouped: Record<string, Screenshot[]> = {};

    for (const ss of screenshots) {
        const date = ss.timestamp;
        const monthKey = `${date.getMonth() + 1}-${date.getFullYear()}`;

        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        grouped[monthKey].push(ss);
    }

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return Object.entries(grouped).map(([monthKey, items]) => {
        const [month, year] = monthKey.split("-").map(Number);
        const categories: Record<string, number> = {};
        const apps: Record<string, number> = {};
        const workTypes: Record<string, number> = {};

        let totalFocus = 0;
        let totalProductivity = 0;
        let totalDistraction = 0;

        for (const item of items) {
            totalFocus += item.data.scores.focus_score;
            totalProductivity += item.data.scores.productivity_score;
            totalDistraction += item.data.scores.distraction_risk;

            categories[item.data.category] = (categories[item.data.category] || 0) + 1;

            for (const app of item.data.evidence.apps_visible) {
                apps[app] = (apps[app] || 0) + 1;
            }

            const workType = item.data.context.work_context?.work_type;
            if (workType) {
                workTypes[workType] = (workTypes[workType] || 0) + 1;
            }
        }

        return {
            date: `${monthNames[month - 1]} ${year}`,
            avgFocusScore: Math.round(totalFocus / items.length),
            avgProductivityScore: Math.round(totalProductivity / items.length),
            avgDistraction: Math.round(totalDistraction / items.length),
            totalScreenshots: items.length,
            categories,
            apps,
            workTypes,
        };
    });
}

export function getUniqueCategories(screenshots: Screenshot[]): string[] {
    const categories = new Set(screenshots.map((s) => s.data.category));
    return Array.from(categories).filter(Boolean).sort();
}

export function getUniqueApps(screenshots: Screenshot[]): string[] {
    const apps = new Set<string>();
    for (const ss of screenshots) {
        for (const app of ss.data.evidence.apps_visible) {
            apps.add(app);
        }
    }
    return Array.from(apps).sort();
}

export function getImagePath(dateFolder: string, fileName: string): string | null {
    const folder = getScribeFolder();
    if (!folder) return null;

    const imagePath = path.join(folder, dateFolder, fileName);
    if (fs.existsSync(imagePath)) {
        return imagePath;
    }
    return null;
}

export function getHighFocusScreenshots(limit: number = 4): Screenshot[] {
    const all = getAllScreenshots();
    return all
        .filter((s) => s.data.scores.focus_score > 80)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);
}

export function getSmartInsights(stats: ReturnType<typeof getExtendedStats>): string[] {
    const insights: string[] = [];

    // Focus time insight
    const hourly = stats.hourlyDistribution;
    let bestHour = -1;
    let maxActivity = 0;

    Object.entries(hourly).forEach(([hour, count]) => {
        if (count > maxActivity) {
            maxActivity = count;
            bestHour = parseInt(hour);
        }
    });

    if (bestHour !== -1) {
        const period = bestHour < 12 ? "morning" : bestHour < 17 ? "afternoon" : "evening";
        insights.push(`You are most active in the ${period} around ${bestHour}:00.`);
    }

    // Top category
    const topCat = Object.entries(stats.categories).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
        insights.push(`${topCat[0]} is your primary focus (${Math.round(topCat[1] / stats.totalScreenshots * 100)}% of time).`);
    }

    // Focus score
    if (stats.avgFocus > 75) {
        insights.push("Great job! Your average focus score is high.");
    } else if (stats.avgDistraction > 30) {
        insights.push("Distraction risk is elevated. Consider blocking notifications.");
    }

    return insights;
}

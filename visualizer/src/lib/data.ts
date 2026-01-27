import fs from "fs";
import path from "path";
import Fuse from "fuse.js";
import { Screenshot, ScreenshotData, DailyStats, FilterOptions, Session } from "@/types/screenshot";
import { ScreenshotDataSchema } from "@/lib/schemas";

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
    if (!cachedFolder && fs.existsSync(path.join(process.cwd(), "..", "outputs-dev"))) {
        cachedFolder = path.join(process.cwd(), "..", "outputs-dev");
    }
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

    const screenshots = jsonFiles.map((jsonFile): Screenshot | null => {
        const jsonPath = path.join(datePath, jsonFile);
        const imagePath = jsonPath.replace(".json", ".webp");
        let rawData;

        try {
            rawData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        } catch (e) {
            console.warn(`Failed to parse JSON: ${jsonPath}`, e);
            return null;
        }

        let data;
        try {
            data = ScreenshotDataSchema.parse(rawData);
        } catch (error) {
            console.error(`Validation Error in ${jsonPath}:`, error);
            throw new Error(`Validation failed for ${jsonFile}: ${error}`);
        }

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
    })
        .filter((s): s is Screenshot => s !== null)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    folderCache.set(dateFolder, screenshots);
    return screenshots;
}

export function getScreenshotById(date: string, id: string): Screenshot | null {
    const folder = getScribeFolder();
    if (!folder) return null;

    const jsonPath = path.join(folder, date, `${id}.json`);
    if (!fs.existsSync(jsonPath)) return null;

    const rawData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
    let data;
    try {
        data = ScreenshotDataSchema.parse(rawData);
    } catch (error) {
        console.error(`Validation Error in ${id}:`, error);
        throw new Error(`Validation failed for ${id}: ${error}`);
    }
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
                s.data.evidence?.apps_visible?.includes(filters.app!)
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
                (s) => s.data.evidence?.web_domains_visible?.includes(filters.domain!)
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
            const query = filters.text.trim();
            const words = query.split(/\s+/).filter(Boolean);
            const normalizedQuery = query.toLowerCase().trim();

            const fuseOptions = {
                keys: [
                    { name: "data.category", weight: 2.0 },
                    { name: "data.summary_tags", weight: 1.5 },
                    { name: "data.evidence.text_snippets", weight: 1.0 },
                    { name: "data.evidence.web_domains_visible", weight: 0.5 },
                    { name: "data.evidence.apps_visible", weight: 0.5 },
                ],
                threshold: 0.4,
                distance: 100,
                findAllMatches: true,
                useExtendedSearch: true,
            };

            const exactMatches: Screenshot[] = [];
            const otherScreenshots: Screenshot[] = [];

            for (const s of allScreenshots) {
                const categoryLower = s.data.category.toLowerCase();
                const tagsLower = (s.data.summary_tags || []).map(t => t.toLowerCase());

                if (categoryLower === normalizedQuery || tagsLower.includes(normalizedQuery)) {
                    exactMatches.push(s);
                } else {
                    otherScreenshots.push(s);
                }
            }

            const fuse = new Fuse(otherScreenshots, fuseOptions);

            const fuseQuery = words.length > 1 ? words.join(" | ") : query;
            const fuseResults = fuse.search(fuseQuery);

            allScreenshots = [...exactMatches, ...fuseResults.map(r => r.item)];
        }
        if (filters.tag) {
            const query = filters.tag.toLowerCase();
            allScreenshots = allScreenshots.filter((s) =>
                (s.data.summary_tags || []).some((t) => t.toLowerCase() === query)
            );
        }
        if (filters.maxFocusScore !== undefined) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.scores.focus_score <= filters.maxFocusScore!
            );
        }
        if (filters.maxProductivityScore !== undefined) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.scores.productivity_score <= filters.maxProductivityScore!
            );
        }
        if (filters.maxDistractionScore !== undefined) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.scores.distraction_risk <= filters.maxDistractionScore!
            );
        }
        if (filters.timeOfDay) {
            allScreenshots = allScreenshots.filter((s) => {
                const hour = s.timestamp.getHours();
                switch (filters.timeOfDay) {
                    case 'morning': return hour >= 5 && hour < 12;
                    case 'afternoon': return hour >= 12 && hour < 17;
                    case 'evening': return hour >= 17 && hour < 21;
                    case 'night': return hour >= 21 || hour < 5;
                    default: return true;
                }
            });
        }
        if (filters.hasCode) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.context.code_context?.language && s.data.context.code_context.language !== ""
            );
        }
        if (filters.isMeeting) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.context.communication_context?.meeting_indicator === true
            );
        }
        if (filters.lowBattery) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.system_metadata?.stats.battery.percentage !== undefined &&
                    s.data.system_metadata.stats.battery.percentage < 20
            );
        }
        if (filters.highCpu) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.system_metadata?.stats.cpu.used !== undefined &&
                    s.data.system_metadata.stats.cpu.used > 80
            );
        }
        if (filters.hasErrors) {
            allScreenshots = allScreenshots.filter(
                (s) => s.data.context.code_context?.errors_or_logs_visible === true
            );
        }
        if (filters.network) {
            allScreenshots = allScreenshots.filter((s) => {
                const net = s.data.system_metadata?.stats.network;
                if (!net) return false;
                const name = net.ssid || (net.connected ? "Unknown Network" : null);
                return name === filters.network;
            });
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
            hourlyContextSwitches: {},
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
    const hourlyContextSwitches: Record<number, number> = {};
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

    let totalCpu = 0;
    let totalRam = 0;
    let totalBattery = 0;
    let wifiCount = 0;
    const networks: Record<string, number> = {};

    let batterySamples = 0;
    let cpuSamples = 0;
    let ramSamples = 0;

    const sorted = [...screenshots].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    let prevItem: Screenshot | null = null;

    for (const item of sorted) {
        // ... existing aggregation ...
        totalFocus += item.data.scores.focus_score;
        totalProductivity += item.data.scores.productivity_score;
        totalDistraction += item.data.scores.distraction_risk;
        totalConfidence += item.data.confidence;

        // System Stats
        if (item.data.system_metadata?.stats) {
            const s = item.data.system_metadata.stats;

            if (s.cpu?.used !== undefined) {
                totalCpu += s.cpu.used;
                cpuSamples++;
            }

            if (s.ram?.used !== undefined && s.ram?.total !== undefined && s.ram.total > 0) {
                const percent = (s.ram.used / s.ram.total) * 100;
                totalRam += percent;
                ramSamples++;
            }

            if (s.battery?.percentage !== undefined) {
                totalBattery += s.battery.percentage;
                batterySamples++;
            }

            if (s.network) {
                const name = s.network.ssid || (s.network.connected ? "Unknown Network" : null);
                if (name) {
                    networks[name] = (networks[name] || 0) + 1;
                }
            }
        }

        // ... existing aggregation properties ...
        categories[item.data.category] = (categories[item.data.category] || 0) + 1;

        if (item.data.workspace_type) {
            workspaceTypes[item.data.workspace_type] = (workspaceTypes[item.data.workspace_type] || 0) + 1;
        }

        if (item.data.evidence && item.data.evidence.apps_visible) {
            for (const app of item.data.evidence.apps_visible) {
                apps[app] = (apps[app] || 0) + 1;
            }
        }

        if (item.data.evidence && item.data.evidence.web_domains_visible) {
            for (const domain of item.data.evidence.web_domains_visible) {
                domains[domain] = (domains[domain] || 0) + 1;
            }
        }

        if (item.data.summary_tags) {
            for (const tag of item.data.summary_tags) {
                tags[tag] = (tags[tag] || 0) + 1;
            }
        }

        const hour = item.timestamp.getHours();
        hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;

        // Context Switches
        if (prevItem) {
            const appChanged = (item.data.system_metadata?.active_app || item.data.evidence?.active_app_guess) !==
                (prevItem.data.system_metadata?.active_app || prevItem.data.evidence?.active_app_guess);
            if (appChanged) {
                hourlyContextSwitches[hour] = (hourlyContextSwitches[hour] || 0) + 1;
            }
        }
        prevItem = item;

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
        avgCpu: cpuSamples > 0 ? Math.round(totalCpu / cpuSamples) : 0,
        avgRam: ramSamples > 0 ? Math.round(totalRam / ramSamples) : 0,
        avgBattery: batterySamples > 0 ? Math.round(totalBattery / batterySamples) : 0,
        totalScreenshots: screenshots.length,
        categories,
        apps,
        hourlyDistribution,
        hourlyContextSwitches,
        workTypes,
        languages,
        repos,
        domains,
        tags,
        workspaceTypes,
        networks,
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

            if (item.data.evidence && item.data.evidence.apps_visible) {
                for (const app of item.data.evidence.apps_visible) {
                    apps[app] = (apps[app] || 0) + 1;
                }
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

            if (item.data.evidence && item.data.evidence.apps_visible) {
                for (const app of item.data.evidence.apps_visible) {
                    apps[app] = (apps[app] || 0) + 1;
                }
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

            if (item.data.evidence && item.data.evidence.apps_visible) {
                for (const app of item.data.evidence.apps_visible) {
                    apps[app] = (apps[app] || 0) + 1;
                }
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
        if (ss.data.evidence && ss.data.evidence.apps_visible) {
            for (const app of ss.data.evidence.apps_visible) {
                apps.add(app);
            }
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

export interface Insight {
    type: "positive" | "negative" | "neutral" | "info";
    icon: string;
    title: string;
    description: string;
}

export function getSmartInsights(stats: ReturnType<typeof getExtendedStats>): Insight[] {
    const insights: Insight[] = [];

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
        insights.push({
            type: "info",
            icon: "clock",
            title: "Peak Productivity",
            description: `You are most active in the ${period} around ${bestHour}:00.`
        });
    }

    const topCat = Object.entries(stats.categories).sort((a, b) => b[1] - a[1])[0];
    if (topCat) {
        insights.push({
            type: "neutral",
            icon: "chart",
            title: "Primary Focus",
            description: `${topCat[0]} accounts for ${Math.round(topCat[1] / stats.totalScreenshots * 100)}% of your time.`
        });
    }

    if (stats.avgFocus > 75) {
        insights.push({
            type: "positive",
            icon: "zap",
            title: "High Focus",
            description: "Great job! Your average focus score is consistently high."
        });
    } else if (stats.avgDistraction > 30) {
        insights.push({
            type: "negative",
            icon: "alert",
            title: "High Distraction",
            description: "Distraction risk is elevated. Consider blocking notifications."
        });
    }

    const topLang = Object.entries(stats.languages).sort((a, b) => b[1] - a[1])[0];
    if (topLang) {
        insights.push({
            type: "info",
            icon: "code",
            title: "Top Language",
            description: `You are writing a lot of ${topLang[0]} code recently.`
        });
    }

    return insights;
}

export function getSessions(filters?: FilterOptions): Session[] {
    const screenshots = getAllScreenshots(filters).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (screenshots.length === 0) return [];

    const sessions: Session[] = [];
    let currentSessionScreenshots: Screenshot[] = [screenshots[0]];

    // Thresholds
    const IDLE_THRESHOLD_MS = 60 * 1000; // 60 seconds

    for (let i = 1; i < screenshots.length; i++) {
        const prev = screenshots[i - 1];
        const curr = screenshots[i];

        const timeDiff = curr.timestamp.getTime() - prev.timestamp.getTime();
        const categoryChanged = curr.data.category !== prev.data.category;
        const appChanged = (curr.data.system_metadata?.active_app || curr.data.evidence?.active_app_guess) !==
            (prev.data.system_metadata?.active_app || prev.data.evidence?.active_app_guess);

        // Decide if we should break the session
        // We break if:
        // 1. Time gap is too large (idle)
        // 2. Category changes (e.g. coding -> browsing)
        // 3. Active app changes (e.g. VS Code -> Chrome)

        const isNewSession = timeDiff > IDLE_THRESHOLD_MS || categoryChanged || appChanged;

        if (isNewSession) {
            // Finalize current session
            sessions.push(createSessionFromScreenshots(currentSessionScreenshots));
            currentSessionScreenshots = [curr];
        } else {
            currentSessionScreenshots.push(curr);
        }
    }

    // Push the last session
    if (currentSessionScreenshots.length > 0) {
        sessions.push(createSessionFromScreenshots(currentSessionScreenshots));
    }

    return sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
}

function createSessionFromScreenshots(screenshots: Screenshot[]): Session {
    const first = screenshots[0];
    const last = screenshots[screenshots.length - 1];

    // Calculate aggregates
    const totalFocus = screenshots.reduce((sum, s) => sum + s.data.scores.focus_score, 0);
    const totalProd = screenshots.reduce((sum, s) => sum + s.data.scores.productivity_score, 0);
    const totalDistraction = screenshots.reduce((sum, s) => sum + s.data.scores.distraction_risk, 0);

    // Find dominant app
    const appCounts: Record<string, number> = {};
    screenshots.forEach(s => {
        const app = s.data.system_metadata?.active_app || s.data.evidence?.active_app_guess || "Unknown";
        appCounts[app] = (appCounts[app] || 0) + 1;
    });
    const dominantApp = Object.entries(appCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

    // Collect tags
    const allTags = new Set<string>();
    screenshots.forEach(s => (s.data.summary_tags || []).forEach(t => allTags.add(t)));

    // Calculate additional metrics
    let contextSwitches = 0;
    let interruptions = 0;
    const projectCounts: Record<string, number> = {};

    for (let i = 0; i < screenshots.length; i++) {
        const s = screenshots[i];

        // Interruptions: High distraction
        if (s.data.scores.distraction_risk > 75) {
            interruptions++;
        }

        // Project
        const project = s.data.context.code_context?.repo_or_project || "Unknown";
        if (project !== "Unknown") {
            projectCounts[project] = (projectCounts[project] || 0) + 1;
        }

        // Context Switches
        if (i > 0) {
            const prev = screenshots[i - 1];
            const appChanged = (s.data.system_metadata?.active_app || s.data.evidence?.active_app_guess) !==
                (prev.data.system_metadata?.active_app || prev.data.evidence?.active_app_guess);
            if (appChanged) contextSwitches++;
        }
    }

    const dominantProject = Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
        id: `session_${first.timestamp.getTime()}`,
        startTime: first.timestamp,
        endTime: last.timestamp,
        durationSeconds: (last.timestamp.getTime() - first.timestamp.getTime()) / 1000,
        screenshotCount: screenshots.length,
        category: first.data.category,
        dominantApp,
        dominantProject,
        avgFocusScore: Math.round(totalFocus / screenshots.length),
        avgProductivityScore: Math.round(totalProd / screenshots.length),
        avgDistractionScore: Math.round(totalDistraction / screenshots.length),
        screenshots,
        workType: first.data.context.work_context?.work_type,
        project: first.data.context.code_context?.repo_or_project,
        tags: Array.from(allTags),
        contextSwitches,
        interruptions,
        workspaceStabilityScore: calculateWorkspaceStability(screenshots) // Placeholder if we want to add later, or omit
    };
}

function calculateWorkspaceStability(screenshots: Screenshot[]): number {
    // Basic implementation: inverse of window churn?
    // For now returning 100 as placeholder or removing if not in interface yet.
    // Spec said "Calculate workspaceStability score".
    // I will implement a rudimentary one: 100 - (contextSwitches * 5).
    let switches = 0;
    for (let i = 1; i < screenshots.length; i++) {
        const s = screenshots[i];
        const prev = screenshots[i - 1];
        const appChanged = (s.data.system_metadata?.active_app || s.data.evidence?.active_app_guess) !==
            (prev.data.system_metadata?.active_app || prev.data.evidence?.active_app_guess);
        if (appChanged) switches++;
    }
    return Math.max(0, 100 - (switches * 5));
}

export function getAppStats(screenshots: Screenshot[]) {
    const appStats: Record<string, { focus: number; productivity: number; distraction: number; count: number }> = {};

    for (const s of screenshots) {
        const app = s.data.system_metadata?.active_app || s.data.evidence?.active_app_guess || "Unknown";

        if (!appStats[app]) {
            appStats[app] = { focus: 0, productivity: 0, distraction: 0, count: 0 };
        }

        appStats[app].focus += s.data.scores.focus_score;
        appStats[app].productivity += s.data.scores.productivity_score;
        appStats[app].distraction += s.data.scores.distraction_risk;
        appStats[app].count += 1;
    }

    return Object.entries(appStats).map(([name, stats]) => ({
        name,
        avgFocus: Math.round(stats.focus / stats.count),
        avgProductivity: Math.round(stats.productivity / stats.count),
        avgDistraction: Math.round(stats.distraction / stats.count),
        count: stats.count,
        efficiency: Math.round((stats.productivity / stats.count) - (stats.distraction / stats.count))
    })).sort((a, b) => b.count - a.count);
}

export function getSystemContextStats(screenshots: Screenshot[]) {
    // Aggregates for Pie/Bar charts
    const learningTopics: Record<string, number> = {};
    const communicationPlatforms: Record<string, number> = {};
    const entertainmentTypes: Record<string, number> = {};
    const audioInputDevices: Record<string, number> = {};
    const audioOutputDevices: Record<string, number> = {};

    // Time-series data (averaged per hour)
    const hourlyStats: Record<number, {
        cpu: number;
        ram: number;
        volume: number;
        count: number;
        battery: number;
    }> = {};

    for (const s of screenshots) {
        // Contexts
        if (s.data.context.learning_context?.learning_topic) {
            const topic = s.data.context.learning_context.learning_topic;
            learningTopics[topic] = (learningTopics[topic] || 0) + 1;
        }
        if (s.data.context.communication_context?.platform_guess) {
            const platform = s.data.context.communication_context.platform_guess;
            communicationPlatforms[platform] = (communicationPlatforms[platform] || 0) + 1;
        }
        if (s.data.context.entertainment_context?.entertainment_type) {
            const type = s.data.context.entertainment_context.entertainment_type;
            entertainmentTypes[type] = (entertainmentTypes[type] || 0) + 1;
        }

        // System Audio Devices
        if (s.data.system_metadata?.audio) {
            s.data.system_metadata.audio.inputs.forEach(d => {
                if (d.is_default) audioInputDevices[d.name] = (audioInputDevices[d.name] || 0) + 1;
            });
            s.data.system_metadata.audio.outputs.forEach(d => {
                if (d.is_default) audioOutputDevices[d.name] = (audioOutputDevices[d.name] || 0) + 1;
            });
        }

        // Hourly Trends
        if (s.data.system_metadata) {
            const hour = s.timestamp.getHours();
            if (!hourlyStats[hour]) {
                hourlyStats[hour] = { cpu: 0, ram: 0, volume: 0, count: 0, battery: 0 };
            }
            hourlyStats[hour].cpu += s.data.system_metadata.stats.cpu.used;
            hourlyStats[hour].ram += (s.data.system_metadata.stats.ram.used / 1024 / 1024 / 1024); // GB
            hourlyStats[hour].volume += s.data.system_metadata.audio.volume;
            hourlyStats[hour].battery += s.data.system_metadata.stats.battery.percentage;
            hourlyStats[hour].count++;
        }
    }

    // Format for Recharts
    const hourlyTrends = Object.entries(hourlyStats).map(([hour, stats]) => ({
        hour: parseInt(hour),
        cpu: Math.round(stats.cpu / stats.count),
        ram: Number((stats.ram / stats.count).toFixed(1)),
        volume: Math.round(stats.volume / stats.count),
        battery: Math.round(stats.battery / stats.count),
    })).sort((a, b) => a.hour - b.hour);

    return {
        learningTopics,
        communicationPlatforms,
        entertainmentTypes,
        audioInputDevices,
        audioOutputDevices,
        hourlyTrends
    };
}

export function getSessionById(sessionId: string): Session | undefined {
    // sessionId format: session_TIMESTAMP
    try {
        const timestampStr = sessionId.replace("session_", "");
        const timestamp = parseInt(timestampStr);
        if (isNaN(timestamp)) return undefined;

        const date = new Date(timestamp);
        // Assuming session starts on this date.
        // We fetch sessions for this specific date string.
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        // Get sessions for this date
        const sessions = getSessions({ startDate: dateStr, endDate: dateStr });
        return sessions.find(s => s.id === sessionId);
    } catch (e) {
        console.error("Error fetching session by id", e);
        return undefined;
    }
}

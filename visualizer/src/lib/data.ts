import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import Fuse, { IFuseOptions } from "fuse.js";
import {
  Screenshot,
  ScreenshotData,
  DailyStats,
  FilterOptions,
} from "@/types/screenshot";
import { ScreenshotDataSchema } from "@/lib/schemas";

let cachedFolder: string | null = null;
const folderCache: Map<string, Screenshot[]> = new Map();
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60_000;

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
  if (
    !cachedFolder &&
    fs.existsSync(path.join(process.cwd(), "..", "outputs-dev"))
  ) {
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
        return new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
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

  const screenshots = jsonFiles
    .map((jsonFile): Screenshot | null => {
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
        console.warn(
          `Skipping incomplete file ${jsonPath}:`,
          error instanceof Error ? error.message : error,
        );
        return null;
      }

      const timestampMatch = jsonFile.match(
        /screenshot_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/,
      );
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
    console.warn(
      `Skipping incomplete screenshot ${id}:`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
  const imagePath = `${id}.webp`;

  const timestampMatch = id.match(
    /screenshot_(\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2})/,
  );
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

/**
 * Apply filter options to a screenshot list (in-memory). Used to avoid
 * loading all data twice when dashboard needs both filtered and global views.
 */
export function applyFilters(
  screenshots: Screenshot[],
  filters: FilterOptions,
): Screenshot[] {
  if (!filters || Object.keys(filters).length === 0) return screenshots;

  let result = screenshots;

  if (filters.startDate && !filters.dateFolder) {
    const start = new Date(filters.startDate);
    result = result.filter((s) => s.timestamp >= start);
  }
  if (filters.endDate && !filters.dateFolder) {
    const end = new Date(filters.endDate);
    end.setHours(23, 59, 59);
    result = result.filter((s) => s.timestamp <= end);
  }
  if (filters.category) {
    result = result.filter((s) => s.data.category === filters.category);
  }
  if (filters.app) {
    result = result.filter((s) =>
      s.data.evidence?.apps_visible?.includes(filters.app!),
    );
  }
  if (filters.minFocusScore !== undefined) {
    result = result.filter(
      (s) => s.data.scores.focus_score >= filters.minFocusScore!,
    );
  }
  if (filters.minProductivityScore !== undefined) {
    result = result.filter(
      (s) => s.data.scores.productivity_score >= filters.minProductivityScore!,
    );
  }
  if (filters.project) {
    result = result.filter(
      (s) => s.data.context.code_context?.repo_or_project === filters.project,
    );
  }
  if (filters.domain) {
    result = result.filter((s) =>
      s.data.evidence?.web_domains_visible?.includes(filters.domain!),
    );
  }
  if (filters.language) {
    result = result.filter(
      (s) => s.data.context.code_context?.language === filters.language,
    );
  }
  if (filters.workspace) {
    result = result.filter((s) => s.data.workspace_type === filters.workspace);
  }
  if (filters.location) {
    const locationFilter = filters.location.trim();
    const normalizeLocationKey = (value: string) => {
      const parts = value.split(",").map((p) => p.trim());
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          return `${Math.round(lat * 100) / 100},${Math.round(lon * 100) / 100}`;
        }
      }
      return value;
    };
    const normalizedFilter = normalizeLocationKey(locationFilter);
    result = result.filter((s) => {
      const loc = s.data.location;
      if (!loc) return false;
      const key =
        loc.name?.trim() ||
        `${Math.round(loc.latitude * 100) / 100},${Math.round(loc.longitude * 100) / 100}`;
      return key === normalizedFilter;
    });
  }
  if (filters.text) {
    const query = filters.text.trim();
    const words = query.split(/\s+/).filter(Boolean);
    const normalizedQuery = query.toLowerCase().trim();

    const fuseOptions: IFuseOptions<Screenshot> = {
      keys: [
        { name: "data.category", weight: 3.0 },
        { name: "data.summary_tags", weight: 2.5 },
        { name: "data.short_description", weight: 2.0 },
        { name: "data.detailed_analysis", weight: 1.8 },
        { name: "data.summary.one_liner", weight: 2.0 },
        { name: "data.context.intent_guess", weight: 1.5 },
        { name: "data.context.topic_or_game_or_media", weight: 1.5 },
        { name: "data.context.work_context.work_type", weight: 1.3 },
        { name: "data.context.work_context.project_or_doc", weight: 1.3 },
        { name: "data.context.code_context.language", weight: 1.2 },
        { name: "data.context.code_context.repo_or_project", weight: 1.2 },
        { name: "data.context.learning_context.learning_topic", weight: 1.2 },
        { name: "data.context.learning_context.source_type", weight: 1.0 },
        {
          name: "data.context.communication_context.communication_type",
          weight: 1.2,
        },
        {
          name: "data.context.communication_context.platform_guess",
          weight: 1.0,
        },
        {
          name: "data.context.entertainment_context.entertainment_type",
          weight: 1.0,
        },
        {
          name: "data.context.entertainment_context.platform_guess",
          weight: 1.0,
        },
        { name: "data.evidence.text_snippets", weight: 1.5 },
        { name: "data.evidence.key_windows_or_panels", weight: 1.3 },
        { name: "data.evidence.web_domains_visible", weight: 1.0 },
        { name: "data.evidence.apps_visible", weight: 1.0 },
        { name: "data.evidence.active_app_guess", weight: 1.2 },
        { name: "data.actions_observed", weight: 0.8 },
        { name: "data.workspace_type", weight: 0.7 },
        { name: "data.system_metadata.active_app", weight: 1.0 },
        { name: "data.system_metadata.opened_apps", weight: 0.6 },
      ],
      findAllMatches: true,
      useExtendedSearch: true,
    };

    const exactMatches: Screenshot[] = [];
    const strongMatches: Screenshot[] = [];
    const otherScreenshots: Screenshot[] = [];

    for (const s of result) {
      const categoryLower = s.data.category?.toLowerCase() ?? "";
      const tagsLower = (s.data.summary_tags || []).map((t) => t.toLowerCase());
      const shortDescLower = s.data.short_description?.toLowerCase() || "";
      const intentLower = s.data.context.intent_guess?.toLowerCase() || "";
      const topicLower =
        s.data.context.topic_or_game_or_media?.toLowerCase() || "";

      if (
        categoryLower === normalizedQuery ||
        tagsLower.includes(normalizedQuery)
      ) {
        exactMatches.push(s);
      } else if (
        shortDescLower.includes(normalizedQuery) ||
        intentLower.includes(normalizedQuery) ||
        topicLower.includes(normalizedQuery)
      ) {
        strongMatches.push(s);
      } else {
        otherScreenshots.push(s);
      }
    }

    const fuse = new Fuse(otherScreenshots, fuseOptions);
    const fuseQuery = words.length > 1 ? words.join(" | ") : query;
    const fuseResults = fuse.search(fuseQuery);
    result = [
      ...exactMatches,
      ...strongMatches,
      ...fuseResults.map((r) => r.item),
    ];
  }
  if (filters.tag) {
    const query = filters.tag.toLowerCase();
    result = result.filter((s) =>
      (s.data.summary_tags || []).some((t) => t.toLowerCase() === query),
    );
  }
  if (filters.maxFocusScore !== undefined) {
    result = result.filter(
      (s) => s.data.scores.focus_score <= filters.maxFocusScore!,
    );
  }
  if (filters.maxProductivityScore !== undefined) {
    result = result.filter(
      (s) => s.data.scores.productivity_score <= filters.maxProductivityScore!,
    );
  }
  if (filters.maxDistractionScore !== undefined) {
    result = result.filter(
      (s) => s.data.scores.distraction_risk <= filters.maxDistractionScore!,
    );
  }
  if (filters.timeOfDay) {
    result = result.filter((s) => {
      const hour = s.timestamp.getHours();
      switch (filters.timeOfDay) {
        case "morning":
          return hour >= 5 && hour < 12;
        case "afternoon":
          return hour >= 12 && hour < 17;
        case "evening":
          return hour >= 17 && hour < 21;
        case "night":
          return hour >= 21 || hour < 5;
        default:
          return true;
      }
    });
  }
  if (filters.hasCode) {
    result = result.filter(
      (s) =>
        s.data.context.code_context?.language &&
        s.data.context.code_context.language !== "",
    );
  }
  if (filters.isMeeting) {
    result = result.filter(
      (s) => s.data.context.communication_context?.meeting_indicator === true,
    );
  }
  if (filters.lowBattery) {
    result = result.filter(
      (s) =>
        s.data.system_metadata?.stats.battery.percentage !== undefined &&
        s.data.system_metadata.stats.battery.percentage < 20,
    );
  }
  if (filters.highCpu) {
    result = result.filter(
      (s) =>
        s.data.system_metadata?.stats.cpu.used !== undefined &&
        s.data.system_metadata.stats.cpu.used > 80,
    );
  }
  if (filters.hasErrors) {
    result = result.filter(
      (s) => s.data.context.code_context?.errors_or_logs_visible === true,
    );
  }
  if (filters.network) {
    result = result.filter((s) => {
      const net = s.data.system_metadata?.stats.network;
      if (!net) return false;
      const name = net.ssid || (net.connected ? "Unknown Network" : null);
      return name === filters.network;
    });
  }
  if (filters.hasAudio) {
    result = result.filter((s) => {
      const playback = s.data.system_metadata?.audio?.playback;
      return (
        playback?.has_active_audio === true &&
        playback?.now_playing &&
        playback.now_playing.length > 0 &&
        playback.now_playing.some((t) => t.title && t.title.trim() !== "")
      );
    });
  }
  if (filters.audioApp) {
    result = result.filter((s) => {
      const playback = s.data.system_metadata?.audio?.playback;
      return playback?.now_playing?.some((t) => t.app === filters.audioApp);
    });
  }
  if (filters.artist) {
    result = result.filter((s) => {
      const playback = s.data.system_metadata?.audio?.playback;
      return playback?.now_playing?.some((t) =>
        t.artist?.toLowerCase().includes(filters.artist!.toLowerCase()),
      );
    });
  }
  if (filters.genre) {
    result = result.filter((s) => {
      const playback = s.data.system_metadata?.audio?.playback;
      return playback?.now_playing?.some(
        (t) => t.genre?.toLowerCase() === filters.genre!.toLowerCase(),
      );
    });
  }
  if (filters.songTitle) {
    result = result.filter((s) => {
      const playback = s.data.system_metadata?.audio?.playback;
      return playback?.now_playing?.some((t) =>
        t.title?.toLowerCase().includes(filters.songTitle!.toLowerCase()),
      );
    });
  }
  if (filters.album) {
    result = result.filter((s) => {
      const playback = s.data.system_metadata?.audio?.playback;
      return playback?.now_playing?.some((t) =>
        t.album?.toLowerCase().includes(filters.album!.toLowerCase()),
      );
    });
  }

  return result;
}

export interface LocationPoint {
  lat: number;
  lng: number;
  count: number;
  locationKey: string;
}

/**
 * Returns one point per unique location (by name or rounded lat,lng) with
 * representative coordinates and count, for map plotting.
 */
export function getLocationPoints(screenshots: Screenshot[]): LocationPoint[] {
  const byKey = new Map<string, { lat: number; lng: number; count: number }>();
  for (const s of screenshots) {
    const loc = s.data.location;
    if (!loc) continue;
    const key =
      loc.name?.trim() ||
      `${Math.round(loc.latitude * 100) / 100},${Math.round(loc.longitude * 100) / 100}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, {
        lat: loc.latitude,
        lng: loc.longitude,
        count: 1,
      });
    }
  }
  return Array.from(byKey.entries()).map(
    ([locationKey, { lat, lng, count }]) => ({
      lat,
      lng,
      count,
      locationKey,
    }),
  );
}

export function getAllScreenshots(filters?: FilterOptions): Screenshot[] {
  const dates = getAllDates();
  let base: Screenshot[] = [];

  if (filters?.dateFolder) {
    base = getScreenshotsForDate(filters.dateFolder);
  } else {
    for (const date of dates) {
      base = base.concat(getScreenshotsForDate(date));
    }
  }

  return filters ? applyFilters(base, filters) : base;
}

export type GalleryCursor = { date: string; id: string };

const ITEMS_PER_PAGE = 48;

/**
 * Return one page of screenshots and cursor for the next page. Uses cached
 * getAllScreenshots so repeated calls within cache TTL are fast.
 */
export function getScreenshotsPage(
  filters: FilterOptions,
  limit: number = ITEMS_PER_PAGE,
  cursor: GalleryCursor | null = null,
): {
  screenshots: Screenshot[];
  nextCursor: GalleryCursor | null;
  hasMore: boolean;
} {
  const all = getAllScreenshots(filters);
  let startIndex = 0;
  if (cursor) {
    const idx = all.findIndex(
      (s) => s.date === cursor.date && s.id === cursor.id,
    );
    startIndex = idx < 0 ? 0 : idx + 1;
  }
  const page = all.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + page.length < all.length;
  const nextCursor: GalleryCursor | null =
    page.length === limit && hasMore && page.length > 0
      ? { date: page[page.length - 1].date, id: page[page.length - 1].id }
      : null;
  return { screenshots: page, nextCursor, hasMore };
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
      locations: {},
      avgConfidence: 0,
      totalSize: 0,
    };
  }

  const categories: Record<
    string,
    { count: number; totalProductivity: number }
  > = {};
  const apps: Record<string, { count: number; totalFocus: number }> = {};
  const hourlyDistribution: Record<number, number> = {};
  const hourlyContextSwitches: Record<number, number> = {};
  const workTypes: Record<string, number> = {};
  const languages: Record<string, number> = {};
  const repos: Record<string, number> = {};
  const domains: Record<string, number> = {};
  const tags: Record<string, number> = {};
  const workspaceTypes: Record<string, number> = {};
  const locations: Record<string, number> = {};

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

  const sorted = [...screenshots].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  let prevItem: Screenshot | null = null;

  for (const item of sorted) {
    totalFocus += item.data.scores.focus_score;
    totalProductivity += item.data.scores.productivity_score;
    totalDistraction += item.data.scores.distraction_risk;
    totalConfidence += item.data.confidence;

    if (item.data.system_metadata?.stats) {
      const s = item.data.system_metadata.stats;

      if (s.cpu?.used !== undefined) {
        totalCpu += s.cpu.used;
        cpuSamples++;
      }

      if (
        s.ram?.used !== undefined &&
        s.ram?.total !== undefined &&
        s.ram.total > 0
      ) {
        const percent = (s.ram.used / s.ram.total) * 100;
        totalRam += percent;
        ramSamples++;
      }

      if (s.battery?.percentage !== undefined) {
        totalBattery += s.battery.percentage;
        batterySamples++;
      }

      if (s.network) {
        const name =
          s.network.ssid || (s.network.connected ? "Unknown Network" : null);
        if (name) {
          networks[name] = (networks[name] || 0) + 1;
        }
      }
    }

    if (!categories[item.data.category]) {
      categories[item.data.category] = { count: 0, totalProductivity: 0 };
    }
    categories[item.data.category].count += 1;
    categories[item.data.category].totalProductivity +=
      item.data.scores.productivity_score;

    if (item.data.workspace_type) {
      workspaceTypes[item.data.workspace_type] =
        (workspaceTypes[item.data.workspace_type] || 0) + 1;
    }

    if (item.data.evidence && item.data.evidence.apps_visible) {
      for (const app of item.data.evidence.apps_visible) {
        if (!apps[app]) {
          apps[app] = { count: 0, totalFocus: 0 };
        }
        apps[app].count += 1;
        apps[app].totalFocus += item.data.scores.focus_score;
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

    if (prevItem) {
      const appChanged =
        (item.data.system_metadata?.active_app ||
          item.data.evidence?.active_app_guess) !==
        (prevItem.data.system_metadata?.active_app ||
          prevItem.data.evidence?.active_app_guess);
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

    const loc = item.data.location;
    if (loc) {
      const key =
        loc.name?.trim() ||
        `${Math.round(loc.latitude * 100) / 100},${Math.round(loc.longitude * 100) / 100}`;
      locations[key] = (locations[key] || 0) + 1;
    }
  }

  return {
    avgFocus: Math.round(totalFocus / screenshots.length),
    avgProductivity: Math.round(totalProductivity / screenshots.length),
    avgDistraction: Math.round(totalDistraction / screenshots.length),
    avgCpu: cpuSamples > 0 ? Math.round(totalCpu / cpuSamples) : 0,
    avgRam: ramSamples > 0 ? Math.round(totalRam / ramSamples) : 0,
    avgBattery:
      batterySamples > 0 ? Math.round(totalBattery / batterySamples) : 0,
    totalScreenshots: screenshots.length,
    categories: Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [
        k,
        {
          count: v.count,
          avgProductivity: Math.round(v.totalProductivity / v.count),
        },
      ]),
    ),
    apps: Object.fromEntries(
      Object.entries(apps).map(([k, v]) => [
        k,
        {
          count: v.count,
          avgFocus: Math.round(v.totalFocus / v.count),
        },
      ]),
    ),
    hourlyDistribution,
    hourlyContextSwitches,
    workTypes,
    languages,
    repos,
    domains,
    tags,
    workspaceTypes,
    locations,
    networks,
    avgConfidence: Math.round((totalConfidence / screenshots.length) * 100),
    totalSize: 0,
  };
}

export function getTotalScribeSize(): number {
  const folder = getScribeFolder();
  if (!folder) return 0;
  try {
    const output = execSync(`du -sk "${folder}"`, { encoding: "utf-8" });
    const match = output.match(/^(\d+)/);
    if (match) {
      return parseInt(match[1], 10) * 1024;
    }
  } catch (e) {
    console.error("Failed to calculate folder size:", e);
  }
  return 0;
}

function getDirectorySizes(baseFolder: string): Map<string, number> {
  const sizes = new Map<string, number>();
  try {
    const output = execSync(
      `make -C .. get-daily-sizes FOLDER="${baseFolder}"`,
      { encoding: "utf-8" },
    );
    const lines = output.split("\n");

    for (const line of lines) {
      const match = line.trim().match(/^(\d+)\s+(.+)$/);
      if (match) {
        const sizeKB = parseInt(match[1], 10);
        const fullPath = match[2];
        const folderName = path.basename(fullPath);

        if (folderName && folderName !== "." && folderName !== "..") {
          sizes.set(folderName, sizeKB * 1024);
        }
      }
    }
  } catch (e) {
    console.error("Failed to calculate directory sizes:", e);
  }
  return sizes;
}

export function getDailyStats(screenshots: Screenshot[]): DailyStats[] {
  const folder = getScribeFolder();
  const folderSizes = folder
    ? getDirectorySizes(folder)
    : new Map<string, number>();
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

      categories[item.data.category] =
        (categories[item.data.category] || 0) + 1;

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
      size: folderSizes.get(date) || 0,
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

      categories[item.data.category] =
        (categories[item.data.category] || 0) + 1;

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

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

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

      categories[item.data.category] =
        (categories[item.data.category] || 0) + 1;

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

export function getImagePath(
  dateFolder: string,
  fileName: string,
): string | null {
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

export function getSmartInsights(
  screenshots: Screenshot[],
  stats: ReturnType<typeof getExtendedStats>,
): Insight[] {
  const insights: Insight[] = [];

  const sorted = [...screenshots].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
  const latest = sorted[0];

  const recentWithAnalysis =
    sorted
      .slice(0, 3)
      .find(
        (s) =>
          s.data.detailed_analysis &&
          s.data.detailed_analysis.length > 20 &&
          !s.data.detailed_analysis.toLowerCase().includes("black screen") &&
          !s.data.detailed_analysis
            .toLowerCase()
            .includes("no visible content"),
      ) || latest;

  if (recentWithAnalysis && recentWithAnalysis.data.detailed_analysis) {
    insights.push({
      type: "info",
      icon: "activity",
      title: "Current Activity",
      description:
        recentWithAnalysis.data.short_description ||
        recentWithAnalysis.data.detailed_analysis.split(".")[0] + ".",
    });
  }

  const recentContext = sorted
    .slice(0, 5)
    .find((s) => s.data.context?.code_context?.repo_or_project);
  const currentProject =
    recentContext?.data.context?.code_context?.repo_or_project;
  const currentLang = recentContext?.data.context?.code_context?.language;

  if (currentProject) {
    insights.push({
      type: "neutral",
      icon: "code",
      title: "Project Focus",
      description: `Currently working on ${currentProject}${currentLang ? ` in ${currentLang}` : ""}.`,
    });
  }

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
    const period =
      bestHour < 12 ? "morning" : bestHour < 17 ? "afternoon" : "evening";
    insights.push({
      type: "positive",
      icon: "clock",
      title: "Peak Flow",
      description: `You're most productive around ${bestHour}:00 in the ${period}.`,
    });
  }

  let totalSwitches = 0;
  Object.values(stats.hourlyContextSwitches).forEach(
    (c) => (totalSwitches += c),
  );
  const avgSwitchesPerHour =
    totalSwitches / (Object.keys(stats.hourlyDistribution).length || 1);

  if (avgSwitchesPerHour > 10) {
    insights.push({
      type: "neutral",
      icon: "shuffle",
      title: "Dynamic Workflow",
      description: "High rate of context switching detected.",
    });
  } else if (stats.avgFocus > 75) {
    insights.push({
      type: "positive",
      icon: "zap",
      title: "Deep Work Session",
      description: "Extended periods of high focus detected.",
    });
  } else {
    insights.push({
      type: "neutral",
      icon: "check",
      title: "Steady Flow",
      description: "Balanced rhythm between focus and collaboration.",
    });
  }

  const topAppEntry = Object.entries(stats.apps).sort((a, b) => {
    const countA = typeof a[1] === "number" ? a[1] : a[1].count;
    const countB = typeof b[1] === "number" ? b[1] : b[1].count;
    return countB - countA;
  })[0];

  if (topAppEntry) {
    const count =
      typeof topAppEntry[1] === "number"
        ? topAppEntry[1]
        : topAppEntry[1].count;
    const percentage = Math.round((count / stats.totalScreenshots) * 100);
    if (percentage > 30) {
      insights.push({
        type: "neutral",
        icon: "laptop",
        title: "Primary Tool",
        description: `${topAppEntry[0]} was your most used app (${percentage}% of session).`,
      });
    }
  }

  const recentLearning = sorted
    .slice(0, 20)
    .find((s) => s.data.context?.learning_context?.learning_topic);
  if (recentLearning?.data.context?.learning_context?.learning_topic) {
    insights.push({
      type: "positive",
      icon: "book",
      title: "Knowledge Gathering",
      description: `Workflow included research or learning about "${recentLearning.data.context.learning_context.learning_topic}".`,
    });
  }

  const musicApp = sorted
    .slice(0, 10)
    .find((s) =>
      s.data.evidence?.apps_visible?.some(
        (a) =>
          a.toLowerCase().includes("spotify") ||
          a.toLowerCase().includes("music"),
      ),
    );
  if (musicApp) {
    insights.push({
      type: "neutral",
      icon: "music",
      title: "Audio Environment",
      description: "Session accompanied by audio/music playback.",
    });
  }

  const meetingCount = sorted.filter(
    (s) => s.data.context?.communication_context?.meeting_indicator,
  ).length;
  if (meetingCount > 5) {
    insights.push({
      type: "info",
      icon: "users",
      title: "Collaboration Heavy",
      description:
        "Significant portion of the workflow involved meetings or calls.",
    });
  }

  if (stats.avgDistraction > 30) {
    const distractionApps: Record<string, number> = {};
    sorted.forEach((s) => {
      if (s.data.scores.distraction_risk > 50) {
        const app = s.data.system_metadata?.active_app || "Unknown";
        distractionApps[app] = (distractionApps[app] || 0) + 1;
      }
    });
    const topDistractor = Object.entries(distractionApps).sort(
      (a, b) => b[1] - a[1],
    )[0];
    if (topDistractor) {
      insights.push({
        type: "neutral",
        icon: "alert",
        title: "Attention Shift",
        description: `${topDistractor[0]} frequently captured attention during this session.`,
      });
    }
  } else {
    insights.push({
      type: "positive",
      icon: "shield",
      title: "Focus Clarity",
      description: "Low distraction levels detected throughout the session.",
    });
  }

  if (stats.avgProductivity > 0) {
    insights.push({
      type: stats.avgProductivity > 70 ? "positive" : "neutral",
      icon: "chart",
      title: "Productivity Pulse",
      description: `Average productivity score is ${stats.avgProductivity}/100.`,
    });
  }

  const topCategory = Object.entries(stats.categories).sort((a, b) => {
    const countA = typeof a[1] === "number" ? a[1] : a[1].count;
    const countB = typeof b[1] === "number" ? b[1] : b[1].count;
    return countB - countA;
  })[0];

  if (topCategory) {
    insights.push({
      type: "neutral",
      icon: "layers",
      title: "Main Context",
      description: `Most activity categorized as "${topCategory[0]}".`,
    });
  }

  return insights.slice(0, 8);
}

export function getAppStats(screenshots: Screenshot[]) {
  const appStats: Record<
    string,
    { focus: number; productivity: number; distraction: number; count: number }
  > = {};

  for (const s of screenshots) {
    const app =
      s.data.system_metadata?.active_app ||
      s.data.evidence?.active_app_guess ||
      "Unknown";

    if (!appStats[app]) {
      appStats[app] = { focus: 0, productivity: 0, distraction: 0, count: 0 };
    }

    appStats[app].focus += s.data.scores.focus_score;
    appStats[app].productivity += s.data.scores.productivity_score;
    appStats[app].distraction += s.data.scores.distraction_risk;
    appStats[app].count += 1;
  }

  return Object.entries(appStats)
    .map(([name, stats]) => ({
      name,
      avgFocus: Math.round(stats.focus / stats.count),
      avgProductivity: Math.round(stats.productivity / stats.count),
      avgDistraction: Math.round(stats.distraction / stats.count),
      count: stats.count,
      efficiency: Math.round(
        stats.productivity / stats.count - stats.distraction / stats.count,
      ),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getSystemContextStats(screenshots: Screenshot[]) {
  const learningTopics: Record<string, number> = {};
  const communicationPlatforms: Record<string, number> = {};
  const entertainmentTypes: Record<string, number> = {};
  const audioInputDevices: Record<string, number> = {};
  const audioOutputDevices: Record<string, number> = {};

  const connectionTypes: Record<string, number> = {};

  let darkModeCount = 0;
  let lightModeCount = 0;
  const monitorUsage: Record<string, number> = {};
  const externalDisplayStats = {
    withExternal: { totalFocus: 0, count: 0 },
    withoutExternal: { totalFocus: 0, count: 0 },
  };

  const idleDistribution: Record<string, number> = {
    "0-5s": 0,
    "5-30s": 0,
    "30s-5m": 0,
    "5m+": 0,
  };

  const hourlyStats: Record<
    number,
    {
      cpu: number;
      ram: number;
      volume: number;
      count: number;
      battery: number;
      signalStrength: number;
      signalCount: number;
      storage: number;
      storageTotal: number;
      storageCount: number;
      idleSeconds: number;
      idleCount: number;
      darkModeCount: number;
      lightModeCount: number;
    }
  > = {};

  let totalRAM = 32;
  if (
    screenshots.length > 0 &&
    screenshots[0].data.system_metadata?.stats.ram.total
  ) {
    totalRAM =
      screenshots[0].data.system_metadata.stats.ram.total /
      (1024 * 1024 * 1024);
  }

  for (const s of screenshots) {
    if (s.data.context.learning_context?.learning_topic) {
      const topic = s.data.context.learning_context.learning_topic;
      learningTopics[topic] = (learningTopics[topic] || 0) + 1;
    }
    if (s.data.context.communication_context?.platform_guess) {
      const platform = s.data.context.communication_context.platform_guess;
      communicationPlatforms[platform] =
        (communicationPlatforms[platform] || 0) + 1;
    }
    if (s.data.context.entertainment_context?.entertainment_type) {
      const type = s.data.context.entertainment_context.entertainment_type;
      entertainmentTypes[type] = (entertainmentTypes[type] || 0) + 1;
    }

    if (s.data.system_metadata?.audio) {
      s.data.system_metadata.audio.inputs.forEach((d) => {
        if (d.is_default)
          audioInputDevices[d.name] = (audioInputDevices[d.name] || 0) + 1;
      });
      s.data.system_metadata.audio.outputs.forEach((d) => {
        if (d.is_default)
          audioOutputDevices[d.name] = (audioOutputDevices[d.name] || 0) + 1;
      });
    }

    if (s.data.system_metadata?.stats.network) {
      const net = s.data.system_metadata.stats.network;
      if (net.connected) {
        const connType = net.type || "wifi";
        connectionTypes[connType] = (connectionTypes[connType] || 0) + 1;
      } else {
        connectionTypes["disconnected"] =
          (connectionTypes["disconnected"] || 0) + 1;
      }
    }

    if (s.data.system_metadata?.stats.display) {
      const display = s.data.system_metadata.stats.display;

      if (display.dark_mode) {
        darkModeCount++;
      } else {
        lightModeCount++;
      }

      const externalCount = display.external_displays?.length || 0;
      if (externalCount === 0) {
        monitorUsage["Single"] = (monitorUsage["Single"] || 0) + 1;
      } else if (externalCount === 1) {
        monitorUsage["Dual"] = (monitorUsage["Dual"] || 0) + 1;
      } else {
        monitorUsage["Multiple"] = (monitorUsage["Multiple"] || 0) + 1;
      }

      const focusScore = s.data.scores.focus_score;
      if (externalCount > 0) {
        externalDisplayStats.withExternal.totalFocus += focusScore;
        externalDisplayStats.withExternal.count++;
      } else {
        externalDisplayStats.withoutExternal.totalFocus += focusScore;
        externalDisplayStats.withoutExternal.count++;
      }
    }

    if (s.data.system_metadata?.stats.input?.idle_seconds !== undefined) {
      const idle = s.data.system_metadata.stats.input.idle_seconds;
      if (idle < 5) idleDistribution["0-5s"]++;
      else if (idle < 30) idleDistribution["5-30s"]++;
      else if (idle < 300) idleDistribution["30s-5m"]++;
      else idleDistribution["5m+"]++;
    }

    if (s.data.system_metadata) {
      const hour = s.timestamp.getHours();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          cpu: 0,
          ram: 0,
          volume: 0,
          count: 0,
          battery: 0,
          signalStrength: 0,
          signalCount: 0,
          storage: 0,
          storageTotal: 0,
          storageCount: 0,
          idleSeconds: 0,
          idleCount: 0,
          darkModeCount: 0,
          lightModeCount: 0,
        };
      }

      const stats = hourlyStats[hour];
      stats.cpu += s.data.system_metadata.stats.cpu.used;
      stats.ram += s.data.system_metadata.stats.ram.used / 1024 / 1024 / 1024;
      stats.volume += s.data.system_metadata.audio.volume;
      stats.battery += s.data.system_metadata.stats.battery.percentage;
      stats.count++;

      if (s.data.system_metadata.stats.network?.signal_strength) {
        stats.signalStrength +=
          s.data.system_metadata.stats.network.signal_strength;
        stats.signalCount++;
      }

      if (s.data.system_metadata.stats.storage) {
        stats.storage +=
          s.data.system_metadata.stats.storage.used / (1024 * 1024 * 1024);
        stats.storageTotal +=
          s.data.system_metadata.stats.storage.total / (1024 * 1024 * 1024);
        stats.storageCount++;
      }

      if (s.data.system_metadata.stats.input?.idle_seconds !== undefined) {
        stats.idleSeconds += s.data.system_metadata.stats.input.idle_seconds;
        stats.idleCount++;
      }

      if (s.data.system_metadata.stats.display?.dark_mode) {
        stats.darkModeCount++;
      } else {
        stats.lightModeCount++;
      }
    }
  }

  const hourlyTrends = Object.entries(hourlyStats)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      cpu: Math.round(stats.cpu / stats.count),
      ram: Number((stats.ram / stats.count).toFixed(1)),
      volume: Math.round(stats.volume / stats.count),
      battery: Math.round(stats.battery / stats.count),
      count: stats.count,
    }))
    .sort((a, b) => a.hour - b.hour);

  const signalData = Object.entries(hourlyStats)
    .filter(([_, stats]) => stats.signalCount > 0)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      signalStrength: Math.round(stats.signalStrength / stats.signalCount),
      count: stats.signalCount,
    }))
    .sort((a, b) => a.hour - b.hour);

  const storageTrend = Object.entries(hourlyStats)
    .filter(([_, stats]) => stats.storageCount > 0)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      used: Number((stats.storage / stats.storageCount).toFixed(1)),
      total: Number((stats.storageTotal / stats.storageCount).toFixed(1)),
      free: Number(
        ((stats.storageTotal - stats.storage) / stats.storageCount).toFixed(1),
      ),
      count: stats.storageCount,
    }))
    .sort((a, b) => a.hour - b.hour);

  const darkModeByHour = Object.entries(hourlyStats)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      darkModeCount: stats.darkModeCount,
      lightModeCount: stats.lightModeCount,
    }))
    .sort((a, b) => a.hour - b.hour);

  const idleTimeHourly = Object.entries(hourlyStats)
    .filter(([_, stats]) => stats.idleCount > 0)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      avgIdleSeconds: Number((stats.idleSeconds / stats.idleCount).toFixed(1)),
      activeMinutes: Number((stats.count * 0.5).toFixed(1)),
      passiveMinutes: Number(
        (stats.idleSeconds / stats.idleCount / 60).toFixed(1),
      ),
    }))
    .sort((a, b) => a.hour - b.hour);

  const connectionTypesData = Object.entries(connectionTypes).map(
    ([type, count]) => ({
      type,
      count,
    }),
  );

  const monitorUsageData = Object.entries(monitorUsage).map(
    ([type, count]) => ({
      type,
      count,
    }),
  );

  const idleDistributionData = Object.entries(idleDistribution).map(
    ([range, count]) => ({
      range,
      count,
      isBreak: range === "5m+",
    }),
  );

  const externalDisplayCorrelation = {
    withExternal: {
      avgFocus:
        externalDisplayStats.withExternal.count > 0
          ? externalDisplayStats.withExternal.totalFocus /
            externalDisplayStats.withExternal.count
          : 0,
      count: externalDisplayStats.withExternal.count,
    },
    withoutExternal: {
      avgFocus:
        externalDisplayStats.withoutExternal.count > 0
          ? externalDisplayStats.withoutExternal.totalFocus /
            externalDisplayStats.withoutExternal.count
          : 0,
      count: externalDisplayStats.withoutExternal.count,
    },
  };

  return {
    learningTopics,
    communicationPlatforms,
    entertainmentTypes,
    audioInputDevices,
    audioOutputDevices,
    hourlyTrends,

    signalData,
    connectionTypes: connectionTypesData,
    storageTrend,
    totalRAM: Math.round(totalRAM),
    totalStorage: storageTrend.length > 0 ? storageTrend[0].total : 500,
    darkModeByHour,
    monitorUsage: monitorUsageData,
    externalDisplayCorrelation,
    idleDistribution: idleDistributionData,
    idleTimeHourly,
  };
}

export function getAudioPlaybackStats(screenshots: Screenshot[]) {
  const hourlyPlaybackStats: Record<
    number,
    {
      activeCount: number;
      systemActiveCount: number;
      uniqueApps: Set<string>;
    }
  > = {};

  const appPlaybackCount: Record<string, number> = {};
  const nowPlayingHistory: Array<{
    timestamp: string;
    app: string;
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    currentTime?: number;
    genre?: string;
    year?: number;
    trackNumber?: number;
    albumArtist?: string;
    composer?: string;
    rating?: number;
    playCount?: number;
    artworkURL?: string;
  }> = [];

  let totalPlaybackSessions = 0;
  const allApps = new Set<string>();

  for (const s of screenshots) {
    const playback = s.data.system_metadata?.audio?.playback;
    if (!playback) continue;

    const hour = s.timestamp.getHours();

    if (!hourlyPlaybackStats[hour]) {
      hourlyPlaybackStats[hour] = {
        activeCount: 0,
        systemActiveCount: 0,
        uniqueApps: new Set(),
      };
    }

    if (playback.has_active_audio) {
      hourlyPlaybackStats[hour].activeCount++;
      totalPlaybackSessions++;
    }

    if (playback.system_audio_active) {
      hourlyPlaybackStats[hour].systemActiveCount++;
    }

    if (playback.playing_apps) {
      const communicationApps = [
        "Chrome",
        "Safari",
        "Firefox",
        "Arc",
        "Slack",
        "Discord",
        "Zoom",
        "Teams",
        "FaceTime",
        "Skype",
      ];
      for (const app of playback.playing_apps) {
        const isCommunicationApp = communicationApps.some((commApp) =>
          app.includes(commApp),
        );
        if (!isCommunicationApp) {
          hourlyPlaybackStats[hour].uniqueApps.add(app);
          appPlaybackCount[app] = (appPlaybackCount[app] || 0) + 1;
          allApps.add(app);
        }
      }
    }

    if (playback.now_playing && playback.now_playing.length > 0) {
      for (const track of playback.now_playing) {
        const communicationApps = [
          "Chrome",
          "Safari",
          "Firefox",
          "Arc",
          "Slack",
          "Discord",
          "Zoom",
          "Teams",
          "FaceTime",
          "Skype",
        ];
        const isCommunicationApp = communicationApps.some((app) =>
          track.app.includes(app),
        );

        if (track.title && track.title.trim() !== "" && !isCommunicationApp) {
          nowPlayingHistory.push({
            timestamp: s.data.timestamp?.iso || s.timestamp.toISOString(),
            app: track.app,
            title: track.title,
            artist: track.artist,
            album: track.album,
            duration: track.duration,
            currentTime: track.current_time,
            genre: track.genre,
            year: track.year,
            trackNumber: track.track_number,
            albumArtist: track.album_artist,
            composer: track.composer,
            rating: track.rating,
            playCount: track.play_count,
            artworkURL: track.artwork_url,
          });
        }
      }
    }
  }

  const hourlyPlayback = Object.entries(hourlyPlaybackStats)
    .map(([hour, stats]) => ({
      hour: parseInt(hour),
      activeCount: stats.activeCount,
      systemActiveCount: stats.systemActiveCount,
      uniqueApps: Array.from(stats.uniqueApps),
    }))
    .sort((a, b) => a.hour - b.hour);

  const topPlayingApps = Object.entries(appPlaybackCount)
    .map(([app, count]) => ({
      app,
      count,
      percentage: (count / totalPlaybackSessions) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mostActiveHour =
    hourlyPlayback.length > 0
      ? hourlyPlayback.reduce((max, curr) =>
          curr.activeCount > max.activeCount ? curr : max,
        ).hour
      : 0;

  const avgPlaybackPerHour =
    hourlyPlayback.length > 0
      ? hourlyPlayback.reduce((sum, h) => sum + h.activeCount, 0) /
        hourlyPlayback.length
      : 0;

  const playbackPercentage =
    screenshots.length > 0
      ? (totalPlaybackSessions / screenshots.length) * 100
      : 0;

  const sortedNowPlaying = nowPlayingHistory.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return {
    hourlyPlayback,
    topPlayingApps,
    nowPlayingHistory: sortedNowPlaying,
    stats: {
      totalPlaybackSessions,
      totalUniqueApps: allApps.size,
      avgPlaybackPerHour,
      mostActiveHour,
      playbackPercentage,
    },
  };
}

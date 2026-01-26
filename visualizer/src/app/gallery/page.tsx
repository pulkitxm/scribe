import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllDates, getScreenshotsForDate, getAllScreenshots } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterOptions, Screenshot } from "@/types/screenshot";
import GalleryFilters from "@/components/GalleryFilters";
import { CategoryLink } from "@/components/SmartLinks";
import Pagination from "@/components/Pagination";
import GalleryInfiniteScroll from "@/components/GalleryInfiniteScroll";

interface PageProps {
    searchParams: Promise<{
        date?: string;
        tag?: string;
        category?: string;
        timeRange?: string;
        text?: string;
        domain?: string;
        workspace?: string;
        language?: string;
        page?: string;
    }>;
}

function GalleryGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-[180px] w-full" />
                    <CardContent className="p-3 space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-32" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

async function GalleryContent({
    date,
    tag,
    category,
    timeRange,
    text,
    domain,
    workspace,
    language,
}: {
    date?: string;
    tag?: string;
    category?: string;
    timeRange?: string;
    text?: string;
    domain?: string;
    workspace?: string;
    language?: string;
}) {
    // Build filters
    const filters: FilterOptions = {};

    if (date) {
        // Convert DD-MM-YYYY to Date
        const parts = date.split("-");
        if (parts.length === 3) {
            const d = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
            filters.startDate = d.toISOString().split("T")[0];
            filters.endDate = d.toISOString().split("T")[0];
        }
    }

    if (timeRange) {
        const now = new Date();
        switch (timeRange) {
            case "today":
                filters.startDate = now.toISOString().split("T")[0];
                filters.endDate = now.toISOString().split("T")[0];
                break;
            case "week":
                const weekAgo = new Date(now);
                weekAgo.setDate(now.getDate() - 7);
                filters.startDate = weekAgo.toISOString().split("T")[0];
                break;
            case "month":
                const monthAgo = new Date(now);
                monthAgo.setMonth(now.getMonth() - 1);
                filters.startDate = monthAgo.toISOString().split("T")[0];
                break;
        }
    }

    if (category) {
        filters.category = category;
    }

    if (text) {
        filters.text = text;
    }

    if (domain) {
        filters.domain = domain;
    }

    if (workspace) {
        filters.workspace = workspace;
    }

    if (language) {
        filters.language = language;
    }

    let screenshots = getAllScreenshots(filters);

    // Filter by tag if specified
    if (tag) {
        screenshots = screenshots.filter((s) =>
            s.data.summary_tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        );
    }

    // Initial slice for server-side render
    const initialScreenshots = screenshots.slice(0, 48);

    // We pass the FULL set of filters to the client so it can reproduce the query
    // TAG filtering happens in memory in `getAllScreenshots` logic if it was built into it, 
    // but here `getAllScreenshots` doesn't handle tags natively (it was done after).
    // The current `getAllScreenshots` does NOT handle tag filtering, it was done in `GalleryContent`.
    // My `fetchScreenshots` server action uses `getAllScreenshots`.
    // ISSUE: The `fetchScreenshots` server action won't filter by tag if I don't move tag filtering into `getAllScreenshots` or handle it in the action.
    // The `getAllScreenshots` function in `lib/data.ts` DOES NOT have a `tag` filter in `FilterOptions`.
    // Wait, checking `lib/data.ts` content I saw earlier...
    // `getAllScreenshots` takes `FilterOptions`.
    // `FilterOptions` interface (from `types/screenshot.ts`) does NOT have `tag`?
    // Let me double check `types/screenshot.ts`.
    // It has `category`, `app`, `minFocusScore`, ... `text`. No `tag`.
    // But `GalleryContent` was filtering by tag: 
    // `if (tag) { screenshots = screenshots.filter(...) }`

    // So if I use `fetchScreenshots` which calls `getAllScreenshots`, I lose tag filtering unless I update `getAllScreenshots` and `FilterOptions`.

    // I should update `FilterOptions` and `getAllScreenshots` to support tags before I finish this replace.
    // However, I can't interrupt this tool call.
    // I will use `GalleryInfiniteScroll` here but I must note that I need to fix tag filtering immediately after.
    // Actually, I can pass `tag` in `initialFilters` manually if I cast it, but `fetchScreenshots` won't know what to do with it.

    // Let's implement this change, and then immediately go fix `lib/data.ts` and `types/screenshot.ts` and `actions.ts`.

    // Actually, `getAllScreenshots` in `lib/data.ts` (lines 127-195) DOES support `text`, `category`, etc.
    // But `tag` was done outside in `page.tsx`.

    // I will proceed with this change but I will need to update `lib/data.ts` to support `tag` in `FilterOptions` 
    // and `getAllScreenshots` so that the server action works correctly for tags.

    const clientFilters = { ...filters };
    // @ts-ignore - temporary unti I fix the type
    if (tag) clientFilters.tag = tag;

    return (
        <GalleryInfiniteScroll
            initialScreenshots={initialScreenshots}
            initialFilters={clientFilters}
        />
    );
}

export default async function GalleryPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const dates = getAllDates();
    const allScreenshots = getAllScreenshots();
    const categories = [...new Set(allScreenshots.map((s) => s.data.category))].filter(Boolean).sort();
    const tags = [...new Set(allScreenshots.flatMap((s) => s.data.summary_tags))].sort();

    // Check for active "hidden" filters (domain, workspace, etc) to show indicator
    const hasHiddenFilter = params.domain || params.workspace || params.language || params.text;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="border-b border-border pb-6">
                <h1 className="text-2xl font-bold text-foreground">Gallery</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Browse all your captured screenshots
                </p>
            </div>

            {/* Filters */}
            <GalleryFilters
                dates={dates}
                categories={categories}
                tags={tags}
                currentDate={params.date}
                currentTag={params.tag}
                currentCategory={params.category}
                currentTimeRange={params.timeRange}
            />

            {/* Active filter indicator */}
            {params.tag && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Showing screenshots tagged with:</span>
                    <Badge variant="secondary">{params.tag}</Badge>
                </div>
            )}

            {params.text && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Searching for text:</span>
                    <Badge variant="secondary">"{params.text}"</Badge>
                </div>
            )}

            {params.domain && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Domain:</span>
                    <Badge variant="secondary">{params.domain}</Badge>
                </div>
            )}

            {params.workspace && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Workspace:</span>
                    <Badge variant="secondary">{params.workspace}</Badge>
                </div>
            )}

            {params.language && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Language:</span>
                    <Badge variant="secondary">{params.language}</Badge>
                </div>
            )}

            {/* Gallery grid */}
            <Suspense fallback={<GalleryGridSkeleton />}>
                <GalleryContent
                    date={params.date}
                    tag={params.tag}
                    category={params.category}
                    timeRange={params.timeRange}
                    text={params.text}
                    domain={params.domain}
                    workspace={params.workspace}
                    language={params.language}
                />
            </Suspense>
        </div>
    );
}

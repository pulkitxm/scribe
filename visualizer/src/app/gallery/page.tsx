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

interface PageProps {
    searchParams: Promise<{
        date?: string;
        tag?: string;
        category?: string;
        timeRange?: string;
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
}: {
    date?: string;
    tag?: string;
    category?: string;
    timeRange?: string;
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

    let screenshots = getAllScreenshots(filters);

    // Filter by tag if specified
    if (tag) {
        screenshots = screenshots.filter((s) =>
            s.data.summary_tags.some((t) => t.toLowerCase() === tag.toLowerCase())
        );
    }



    if (screenshots.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-4xl mb-4 opacity-50">📷</div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No screenshots found</h3>
                <p className="text-sm text-muted-foreground">
                    Try adjusting your filters or start capturing screenshots
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {screenshots.slice(0, 48).map((screenshot) => (
                <Link
                    key={`${screenshot.date}-${screenshot.id}`}
                    href={`/gallery/${screenshot.date}/${screenshot.id}`}
                    className="group cursor-pointer"
                >
                    <Card className="overflow-hidden transition-colors hover:border-foreground/20">
                        <div className="relative">
                            <Image
                                src={screenshot.imagePath}
                                alt={screenshot.data.short_description || "Screenshot"}
                                width={400}
                                height={180}
                                className="w-full h-[180px] object-cover"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                                <div className="text-sm font-medium text-white">
                                    {formatTime(screenshot.timestamp)}
                                </div>
                                <div className="text-xs text-white/70 flex items-center gap-2 mt-1">
                                    {screenshot.data.category && (
                                        <Badge variant="secondary" className="text-xs py-0">
                                            {screenshot.data.category}
                                        </Badge>
                                    )}
                                    <span>{screenshot.date}</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}

export default async function GalleryPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const dates = getAllDates();
    const allScreenshots = getAllScreenshots();
    const categories = [...new Set(allScreenshots.map((s) => s.data.category))].filter(Boolean).sort();
    const tags = [...new Set(allScreenshots.flatMap((s) => s.data.summary_tags))].sort();

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

            {/* Gallery grid */}
            <Suspense fallback={<GalleryGridSkeleton />}>
                <GalleryContent
                    date={params.date}
                    tag={params.tag}
                    category={params.category}
                    timeRange={params.timeRange}
                />
            </Suspense>
        </div>
    );
}

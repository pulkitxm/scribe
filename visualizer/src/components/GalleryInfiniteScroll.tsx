"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FilterOptions, Screenshot } from "@/types/screenshot";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchScreenshots } from "@/app/gallery/actions";
import { CategoryLink } from "@/components/SmartLinks";

interface GalleryInfiniteScrollProps {
    initialScreenshots: Screenshot[];
    initialFilters: FilterOptions;
}

export default function GalleryInfiniteScroll({
    initialScreenshots,
    initialFilters,
}: GalleryInfiniteScrollProps) {
    const [screenshots, setScreenshots] = useState<Screenshot[]>(initialScreenshots);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setScreenshots(initialScreenshots);
        setPage(1);
        setHasMore(initialScreenshots.length >= 48);
        setLoading(false);
    }, [initialScreenshots]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setPage((prevPage) => prevPage + 1);
            }
        });

        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    useEffect(() => {
        if (page === 1) return;

        const loadMore = async () => {
            setLoading(true);
            try {
                const res = await fetchScreenshots(page, initialFilters);

                const hydratedScreenshots = res.screenshots.map(s => ({
                    ...s,
                    timestamp: new Date(s.timestamp)
                }));

                setScreenshots((prev) => [...prev, ...hydratedScreenshots]);
                setHasMore(res.hasMore);
            } catch (error) {
                console.error("Failed to load more screenshots:", error);
            } finally {
                setLoading(false);
            }
        };

        loadMore();
    }, [page, initialFilters]);

    function formatTime(date: Date | string): string {
        const d = new Date(date);
        return d.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {screenshots.map((screenshot, index) => {
                    const isLast = index === screenshots.length - 1;
                    return (
                        <div
                            key={`${screenshot.date}-${screenshot.id}-${index}`}
                            ref={isLast ? lastElementRef : null}
                        >
                            <Link
                                href={`/gallery/${screenshot.date}/${screenshot.id}`}
                                className="group cursor-pointer block h-full"
                            >
                                <Card className="overflow-hidden transition-colors hover:border-foreground/20 h-full flex flex-col">
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
                                                    <CategoryLink
                                                        category={screenshot.data.category}
                                                        className="text-white hover:text-white hover:bg-white/20 border-white/20 py-0 h-5"
                                                    />
                                                )}
                                                <span>{screenshot.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </div>
                    );
                })}
            </div>

            {loading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden">
                            <Skeleton className="h-[180px] w-full" />
                            <CardContent className="p-3 space-y-2">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-32" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {!hasMore && screenshots.length > 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                    You've reached the end of your gallery.
                </div>
            )}
        </div>
    );
}

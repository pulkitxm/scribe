"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FilterOptions, GalleryCardData } from "@/types/screenshot";
import type { GalleryCursor } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchScreenshots } from "@/app/gallery/actions";

interface GalleryInfiniteScrollProps {
  initialScreenshots: GalleryCardData[];
  initialNextCursor: GalleryCursor | null;
  initialHasMore: boolean;
  initialFilters: FilterOptions;
}

export default function GalleryInfiniteScroll({
  initialScreenshots,
  initialNextCursor,
  initialHasMore,
  initialFilters,
}: GalleryInfiniteScrollProps) {
  const [screenshots, setScreenshots] =
    useState<GalleryCardData[]>(initialScreenshots);
  const [nextCursor, setNextCursor] = useState<GalleryCursor | null>(
    initialNextCursor,
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [loadPage, setLoadPage] = useState(1);

  useEffect(() => {
    setScreenshots(initialScreenshots);
    setNextCursor(initialNextCursor);
    setHasMore(initialHasMore);
    setLoadPage(1);
    setLoading(false);
  }, [initialScreenshots, initialNextCursor, initialHasMore]);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;

      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && nextCursor) {
            setLoadPage((p) => p + 1);
          }
        },
        { rootMargin: "0px 0px 30% 0px" },
      );

      if (node) observer.current.observe(node);
    },
    [loading, hasMore, nextCursor],
  );

  useEffect(() => {
    if (loadPage === 1 || !nextCursor || loading) return;

    const loadMore = async () => {
      setLoading(true);
      try {
        const res = await fetchScreenshots(initialFilters, nextCursor);
        setScreenshots((prev) => [...prev, ...res.screenshots]);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch (error) {
        console.error("Failed to load more screenshots:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when loadPage increments
  }, [loadPage]);

  function formatTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  const renderCard = useCallback(
    (card: GalleryCardData, index: number) => (
      <div key={`${card.date}-${card.id}-${index}`}>
        <Link href={`/gallery/${card.date}/${card.id}`} className="block">
          <Card className="overflow-hidden transition-colors hover:border-foreground/20 flex flex-col group h-full cursor-pointer">
            <div className="relative">
              <Image
                src={card.imagePath}
                alt={card.short_description || "Screenshot"}
                width={400}
                height={180}
                className="w-full h-[180px] object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 pointer-events-none">
                <div className="flex justify-between items-end">
                  <div className="text-xs text-white/90 font-medium bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                    {formatTime(card.timestamp)}
                  </div>
                  {card.category && (
                    <span className="text-xs text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                      {card.category}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <CardContent className="p-3 space-y-2 flex-1 flex flex-col hover:bg-muted/50 transition-colors">
              <p
                className="text-sm font-medium line-clamp-2"
                title={card.short_description}
              >
                {card.short_description || "No description"}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto pt-2">
                {card.workspace_type && (
                  <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                    {card.workspace_type}
                  </span>
                )}
                {card.active_app_guess && (
                  <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">
                    {card.active_app_guess}
                  </span>
                )}
                {card.location_name && (
                  <span
                    className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded truncate max-w-[120px]"
                    title={card.location_title}
                  >
                    📍 {card.location_name}
                  </span>
                )}
              </div>

              {(card.summary_tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {card.summary_tags!.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {card.summary_tags!.length > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{card.summary_tags!.length - 3}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>
    ),
    [],
  );

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4 opacity-50">📷</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No screenshots found
        </h3>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or start capturing screenshots
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {screenshots.map((s, i) => renderCard(s, i))}
      </div>
      <div ref={lastElementRef} className="h-4" aria-hidden />

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

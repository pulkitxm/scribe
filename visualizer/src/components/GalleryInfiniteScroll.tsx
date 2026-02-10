"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { FilterOptions, Screenshot } from "@/types/screenshot";
import type { GalleryCursor } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchScreenshots } from "@/app/gallery/actions";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

interface GalleryInfiniteScrollProps {
  initialScreenshots: Screenshot[];
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
    useState<Screenshot[]>(initialScreenshots);
  const [nextCursor, setNextCursor] = useState<GalleryCursor | null>(
    initialNextCursor,
  );
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [loadPage, setLoadPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

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

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && nextCursor) {
          setLoadPage((p) => p + 1);
        }
      });

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

        const hydratedScreenshots = res.screenshots.map((s) => ({
          ...s,
          timestamp: new Date(s.timestamp),
        }));

        setScreenshots((prev) => [...prev, ...hydratedScreenshots]);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      } catch (error) {
        console.error("Failed to load more screenshots:", error);
      } finally {
        setLoading(false);
      }
    };

    loadMore();
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
    (screenshot: Screenshot, index: number) => (
      <div key={`${screenshot.date}-${screenshot.id}-${index}`}>
        <Card className="overflow-hidden transition-colors hover:border-foreground/20 flex flex-col group h-full">
          <div
            className="relative cursor-zoom-in"
            onClick={(e) => {
              e.preventDefault();
              setLightboxIndex(index);
            }}
          >
            <Image
              src={screenshot.imagePath}
              alt={screenshot.data.short_description || "Screenshot"}
              width={400}
              height={180}
              className="w-full h-[180px] object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm rounded-full p-2">
                <svg
                  className="h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                  />
                </svg>
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8 pointer-events-none">
              <div className="flex justify-between items-end">
                <div className="text-xs text-white/90 font-medium bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                  {formatTime(screenshot.timestamp)}
                </div>
                {screenshot.data.category && (
                  <span className="text-xs text-white bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                    {screenshot.data.category}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Link
            href={`/gallery/${screenshot.date}/${screenshot.id}`}
            className="cursor-pointer"
          >
            <CardContent className="p-3 space-y-2 flex-1 flex flex-col hover:bg-muted/50 transition-colors">
              <p
                className="text-sm font-medium line-clamp-2"
                title={screenshot.data.short_description}
              >
                {screenshot.data.short_description || "No description"}
              </p>

              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-auto pt-2">
                {screenshot.data.workspace_type && (
                  <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded">
                    {screenshot.data.workspace_type}
                  </span>
                )}
                {screenshot.data.evidence?.active_app_guess && (
                  <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded truncate max-w-[100px]">
                    {screenshot.data.evidence.active_app_guess}
                  </span>
                )}
                {screenshot.data.location && (
                  <span
                    className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded truncate max-w-[120px]"
                    title={
                      screenshot.data.location.name ||
                      `${screenshot.data.location.latitude}, ${screenshot.data.location.longitude}`
                    }
                  >
                    📍 {screenshot.data.location.name || "Location"}
                  </span>
                )}
              </div>

              {(screenshot.data.summary_tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {screenshot.data.summary_tags?.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {(screenshot.data.summary_tags?.length || 0) > 3 && (
                    <span className="text-[10px] text-muted-foreground px-1">
                      +{screenshot.data.summary_tags!.length - 3}
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Link>
        </Card>
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

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={screenshots.map((s) => ({
          src: s.imagePath,
          alt: s.data.short_description || "Screenshot",
          title: s.data.short_description,
          description: `${formatTime(s.timestamp)} - ${s.data.category || "Uncategorized"} - Focus: ${s.data.scores.focus_score}`,
        }))}
      />

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

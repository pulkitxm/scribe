"use server";

import { getScreenshotsPage, screenshotToGalleryCardData } from "@/lib/data";
import type { GalleryCursor } from "@/lib/data";
import { FilterOptions, GalleryCardData } from "@/types/screenshot";

const ITEMS_PER_PAGE = 48;

export async function fetchScreenshots(
  filters: FilterOptions,
  cursor: GalleryCursor | null,
): Promise<{
  screenshots: GalleryCardData[];
  nextCursor: GalleryCursor | null;
  hasMore: boolean;
}> {
  const { screenshots, nextCursor, hasMore } = getScreenshotsPage(
    filters,
    ITEMS_PER_PAGE,
    cursor,
  );
  return {
    screenshots: screenshots.map(screenshotToGalleryCardData),
    nextCursor,
    hasMore,
  };
}

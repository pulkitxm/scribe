"use server";

import { getScreenshotsPage } from "@/lib/data";
import type { GalleryCursor } from "@/lib/data";
import { FilterOptions, Screenshot } from "@/types/screenshot";

const ITEMS_PER_PAGE = 48;

export async function fetchScreenshots(
  filters: FilterOptions,
  cursor: GalleryCursor | null,
) {
  const { screenshots, nextCursor, hasMore } = getScreenshotsPage(
    filters,
    ITEMS_PER_PAGE,
    cursor,
  );
  return {
    screenshots,
    nextCursor,
    hasMore,
  };
}

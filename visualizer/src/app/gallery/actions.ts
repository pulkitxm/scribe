"use server";

import { getAllScreenshots } from "@/lib/data";
import { FilterOptions, Screenshot } from "@/types/screenshot";

const ITEMS_PER_PAGE = 48;

export async function fetchScreenshots(page: number, filters: FilterOptions) {
    const allScreenshots = getAllScreenshots(filters);

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    const screenshots = allScreenshots.slice(start, end);
    const hasMore = end < allScreenshots.length;

    return {
        screenshots,
        hasMore
    };
}

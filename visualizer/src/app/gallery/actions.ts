"use server";

import { getAllScreenshots } from "@/lib/data";
import { FilterOptions, Screenshot } from "@/types/screenshot";

const ITEMS_PER_PAGE = 48;

export async function fetchScreenshots(page: number, filters: FilterOptions) {
    // Artificial delay to see the loading state if needed (remove in prod if desired, but helpful for UX)
    // await new Promise((resolve) => setTimeout(resolve, 500));

    const allScreenshots = getAllScreenshots(filters);

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;

    const screenshots = allScreenshots.slice(start, end);
    const hasMore = end < allScreenshots.length;

    // We need to maximize compatibility with the client component serialization
    // Dates need to be strings or handled carefully if passed directly, 
    // but Next.js server actions handle this well usually. 
    // However, explicit serialization is safer if `Screenshot` has complex types.
    // Based on `types/screenshot.ts`, `timestamp` is a Date.
    // Client components might need this to be a string or we rely on Next.js to serialize it.
    // Let's return it as is for now and see if we hit serialization issues.

    return {
        screenshots,
        hasMore
    };
}

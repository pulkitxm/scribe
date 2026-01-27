import { Suspense } from "react";
import { getAllScreenshots } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TagsList from "@/components/TagsList";

export const dynamic = 'force-dynamic';

function TagsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="border-b border-border pb-6">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <Skeleton className="h-10 w-full max-w-sm" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 space-y-3">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-2 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function TagsPage() {
    const screenshots = getAllScreenshots();
    const tagCounts: Record<string, number> = {};

    for (const s of screenshots) {
        for (const tag of (s.data.summary_tags || [])) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
    }

    const tags = Object.keys(tagCounts).sort((a, b) => {
        const countDiff = tagCounts[b] - tagCounts[a];
        if (countDiff !== 0) {
            return countDiff;
        }
        return a.localeCompare(b);
    });

    return (
        <div className="space-y-6">
            <div className="border-b border-border pb-6">
                <h1 className="text-2xl font-bold text-foreground">Tags</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Explore screenshots by tags
                </p>
            </div>

            <Suspense fallback={<TagsSkeleton />}>
                <TagsList tags={tags} tagCounts={tagCounts} />
            </Suspense>
        </div>
    );
}

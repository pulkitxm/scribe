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
        app?: string;
        project?: string;
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
    app,
    project,
}: {
    date?: string;
    tag?: string;
    category?: string;
    timeRange?: string;
    text?: string;
    domain?: string;
    workspace?: string;
    language?: string;
    app?: string;
    project?: string;
}) {
    const filters: FilterOptions = {};

    if (date) {
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

    if (category) filters.category = category;
    if (text) filters.text = text;
    if (domain) filters.domain = domain;
    if (workspace) filters.workspace = workspace;
    if (language) filters.language = language;
    if (app) filters.app = app;
    if (project) filters.project = project;

    let screenshots = getAllScreenshots(filters);

    if (tag) {
        screenshots = screenshots.filter((s) =>
            (s.data.summary_tags || []).some((t) => t.toLowerCase() === tag.toLowerCase())
        );
    }

    const initialScreenshots = screenshots.slice(0, 48);

    const clientFilters = { ...filters };
    if (tag) (clientFilters as any).tag = tag;

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

    // Extract unique values for filters
    const categories = [...new Set(allScreenshots.map((s) => s.data.category))].filter(Boolean).sort();
    const tags = [...new Set(allScreenshots.flatMap((s) => s.data.summary_tags || []))].sort();

    const apps = [...new Set(allScreenshots.flatMap((s) => s.data.evidence?.apps_visible || []))].filter(Boolean).sort();
    const projects = [...new Set(allScreenshots.map((s) => s.data.context.code_context?.repo_or_project).filter(Boolean))].sort() as string[];
    const languages = [...new Set(allScreenshots.map((s) => s.data.context.code_context?.language).filter(Boolean))].sort() as string[];
    const workspaces = [...new Set(allScreenshots.map((s) => s.data.workspace_type).filter(Boolean))].sort();
    const domains = [...new Set(allScreenshots.flatMap((s) => s.data.evidence?.web_domains_visible || []))].filter(Boolean).sort();

    const hasHiddenFilter = params.domain || params.workspace || params.language || params.text || params.app || params.project;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Gallery</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Browse all your captured screenshots
                </p>
            </div>

            <GalleryFilters
                dates={dates}
                categories={categories}
                tags={tags}
                apps={apps}
                projects={projects}
                languages={languages}
                workspaces={workspaces}
                domains={domains}
                currentDate={params.date}
                currentTag={params.tag}
                currentCategory={params.category}
                currentTimeRange={params.timeRange}
                currentText={params.text}
                currentApp={params.app as string}
                currentProject={params.project as string}
                currentLanguage={params.language as string}
                currentWorkspace={params.workspace as string}
                currentDomain={params.domain as string}
            />

            {params.tag && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Showing screenshots tagged with:</span>
                    <Badge variant="secondary">{params.tag}</Badge>
                </div>
            )}

            {/* ... badges for other params ... */}

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
                    app={params.app as string}
                    project={params.project as string}
                />
            </Suspense>
        </div>
    );
}

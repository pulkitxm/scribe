"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GalleryFiltersProps {
    dates: string[];
    categories: string[];
    tags: string[];
    currentDate?: string;
    currentTag?: string;
    currentCategory?: string;
    currentTimeRange?: string;
}

export default function GalleryFilters({
    dates,
    categories,
    tags,
    currentDate,
    currentTag,
    currentCategory,
    currentTimeRange,
}: GalleryFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/gallery?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        router.push("/gallery", { scroll: false });
    };

    const hasFilters = currentDate || currentTag || currentCategory || currentTimeRange;

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
            {/* Time Range Tabs */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Time</span>
                <Tabs value={currentTimeRange || "all"} onValueChange={(v) => updateFilter("timeRange", v)}>
                    <TabsList>
                        <TabsTrigger value="all" className="cursor-pointer">All</TabsTrigger>
                        <TabsTrigger value="today" className="cursor-pointer">Today</TabsTrigger>
                        <TabsTrigger value="week" className="cursor-pointer">Week</TabsTrigger>
                        <TabsTrigger value="month" className="cursor-pointer">Month</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Date Select */}
            <Select
                value={currentDate || "all"}
                onValueChange={(v) => updateFilter("date", v)}
            >
                <SelectTrigger className="w-[160px] cursor-pointer">
                    <SelectValue placeholder="All Dates" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All Dates</SelectItem>
                    {dates.map((date) => (
                        <SelectItem key={date} value={date} className="cursor-pointer">
                            {date}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Category Select */}
            <Select
                value={currentCategory || "all"}
                onValueChange={(v) => updateFilter("category", v)}
            >
                <SelectTrigger className="w-[160px] cursor-pointer">
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All Categories</SelectItem>
                    {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="cursor-pointer">
                            {cat}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Tag Select */}
            <Select
                value={currentTag || "all"}
                onValueChange={(v) => updateFilter("tag", v)}
            >
                <SelectTrigger className="w-[180px] cursor-pointer">
                    <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    <SelectItem value="all" className="cursor-pointer">All Tags</SelectItem>
                    {tags.slice(0, 50).map((tag) => (
                        <SelectItem key={tag} value={tag} className="cursor-pointer">
                            {tag}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="cursor-pointer"
                >
                    Clear Filters
                </Button>
            )}
        </div>
    );
}

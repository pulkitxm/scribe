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

interface DashboardFiltersProps {
    categories: string[];
    currentRange?: string;
    currentCategory?: string;
}

export default function DashboardFilters({
    categories,
    currentRange,
    currentCategory,
}: DashboardFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/?${params.toString()}`, { scroll: false });
    };

    const clearFilters = () => {
        router.push("/", { scroll: false });
    };

    const hasFilters = (currentRange && currentRange !== "all") || currentCategory;

    return (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">Time</span>
                <Tabs value={currentRange || "all"} onValueChange={(v) => updateFilter("range", v)}>
                    <TabsList>
                        <TabsTrigger value="all" className="cursor-pointer">All</TabsTrigger>
                        <TabsTrigger value="today" className="cursor-pointer">Today</TabsTrigger>
                        <TabsTrigger value="week" className="cursor-pointer">Week</TabsTrigger>
                        <TabsTrigger value="month" className="cursor-pointer">Month</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Category */}
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

            {hasFilters && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="cursor-pointer"
                >
                    Reset
                </Button>
            )}
        </div>
    );
}

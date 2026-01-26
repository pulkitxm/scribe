"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
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
    currentText?: string;
}

export default function GalleryFilters({
    dates,
    categories,
    tags,
    currentDate,
    currentTag,
    currentCategory,
    currentTimeRange,
    currentText,
}: GalleryFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchValue, setSearchValue] = useState(currentText || "");

    const updateSearch = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set("text", value);
            params.delete("page");
        } else {
            params.delete("text");
        }
        router.push(`/gallery?${params.toString()}`, { scroll: false });
    };

    const updateFilter = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all") {
            params.set(key, value);
            params.delete("page");
        } else {
            params.delete(key);
        }
        router.push(`/gallery?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        if (searchValue === (currentText || "")) return;

        const timer = setTimeout(() => {
            updateSearch(searchValue);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchValue, currentText]);

    useEffect(() => {
        setSearchValue(currentText || "");
    }, [currentText]);

    const clearFilters = () => {
        setSearchValue("");
        router.push("/gallery", { scroll: false });
    };

    const hasFilters = currentDate || currentTag || currentCategory || currentTimeRange || currentText;

    return (
        <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg shadow-sm">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search in screenshots (e.g. 'login page', 'errors', 'dashboard')..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-10 pr-10 w-full bg-background/50 border-muted focus:ring-primary/20"
                />
                {searchValue && (
                    <button
                        onClick={() => {
                            setSearchValue("");
                            updateSearch("");
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

                <Select
                    value={currentDate || "all"}
                    onValueChange={(v) => updateFilter("date", v)}
                >
                    <SelectTrigger className="w-[140px] cursor-pointer bg-background/50">
                        <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        {dates.map((date) => (
                            <SelectItem key={date} value={date}>{date}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={currentCategory || "all"}
                    onValueChange={(v) => updateFilter("category", v)}
                >
                    <SelectTrigger className="w-[150px] cursor-pointer bg-background/50">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={currentTag || "all"}
                    onValueChange={(v) => updateFilter("tag", v)}
                >
                    <SelectTrigger className="w-[160px] cursor-pointer bg-background/50">
                        <SelectValue placeholder="Tag" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        <SelectItem value="all">All Tags</SelectItem>
                        {tags.slice(0, 50).map((tag) => (
                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {hasFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="cursor-pointer text-muted-foreground hover:text-destructive whitespace-nowrap ml-auto"
                    >
                        Clear all
                    </Button>
                )}
            </div>
        </div>
    );
}

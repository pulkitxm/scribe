"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TagsListProps {
    tags: string[];
    tagCounts: Record<string, number>;
}

export default function TagsList({ tags, tagCounts }: TagsListProps) {
    const [search, setSearch] = useState("");

    const filteredTags = tags.filter((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
    );

    const maxCount = Math.max(...Object.values(tagCounts), 1);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Input
                    placeholder="Search tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Badge variant="secondary" className="h-8 px-3">
                    {filteredTags.length} tags
                </Badge>
            </div>

            {filteredTags.length === 0 ? (
                <div className="text-center py-16">
                    <div className="text-4xl mb-4 opacity-50">🏷️</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No tags found</h3>
                    <p className="text-sm text-muted-foreground">
                        Try searching for something else
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredTags.map((tag) => {
                        const count = tagCounts[tag];
                        const intensity = count / maxCount;

                        return (
                            <Link
                                key={tag}
                                href={`/gallery?tag=${encodeURIComponent(tag)}`}
                                className="block group cursor-pointer"
                            >
                                <Card className="h-full hover:border-foreground/20 transition-all cursor-pointer">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                                                {tag}
                                            </div>
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            {count} screenshot{count !== 1 ? "s" : ""}
                                        </div>

                                        <Progress
                                            value={intensity * 100}
                                            className="h-1.5"
                                        />
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

import Link from "next/link";
import Image from "next/image";
import { Screenshot } from "@/types/screenshot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface RecentScreenshotsProps {
    screenshots: Screenshot[];
    viewAllLink: string;
}

export default function RecentScreenshots({ screenshots, viewAllLink }: RecentScreenshotsProps) {
    if (screenshots.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
                <Link href={viewAllLink} className="text-sm text-primary hover:underline">
                    View All
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {screenshots.slice(0, 4).map((s) => (
                    <Link key={s.id} href={`/gallery/${s.date}/${s.id}`}>
                        <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group h-full">
                            <div className="relative aspect-video bg-muted">
                                <Image
                                    src={s.imagePath}
                                    alt={s.data.short_description}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="text-white font-medium text-xs px-2 text-center">
                                        {new Date(s.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                            <CardContent className="p-3">
                                <div className="text-xs font-medium truncate mb-1">{s.data.short_description}</div>
                                <div className="flex flex-wrap gap-1">
                                    {s.data.evidence.web_domains_visible.slice(0, 1).map(d => (
                                        <Badge key={d} variant="outline" className="text-[10px] h-4 px-1 truncate max-w-full">
                                            {d}
                                        </Badge>
                                    ))}
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                        {s.data.scores.focus_score}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </section>
    );
}

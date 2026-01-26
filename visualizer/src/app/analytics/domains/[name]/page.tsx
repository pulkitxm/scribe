import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllScreenshots, getExtendedStats, getDailyStats } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import HourlyChart from "@/components/HourlyChart";
import ProductivityChart from "@/components/ProductivityChart";
import RankingTable from "@/components/RankingTable";
import RecentScreenshots from "@/components/RecentScreenshots";

interface PageProps {
    params: Promise<{
        name: string;
    }>;
}

export default async function DomainDetailPage({ params }: PageProps) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    const screenshots = getAllScreenshots({ domain: decodedName });

    if (screenshots.length === 0) {
        notFound();
    }

    const stats = getExtendedStats(screenshots);
    const dailyStats = getDailyStats(screenshots);

    const apps = Object.entries(stats.apps)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                    <Link href="/analytics/domains">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{decodedName}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Domain Insights
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {stats.totalScreenshots.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                            Visits
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {stats.avgFocus}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                            Avg Focus
                        </div>
                        <Progress value={stats.avgFocus} className="h-1 mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {stats.avgDistraction}%
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                            Distraction
                        </div>
                        <Progress value={100 - stats.avgDistraction} className="h-1 mt-2" />
                    </CardContent>
                </Card>
            </div>

            <RecentScreenshots
                screenshots={screenshots}
                viewAllLink={`/gallery?domain=${encodeURIComponent(decodedName)}`}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProductivityChart data={dailyStats} title="Productivity Trend" />
                <HourlyChart data={stats.hourlyDistribution} title="Visit Patterns" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Accessed via App</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankingTable
                            items={apps}
                            total={stats.totalScreenshots}
                            label="App"
                            icon="💻"
                            linkPrefix="/analytics/apps"
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

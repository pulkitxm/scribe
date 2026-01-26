import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllScreenshots, getExtendedStats, getDailyStats, getSmartInsights } from "@/lib/data";
import SmartInsights from "@/components/SmartInsights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import HourlyChart from "@/components/HourlyChart";
import ProductivityChart from "@/components/ProductivityChart";
import CategoryChart from "@/components/CategoryChart";
import RankingTable from "@/components/RankingTable";
import RecentScreenshots from "@/components/RecentScreenshots";

interface PageProps {
    params: Promise<{
        name: string;
    }>;
}

export default async function AppDetailPage({ params }: PageProps) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    const screenshots = getAllScreenshots({ app: decodedName });

    if (screenshots.length === 0) {
        notFound();
    }

    const stats = getExtendedStats(screenshots);
    const dailyStats = getDailyStats(screenshots);
    const insights = getSmartInsights(stats);

    const projects = Object.entries(stats.repos || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4 pb-6 border-b border-border">
                <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                    <Link href="/analytics/apps">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">{decodedName}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Application Overview & Insights
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {stats.totalScreenshots.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1 font-medium">
                            Total Screenshots
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {stats.avgFocus}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1 font-medium">
                            Avg Focus Score
                        </div>
                        <Progress value={stats.avgFocus} className="h-1.5 mt-2 bg-primary/20" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {stats.avgProductivity}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1 font-medium">
                            Avg Productivity
                        </div>
                        <Progress value={stats.avgProductivity} className="h-1.5 mt-2 bg-primary/20" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {stats.avgDistraction}%
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1 font-medium">
                            Distraction Risk
                        </div>
                        <Progress value={100 - stats.avgDistraction} className="h-1.5 mt-2 bg-primary/20" />
                    </CardContent>
                </Card>
            </div>

            <SmartInsights insights={insights} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProductivityChart data={dailyStats} title="Productivity Trend" />
                <HourlyChart data={stats.hourlyDistribution} title="Usage by Hour" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <CategoryChart data={stats.categories} title="Activity Categories" />
                </div>
                <div className="lg:col-span-2">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Top Projects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <RankingTable
                                items={projects}
                                total={stats.totalScreenshots}
                                label="Project"
                                icon="📁"
                                linkPrefix="/analytics/projects"
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="pt-6 border-t border-border">
                <RecentScreenshots
                    filter={{ app: decodedName }}
                    title="Application Gallery"
                    limit={12}
                />
            </div>
        </div>
    );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Filter } from "lucide-react";
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

export default async function NetworkDetailPage({ params }: PageProps) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);

    // Fetch screenshots filtered by network
    const screenshots = getAllScreenshots({ network: decodedName });

    if (screenshots.length === 0) {
        notFound();
    }

    const stats = getExtendedStats(screenshots);
    const dailyStats = getDailyStats(screenshots);

    // Top Apps used on this network
    const apps = Object.entries(stats.apps)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    // Top Projects worked on this network
    const projects = Object.entries(stats.repos)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                    <Link href="/analytics/networks">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-foreground">{decodedName}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Network Connectivity Insights
                    </p>
                </div>
                <Button variant="outline" asChild className="gap-2 cursor-pointer">
                    <Link href={`/gallery?network=${encodeURIComponent(decodedName)}`}>
                        <Filter className="h-4 w-4" />
                        View in Gallery
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {stats.totalScreenshots.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                            Activity Samples
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
                            {stats.avgProductivity}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                            Avg Productivity
                        </div>
                        <Progress value={stats.avgProductivity} className="h-1 mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="text-3xl font-bold text-foreground">
                            {(stats as any).avgBattery}%
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
                            Avg Battery
                        </div>
                        <Progress value={(stats as any).avgBattery || 0} className="h-1 mt-2" />
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ProductivityChart data={dailyStats} title="Productivity on Network" />
                <HourlyChart data={stats.hourlyDistribution} title="Usage Patterns" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Top Apps</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankingTable
                            items={apps}
                            total={stats.totalScreenshots}
                            label="App"
                            icon="💻"
                            linkPrefix="/analytics/apps"
                            galleryFilterKey="app"
                        />
                    </CardContent>
                </Card>
                <Card className="h-full">
                    <CardHeader>
                        <CardTitle>Active Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankingTable
                            items={projects}
                            total={stats.totalScreenshots}
                            label="Project"
                            icon="📁"
                            linkPrefix="/analytics/projects"
                            galleryFilterKey="project"
                        />
                    </CardContent>
                </Card>
            </div>

            <RecentScreenshots filter={{ network: decodedName }} />
        </div>
    );
}

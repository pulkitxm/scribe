import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllScreenshots, getExtendedStats } from "@/lib/data";
import { Button } from "@/components/ui/button";
import RankingTable from "@/components/RankingTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function AppsAnalyticsPage() {
    const screenshots = getAllScreenshots();
    const stats = getExtendedStats(screenshots);

    const apps = Object.entries(stats.apps)
        .map(([name, value]) => ({
            name,
            count: typeof value === 'number' ? value : value.count
        }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                    <Link href="/analytics">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">App Usage</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Analyzing {apps.length} distinct applications
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Application Ranking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankingTable
                            items={apps}
                            total={stats.totalScreenshots}
                            label="Application"
                            icon="💻"
                            linkPrefix="/analytics/apps"
                            galleryFilterKey="app"
                        />
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                Top Application
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground truncate">
                                {apps[0]?.name || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {apps[0]?.count || 0} screenshots
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                Diversity Score
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">
                                {apps.length}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                Unique apps detected
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

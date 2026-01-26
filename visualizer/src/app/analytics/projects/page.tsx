import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllScreenshots, getExtendedStats } from "@/lib/data";
import { Button } from "@/components/ui/button";
import RankingTable from "@/components/RankingTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProjectsAnalyticsPage() {
    const screenshots = getAllScreenshots();
    const stats = getExtendedStats(screenshots);

    const projects = Object.entries(stats.repos || {})
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                    <Link href="/">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Projects & Repositories</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Analyzing activity in {projects.length} projects
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Project Ranking</CardTitle>
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

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                Most Active Project
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground truncate">
                                {projects[0]?.name || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {projects[0]?.count || 0} screenshots
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

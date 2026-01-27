import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllScreenshots, getExtendedStats } from "@/lib/data";
import { Button } from "@/components/ui/button";
import RankingTable from "@/components/RankingTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function LanguagesAnalyticsPage() {
    const screenshots = getAllScreenshots();
    const stats = getExtendedStats(screenshots);

    const languages = Object.entries(stats.languages || {})
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .map(([name, count]) => ({ name, count: count as number }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                    <Link href="/analytics">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Programming Languages</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Analyzing code across {languages.length} languages
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Language Ranking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankingTable
                            items={languages}
                            total={stats.totalScreenshots}
                            label="Language"
                            icon="📝"
                            linkPrefix="/analytics/languages"
                            galleryFilterKey="language"
                        />
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                Top Language
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground truncate">
                                {languages[0]?.name || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {languages[0]?.count || 0} screenshots
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

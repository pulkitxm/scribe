import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getAllScreenshots, getExtendedStats } from "@/lib/data";
import { Button } from "@/components/ui/button";
import RankingTable from "@/components/RankingTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NetworksAnalyticsPage() {
    const screenshots = getAllScreenshots();
    const stats = getExtendedStats(screenshots);

    // Ensure stats.networks exists, defaulting to empty object if not
    const networksData = (stats as any).networks || {};

    const networks = Object.entries(networksData)
        .sort((a: any, b: any) => b[1] - a[1])
        .map(([name, count]) => ({ name: name as string, count: count as number }));

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                    <Link href="/analytics">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Wi-Fi Networks</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Analyzing connectivity across {networks.length} networks
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Network Ranking</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RankingTable
                            items={networks}
                            total={stats.totalScreenshots}
                            label="SSID"
                            icon="📡"
                            linkPrefix="/analytics/networks"
                            galleryFilterKey="network"
                        />
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                                Top Network
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground truncate">
                                {networks[0]?.name || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                                {networks[0]?.count || 0} screenshots
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

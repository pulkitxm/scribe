import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  getAllScreenshots,
  getExtendedStats,
  getLocationPoints,
} from "@/lib/data";
import { Button } from "@/components/ui/button";
import RankingTable from "@/components/RankingTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LocationsMapClient from "@/components/LocationsMapClient";

export const dynamic = "force-dynamic";

export default async function LocationsAnalyticsPage() {
  const screenshots = getAllScreenshots();
  const stats = getExtendedStats(screenshots);
  const locationPoints = getLocationPoints(screenshots);

  const locations = Object.entries(stats.locations || {})
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
          <h1 className="text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Where your screenshots were captured
          </p>
        </div>
      </div>

      {locationPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Map</CardTitle>
            <p className="text-sm text-muted-foreground">
              Click a point to see screenshot count and open in gallery
            </p>
          </CardHeader>
          <CardContent>
            <LocationsMapClient points={locationPoints} />
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Location Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            {locations.length > 0 ? (
              <RankingTable
                items={locations}
                total={stats.totalScreenshots}
                label="Location"
                icon="📍"
                linkPrefix="/analytics/locations"
                galleryFilterKey="location"
              />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No location data yet. Enable location in Scribe to tag
                screenshots with where they were taken.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                Top Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground truncate">
                {locations[0]?.name || "N/A"}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {locations[0]?.count || 0} screenshots
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

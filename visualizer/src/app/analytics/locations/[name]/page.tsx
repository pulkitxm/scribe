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
import FocusTrendChart from "@/components/charts/FocusTrendChart";
import DayOfWeekChart from "@/components/charts/DayOfWeekChart";
import ScoreDistributionChart from "@/components/charts/ScoreDistributionChart";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    name: string;
  }>;
}

export default async function LocationDetailPage({ params }: PageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);

  const screenshots = getAllScreenshots({ location: decodedName });

  if (screenshots.length === 0) {
    notFound();
  }

  const stats = getExtendedStats(screenshots);
  const dailyStats = getDailyStats(screenshots);

  const apps = Object.entries(stats.apps)
    .map(([n, value]) => ({
      name: n,
      count: typeof value === "number" ? value : value.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const dayOfWeekData = screenshots.reduce(
    (acc, s) => {
      const day = new Date(s.timestamp).toLocaleDateString("en-US", {
        weekday: "long",
      });
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const dayOfWeekChartData = Object.entries(dayOfWeekData).map(
    ([day, count]) => ({ day, count }),
  );

  const focusDistribution = [0, 0, 0, 0, 0];
  const productivityDistribution = [0, 0, 0, 0, 0];
  const distractionDistribution = [0, 0, 0, 0, 0];

  screenshots.forEach((s) => {
    const focusScore = s.data.scores.focus_score;
    const productivityScore = s.data.scores.productivity_score;
    const distractionScore = s.data.scores.distraction_risk;

    focusDistribution[Math.min(Math.floor(focusScore / 20), 4)]++;
    productivityDistribution[Math.min(Math.floor(productivityScore / 20), 4)]++;
    distractionDistribution[Math.min(Math.floor(distractionScore / 20), 4)]++;
  });

  const focusDistData = focusDistribution.map((count, i) => ({
    range: `${i * 20}-${(i + 1) * 20}`,
    count,
  }));

  const productivityDistData = productivityDistribution.map((count, i) => ({
    range: `${i * 20}-${(i + 1) * 20}`,
    count,
  }));

  const distractionDistData = distractionDistribution.map((count, i) => ({
    range: `${i * 20}-${(i + 1) * 20}`,
    count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Button variant="ghost" size="icon" asChild className="cursor-pointer">
          <Link href="/analytics/locations">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <span>📍</span> {decodedName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Screenshots captured at this location
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2 cursor-pointer">
          <Link href={`/gallery?location=${encodeURIComponent(decodedName)}`}>
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
            <Progress
              value={stats.avgFocus}
              className="h-1.5 mt-2 bg-primary/20"
            />
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
            <Progress
              value={stats.avgProductivity}
              className="h-1.5 mt-2 bg-primary/20"
            />
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
            <Progress
              value={100 - stats.avgDistraction}
              className="h-1.5 mt-2 bg-primary/20"
            />
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Trends & Patterns</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FocusTrendChart data={dailyStats} days={30} />
          <DayOfWeekChart data={dayOfWeekChartData} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Score Distributions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <ScoreDistributionChart
            data={focusDistData}
            title="Focus Score Distribution"
            scoreType="focus"
          />
          <ScoreDistributionChart
            data={productivityDistData}
            title="Productivity Distribution"
            scoreType="productivity"
          />
          <ScoreDistributionChart
            data={distractionDistData}
            title="Distraction Distribution"
            scoreType="distraction"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Performance Overview</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ProductivityChart data={dailyStats} title="Productivity Trend" />
          <HourlyChart
            data={stats.hourlyDistribution}
            title="Capture Time Patterns"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Top Apps at this Location</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Apps Used</CardTitle>
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
      </section>

      <section className="space-y-4 pt-6 border-t border-border">
        <RecentScreenshots
          filter={{ location: decodedName }}
          title="Location Gallery"
          limit={12}
        />
      </section>
    </div>
  );
}

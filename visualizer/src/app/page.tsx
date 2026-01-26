import { Suspense } from "react";
import Link from "next/link";
import { getAllScreenshots, getDailyStats, getExtendedStats } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardFilters from "@/components/DashboardFilters";
import { FilterOptions } from "@/types/screenshot";

interface PageProps {
  searchParams: Promise<{
    range?: string;
    category?: string;
  }>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="border-b border-border pb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>

      {/* Filter skeleton */}
      <Skeleton className="h-14 w-full" />

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-3 w-24 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function getFiltersFromParams(range?: string, category?: string): FilterOptions {
  const filters: FilterOptions = {};

  if (range && range !== "all") {
    const now = new Date();
    switch (range) {
      case "today":
        filters.startDate = now.toISOString().split("T")[0];
        filters.endDate = now.toISOString().split("T")[0];
        break;
      case "week":
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        filters.startDate = weekAgo.toISOString().split("T")[0];
        break;
      case "month":
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        filters.startDate = monthAgo.toISOString().split("T")[0];
        break;
    }
  }

  if (category) {
    filters.category = category;
  }

  return filters;
}

async function DashboardContent({
  range,
  category,
}: {
  range?: string;
  category?: string;
}) {
  const filters = getFiltersFromParams(range, category);
  const screenshots = getAllScreenshots(filters);
  const stats = getExtendedStats(screenshots);
  const dailyStats = getDailyStats(screenshots).slice(0, 7);

  // Get categories for filter
  const allScreenshots = getAllScreenshots();
  const categories = [...new Set(allScreenshots.map((s) => s.data.category))].filter(Boolean).sort();

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl mb-4 opacity-50">📊</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Data Available</h3>
        <p className="text-sm text-muted-foreground">
          Start capturing screenshots to see your productivity insights
        </p>
      </div>
    );
  }

  // Top apps
  const topApps = Object.entries(stats.apps)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Hourly distribution for chart
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: stats.hourlyDistribution[hour] || 0,
  }));

  const maxHourly = Math.max(...hourlyData.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your productivity at a glance
        </p>
      </div>

      {/* Filters */}
      <DashboardFilters
        categories={categories}
        currentRange={range}
        currentCategory={category}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-foreground">
              {stats.totalScreenshots.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Total Screenshots
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-foreground">
              {stats.avgFocus}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Avg Focus Score
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
              {stats.avgDistraction}%
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
              Distraction Risk
            </div>
            <Progress value={100 - stats.avgDistraction} className="h-1 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Analytics Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Link href="/analytics/apps" className="cursor-pointer">
              <Button variant="outline" className="w-full justify-start cursor-pointer">
                <span className="mr-2">💻</span>
                Apps
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(stats.apps).length}
                </Badge>
              </Button>
            </Link>
            <Link href="/analytics/languages" className="cursor-pointer">
              <Button variant="outline" className="w-full justify-start cursor-pointer">
                <span className="mr-2">📝</span>
                Languages
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(stats.languages || {}).length}
                </Badge>
              </Button>
            </Link>
            <Link href="/analytics/projects" className="cursor-pointer">
              <Button variant="outline" className="w-full justify-start cursor-pointer">
                <span className="mr-2">📁</span>
                Projects
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(stats.repos || {}).length}
                </Badge>
              </Button>
            </Link>
            <Link href="/analytics/domains" className="cursor-pointer">
              <Button variant="outline" className="w-full justify-start cursor-pointer">
                <span className="mr-2">🌐</span>
                Domains
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(stats.domains || {}).length}
                </Badge>
              </Button>
            </Link>
            <Link href="/analytics/workspaces" className="cursor-pointer">
              <Button variant="outline" className="w-full justify-start cursor-pointer">
                <span className="mr-2">🖥️</span>
                Workspaces
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(stats.workspaceTypes || {}).length}
                </Badge>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hourly Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity by Hour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-[160px]">
              {hourlyData.map((d) => (
                <div
                  key={d.hour}
                  className="flex-1 bg-muted rounded-t hover:bg-foreground/20 transition-colors cursor-default"
                  style={{
                    height: maxHourly > 0 ? `${(d.count / maxHourly) * 100}%` : "0%",
                    minHeight: d.count > 0 ? "4px" : "0",
                  }}
                  title={`${d.hour}:00 - ${d.count} screenshots`}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:00</span>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(stats.categories)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([cat, count]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground">{cat}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <Progress
                    value={(count / stats.totalScreenshots) * 100}
                    className="h-1.5"
                  />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Top Apps and Daily Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Apps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Apps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topApps.map(([app, count]) => (
              <div key={app} className="flex justify-between items-center">
                <span className="text-sm text-foreground">{app}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Days */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Screenshots</TableHead>
                  <TableHead className="text-right">Focus</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyStats.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell className="text-muted-foreground">{day.date}</TableCell>
                    <TableCell className="text-right">{day.totalScreenshots}</TableCell>
                    <TableCell className="text-right">{day.avgFocusScore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent range={params.range} category={params.category} />
    </Suspense>
  );
}

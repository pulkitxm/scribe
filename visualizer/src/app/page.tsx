import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { getAllScreenshots, getDailyStats, getExtendedStats, getHighFocusScreenshots, getSmartInsights, getAppStats } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardFilters from "@/components/DashboardFilters";
import HourlyChart from "@/components/HourlyChart";
import CategoryChart from "@/components/CategoryChart";
import ProductivityChart from "@/components/ProductivityChart";
import { FilterOptions } from "@/types/screenshot";
import { Lightbulb, Zap, Clock, Target } from "lucide-react";
import SmartInsights from "@/components/SmartInsights";
import AppEfficiencyChart from "@/components/AppEfficiencyChart";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    range?: string;
    category?: string;
  }>;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Skeleton className="h-32 w-full" />
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
  const appStats = getAppStats(screenshots);

  const filteredDailyStats = getDailyStats(screenshots);
  const highFocusScreenshots = getHighFocusScreenshots(4);
  const allScreenshots = getAllScreenshots();
  const globalStats = getExtendedStats(allScreenshots);
  const insights = getSmartInsights(allScreenshots, globalStats);

  const categories = [...new Set(allScreenshots.map((s) => s.data.category))].filter(Boolean).sort();

  filteredDailyStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (screenshots.length === 0 && allScreenshots.length === 0) {
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

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Productivity Overview
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <SmartInsights insights={insights} />

      <DashboardFilters
        categories={categories}
        currentRange={range}
        currentCategory={category}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Screenshots
              </div>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stats.totalScreenshots.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Avg Focus
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stats.avgFocus}
            </div>
            <Progress value={stats.avgFocus} className="h-1 mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Productivity
              </div>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {stats.avgProductivity}
            </div>
            <Progress value={stats.avgProductivity} className="h-1 mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Context
              </div>
              <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground">
              {Object.keys(stats.workTypes).length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Work Types Detected</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-h-[350px]">
          <AppEfficiencyChart data={appStats} />
        </div>
        <div className="min-h-[350px]">
          <HourlyChart data={stats.hourlyDistribution} title="Activity by Hour" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Link href="/analytics/apps" className="cursor-pointer">
          <Button variant="outline" className="w-full justify-start cursor-pointer hover:bg-accent/50">
            <span className="mr-2">💻</span> Apps
          </Button>
        </Link>
        <Link href="/analytics/languages" className="cursor-pointer">
          <Button variant="outline" className="w-full justify-start cursor-pointer hover:bg-accent/50">
            <span className="mr-2">📝</span> Languages
          </Button>
        </Link>
        <Link href="/analytics/projects" className="cursor-pointer">
          <Button variant="outline" className="w-full justify-start cursor-pointer hover:bg-accent/50">
            <span className="mr-2">📁</span> Projects
          </Button>
        </Link>
        <Link href="/analytics/domains" className="cursor-pointer">
          <Button variant="outline" className="w-full justify-start cursor-pointer hover:bg-accent/50">
            <span className="mr-2">🌐</span> Domains
          </Button>
        </Link>
        <Link href="/analytics/workspaces" className="cursor-pointer">
          <Button variant="outline" className="w-full justify-start cursor-pointer hover:bg-accent/50">
            <span className="mr-2">🖥️</span> Workspaces
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-h-[350px]">
          <ProductivityChart data={filteredDailyStats} title="Productivity Trend" />
        </div>
        <div className="min-h-[350px]">
          <CategoryChart data={stats.workTypes} title="Work Context Distribution" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="min-h-[350px]">
          <HourlyChart data={stats.hourlyContextSwitches} title="Context Switch Rate (Switches/Hr)" />
        </div>
        <div className="min-h-[350px]">
          <CategoryChart data={stats.workspaceTypes} title="Workspace Usage" />
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Recent Flow States (High Focus)
          </h2>
          <Link href="/gallery?minFocus=80" className="text-xs text-primary hover:underline">
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {highFocusScreenshots.map((s) => (
            <Link key={s.id} href={`/gallery/${s.date}/${s.id}`}>
              <Card className="overflow-hidden hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="relative aspect-video">
                  <Image
                    src={s.imagePath}
                    alt={s.data.short_description}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Badge>{s.data.scores.focus_score} Focus</Badge>
                  </div>
                </div>
                <CardContent className="p-3">
                  <div className="text-xs font-medium truncate">{s.data.short_description}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {new Date(s.timestamp).toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {highFocusScreenshots.length === 0 && (
            <div className="col-span-full p-8 text-center text-muted-foreground border border-dashed rounded-lg">
              No high focus moments detected recently.
            </div>
          )}
        </div>
      </section>
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

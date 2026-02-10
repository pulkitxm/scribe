import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAllScreenshots,
  getExtendedStats,
  getAudioPlaybackStats,
} from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const screenshots = getAllScreenshots();
  const stats = getExtendedStats(screenshots);
  const audioStats = getAudioPlaybackStats(screenshots);

  const getTop = (obj: Record<string, any>) =>
    Object.entries(obj)
      .map(
        ([k, v]) =>
          [k, typeof v === "number" ? v : v.count] as [string, number],
      )
      .sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  const topApp = getTop(stats.apps);
  const topLang = getTop(stats.languages);
  const topProject = getTop(stats.repos);
  const topDomain = getTop(stats.domains);
  const topWorkspace = getTop(stats.workspaceTypes);

  const links = [
    {
      title: "Apps",
      href: "/analytics/apps",
      icon: "💻",
      description: "Application usage trends",
      stat: `Top: ${topApp[0]}`,
      count: `${topApp[1]} screenshots`,
    },
    {
      title: "Languages",
      href: "/analytics/languages",
      icon: "📝",
      description: "Programming languages used",
      stat: `Top: ${topLang[0]}`,
      count: `${topLang[1]} screenshots`,
    },
    {
      title: "Projects",
      href: "/analytics/projects",
      icon: "📁",
      description: "Project activity analysis",
      stat: `Top: ${topProject[0]}`,
      count: `${topProject[1]} screenshots`,
    },
    {
      title: "Domains",
      href: "/analytics/domains",
      icon: "🌐",
      description: "Web browsing statistics",
      stat: `Top: ${topDomain[0]}`,
      count: `${topDomain[1]} screenshots`,
    },
    {
      title: "Workspaces",
      href: "/analytics/workspaces",
      icon: "🖥️",
      description: "Workspace environment breakdown",
      stat: `Top: ${topWorkspace[0]}`,
      count: `${topWorkspace[1]} screenshots`,
    },
    {
      title: "Networks",
      href: "/analytics/networks",
      icon: "📡",
      description: "Connection history & stats",
      stat: `Top: ${getTop(stats.networks || {})[0] || "Unknown"}`,
      count: `${Object.keys(stats.networks || {}).length} networks`,
    },
    {
      title: "Locations",
      href: "/analytics/locations",
      icon: "📍",
      description: "Where screenshots were captured",
      stat: `Top: ${getTop(stats.locations || {})[0] || "None"}`,
      count: `${Object.keys(stats.locations || {}).length} locations`,
    },
    {
      title: "System Health",
      href: "/analytics/system",
      icon: "⚙️",
      description: "CPU, RAM & Battery analysis",
      stat: `CPU: ${stats.avgCpu}% | RAM: ${stats.avgRam}%`,
      count: `Battery: ${stats.avgBattery}%`,
    },
    {
      title: "Audio & Music",
      href: "/analytics/audio",
      icon: "🎵",
      description: "Listening habits & music analytics",
      stat: `${audioStats.nowPlayingHistory.length} tracks played`,
      count: `${audioStats.stats.totalUniqueApps} audio apps used`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-6">
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deep dive into your productivity patterns
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group cursor-pointer"
          >
            <Card className="h-full hover:border-foreground/20 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span>{link.icon}</span>
                  {link.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {link.description}
                    </p>
                  </div>

                  <div className="bg-muted/50 p-3 rounded-md">
                    <div className="text-sm font-medium text-foreground truncate">
                      {link.stat}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {link.count}
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full cursor-pointer group-hover:bg-accent"
                  >
                    View Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

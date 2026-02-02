"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Zap, Lightbulb } from "lucide-react";
import DailyStatsTable from "./DailyStatsTable";

interface DashboardStatsProps {
  stats: any;
  dailyStats: any[];
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function DashboardStats({
  stats,
  dailyStats,
}: DashboardStatsProps) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const cards = [
    {
      id: "screenshots",
      label: "Screenshots",
      value: stats.totalScreenshots.toLocaleString(),
      icon: Clock,
      progress: null,
      details: (
        <div className="space-y-4">
          <p>Total screenshots captured in the current filtered view.</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="text-sm text-muted-foreground">Photos</div>
              <div className="text-2xl font-bold">{stats.totalScreenshots}</div>
            </div>
            <div className="p-4 border rounded-lg bg-muted/20">
              <div className="text-sm text-muted-foreground">Total Size</div>
              <div className="text-2xl font-bold">
                {formatBytes(stats.totalSize || 0)}
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-2">Day-wise Split</h4>
            <ScrollArea className="h-[300px]">
              <DailyStatsTable dailyStats={dailyStats} />
            </ScrollArea>
          </div>
        </div>
      ),
    },
    {
      id: "focus",
      label: "Avg Focus",
      value: stats.avgFocus,
      icon: Target,
      progress: stats.avgFocus,
      details: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Focus score based on screen content & app usage.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">
              {stats.avgFocus}
            </div>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <Progress value={stats.avgFocus} className="h-2" />

          <div>
            <h4 className="text-sm font-semibold mb-2">Most Used Apps</h4>
            <div className="space-y-1">
              {Object.entries(stats.apps)
                .sort(([, a], [, b]) => (b as any).count - (a as any).count)
                .slice(0, 5)
                .map(([app, data]: [string, any]) => (
                  <div key={app} className="flex justify-between text-sm">
                    <span>{app}</span>
                    <div className="flex gap-2">
                      <span className="font-mono">{data.avgFocus}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "productivity",
      label: "Productivity",
      value: stats.avgProductivity,
      icon: Zap,
      progress: stats.avgProductivity,
      details: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Productivity score based on categorized activity.
          </p>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-primary">
              {stats.avgProductivity}
            </div>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          <Progress value={stats.avgProductivity} className="h-2" />

          <div>
            <h4 className="text-sm font-semibold mb-2">Top Categories</h4>
            <div className="space-y-1">
              {Object.entries(stats.categories)
                .sort(([, a], [, b]) => (b as any).count - (a as any).count)
                .slice(0, 5)
                .map(([cat, data]: [string, any]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span>{cat}</span>
                    <div className="flex gap-2">
                      <span className="font-mono">{data.avgProductivity}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "context",
      label: "Context",
      value: Object.keys(stats.workTypes).length,
      subtext: "Work Types Detected",
      icon: Lightbulb,
      progress: null,
      details: (
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <p>Detected contexts based on your activity.</p>

            <div>
              <h4 className="text-sm font-semibold mb-2">Work Types</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.workTypes)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([type, count]) => (
                    <Badge
                      key={type}
                      variant="secondary"
                      className="flex gap-2"
                    >
                      <span>{type}</span>
                      <span className="opacity-50 text-[10px]">
                        {count as number}
                      </span>
                    </Badge>
                  ))}
              </div>
            </div>

            {Object.keys(stats.apps).length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Top Apps</h4>
                <div className="space-y-2">
                  {Object.entries(stats.apps)
                    .sort(([, a], [, b]) => (b as any).count - (a as any).count)
                    .slice(0, 10)
                    .map(([app, data]: [string, any]) => (
                      <div
                        key={app}
                        className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted"
                      >
                        <span>{app}</span>
                        <span className="text-muted-foreground">
                          {data.count} uses
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      ),
    },
  ];

  const selectedData = cards.find((c) => c.id === selectedCard);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card
            key={card.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => setSelectedCard(card.id)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-2">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  {card.label}
                </div>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold text-foreground">
                {card.value}
              </div>
              {card.subtext && (
                <div className="text-xs text-muted-foreground mt-1">
                  {card.subtext}
                </div>
              )}
              {card.progress !== null && (
                <Progress value={card.progress} className="h-1 mt-3" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog
        open={!!selectedCard}
        onOpenChange={(open) => !open && setSelectedCard(null)}
      >
        <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedData?.icon && <selectedData.icon className="h-5 w-5" />}
              {selectedData?.label}
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown for {selectedData?.label.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex-1 overflow-y-auto">
            {selectedData?.details}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

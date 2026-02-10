"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Music, Radio, Volume2, Play } from "lucide-react";

interface AudioPlaybackChartProps {
  data: {
    hourlyPlayback: Array<{
      hour: number;
      activeCount: number;
      systemActiveCount: number;
      uniqueApps: string[];
    }>;
    topPlayingApps: Array<{
      app: string;
      count: number;
      percentage: number;
    }>;
    nowPlayingHistory: Array<{
      timestamp: string;
      app: string;
      title?: string;
      artist?: string;
      album?: string;
      duration?: number;
      currentTime?: number;
      genre?: string;
      year?: number;
      trackNumber?: number;
      albumArtist?: string;
      composer?: string;
      rating?: number;
      playCount?: number;
      artworkURL?: string;
    }>;
    stats: {
      totalPlaybackSessions: number;
      totalUniqueApps: number;
      avgPlaybackPerHour: number;
      mostActiveHour: number;
      playbackPercentage: number;
    };
  };
}

const COLORS = [
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#06b6d4",
  "#84cc16",
];

export default function AudioPlaybackChart({ data }: AudioPlaybackChartProps) {
  if (!data || data.hourlyPlayback.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
            <Music className="h-4 w-4" />
            Audio Playback Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No audio playback data available
        </CardContent>
      </Card>
    );
  }

  const { hourlyPlayback, topPlayingApps, nowPlayingHistory, stats } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Play className="h-3 w-3" />
              Total Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalPlaybackSessions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.playbackPercentage.toFixed(1)}% of time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Radio className="h-3 w-3" />
              Unique Apps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUniqueApps}</div>
            <p className="text-xs text-muted-foreground mt-1">
              apps used for audio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Volume2 className="h-3 w-3" />
              Avg Per Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgPlaybackPerHour.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              playback sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Music className="h-3 w-3" />
              Peak Hour
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostActiveHour}:00</div>
            <p className="text-xs text-muted-foreground mt-1">
              most active time
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Music className="h-4 w-4" />
              Audio Playback Over Time
            </span>
          </CardTitle>
          <CardDescription>
            Active audio playback sessions throughout the day
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={hourlyPlayback}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="hour"
                stroke="#888888"
                fontSize={11}
                tickFormatter={(value) => `${value}:00`}
              />
              <YAxis
                stroke="#888888"
                fontSize={11}
                label={{
                  value: "Sessions",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: 11 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                }}
                itemStyle={{ color: "#e5e7eb" }}
                formatter={(
                  value: number | undefined,
                  name: string | undefined,
                ) => {
                  if (value === undefined) return [0, name || "Unknown"];
                  if (name === "activeCount") return [value, "Active Playback"];
                  if (name === "systemActiveCount")
                    return [value, "System Audio"];
                  return [value, name || "Unknown"];
                }}
                labelFormatter={(label) => `Hour: ${label}:00`}
              />
              <Legend />
              <Bar
                dataKey="activeCount"
                name="Active Playback"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="systemActiveCount"
                name="System Audio"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {topPlayingApps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
                <Radio className="h-4 w-4" />
                Top Audio Apps
              </CardTitle>
              <CardDescription>
                Most frequently used for playback
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topPlayingApps}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) =>
                      entry.app
                        ? `${entry.app} (${entry.percentage.toFixed(0)}%)`
                        : ""
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {topPlayingApps.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                    }}
                    formatter={(
                      value: number | undefined,
                      name: string | undefined,
                      props: any,
                    ) => {
                      if (value === undefined)
                        return ["0 sessions", name || "Unknown"];
                      return [
                        `${value} sessions (${props.payload.percentage.toFixed(1)}%)`,
                        props.payload.app,
                      ];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
                <Music className="h-4 w-4" />
                App Rankings
              </CardTitle>
              <CardDescription>
                Playback frequency by application
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topPlayingApps.slice(0, 8).map((app, index) => (
                  <div key={app.app} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {app.app}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {app.count}
                        </Badge>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-1.5 mt-1">
                        <div
                          className="h-1.5 rounded-full"
                          style={{
                            width: `${app.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {nowPlayingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Play className="h-4 w-4" />
              Recent Playback History
            </CardTitle>
            <CardDescription>
              Recently played media with details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {nowPlayingHistory
                .filter(
                  (item, index, self) =>
                    index ===
                    self.findIndex(
                      (t) => t.title === item.title && t.artist === item.artist,
                    ),
                )
                .slice(0, 20)
                .map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {item.artworkURL ? (
                        <img
                          src={item.artworkURL}
                          alt={item.title || "Album art"}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.nextElementSibling?.classList.remove(
                              "hidden",
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-12 h-12 rounded bg-primary/10 flex items-center justify-center ${item.artworkURL ? "hidden" : ""}`}
                      >
                        <Music className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {item.title && (
                            <div className="font-medium text-sm truncate">
                              {item.title}
                              {item.year && (
                                <span className="text-muted-foreground ml-1">
                                  ({item.year})
                                </span>
                              )}
                            </div>
                          )}
                          {item.artist && (
                            <div className="text-xs text-muted-foreground truncate">
                              {item.artist}
                              {item.album && ` • ${item.album}`}
                            </div>
                          )}
                          {(item.genre || item.composer) && (
                            <div className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.genre && <span>{item.genre}</span>}
                              {item.composer && item.genre && <span> • </span>}
                              {item.composer && <span>{item.composer}</span>}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {item.app}
                            </Badge>
                            {item.duration && item.currentTime && (
                              <span className="text-xs text-muted-foreground">
                                {formatTime(item.currentTime)} /{" "}
                                {formatTime(item.duration)}
                              </span>
                            )}
                            {item.rating !== undefined && item.rating > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ⭐ {item.rating}/100
                              </span>
                            )}
                            {item.playCount !== undefined &&
                              item.playCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  ▶️ {item.playCount}
                                </span>
                              )}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(item.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: false,
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatTime(time: number): string {
  const seconds = time > 10000 ? time / 1000 : time;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

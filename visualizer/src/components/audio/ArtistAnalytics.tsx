"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Music, Clock, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Track {
  artist?: string;
  duration?: number;
  genre?: string;
  title?: string;
}

interface ArtistAnalyticsProps {
  tracks: Track[];
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

export default function ArtistAnalytics({ tracks }: ArtistAnalyticsProps) {
  const artistStats: Record<
    string,
    {
      count: number;
      totalDuration: number;
      genres: Set<string>;
      songs: Set<string>;
    }
  > = {};

  tracks.forEach((track) => {
    if (!track.artist) return;

    if (!artistStats[track.artist]) {
      artistStats[track.artist] = {
        count: 0,
        totalDuration: 0,
        genres: new Set(),
        songs: new Set(),
      };
    }

    artistStats[track.artist].count++;
    artistStats[track.artist].totalDuration += track.duration || 0;
    if (track.genre) artistStats[track.artist].genres.add(track.genre);
    if (track.title) artistStats[track.artist].songs.add(track.title);
  });

  const topArtists = Object.entries(artistStats)
    .map(([artist, stats]) => ({
      artist,
      count: stats.count,
      totalDuration: stats.totalDuration,
      avgDuration: stats.totalDuration / stats.count,
      genres: Array.from(stats.genres),
      uniqueSongs: stats.songs.size,
      percentage: (stats.count / tracks.length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const top10Artists = topArtists.slice(0, 10);
  const top5Artists = topArtists.slice(0, 5);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Most Played Artists
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top10Artists}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" stroke="#888888" fontSize={11} />
              <YAxis
                type="category"
                dataKey="artist"
                stroke="#888888"
                fontSize={11}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                }}
                formatter={(
                  value: number | undefined,
                  name: string | undefined,
                ) => {
                  if (value === undefined) return ["0", name || "Unknown"];
                  return [`${value} plays`, "Plays"];
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            Artist Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top5Artists}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) =>
                  entry.artist
                    ? `${entry.artist.substring(0, 15)}${entry.artist.length > 15 ? "..." : ""} (${entry.percentage.toFixed(0)}%)`
                    : ""
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="count"
              >
                {top5Artists.map((entry, index) => (
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
                  if (value === undefined) return ["0", name || "Unknown"];
                  return [
                    `${value} plays (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.artist,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
            <User className="h-4 w-4" />
            Artist Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {top10Artists.map((artist, index) => (
              <Link
                key={artist.artist}
                href={`/gallery?artist=${encodeURIComponent(artist.artist)}`}
                className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-primary/10 hover:border-primary/50 border border-transparent transition-all cursor-pointer"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                >
                  {index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">
                      {artist.artist}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="text-xs flex-shrink-0"
                    >
                      {artist.count} plays
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {artist.uniqueSongs} unique songs
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(artist.totalDuration)}
                    </span>
                    {artist.genres.length > 0 && (
                      <span className="flex items-center gap-1">
                        {artist.genres.slice(0, 2).join(", ")}
                        {artist.genres.length > 2 &&
                          ` +${artist.genres.length - 2}`}
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-secondary rounded-full h-1.5 mt-2">
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${artist.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

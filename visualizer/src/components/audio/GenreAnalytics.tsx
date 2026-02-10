"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, TrendingUp } from "lucide-react";
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
  genre?: string;
  duration?: number;
}

interface GenreAnalyticsProps {
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

export default function GenreAnalytics({ tracks }: GenreAnalyticsProps) {
  const genreStats: Record<string, { count: number; totalDuration: number }> =
    {};

  tracks.forEach((track) => {
    if (!track.genre) return;

    if (!genreStats[track.genre]) {
      genreStats[track.genre] = { count: 0, totalDuration: 0 };
    }

    genreStats[track.genre].count++;
    genreStats[track.genre].totalDuration += track.duration || 0;
  });

  const genreData = Object.entries(genreStats)
    .map(([genre, stats]) => ({
      genre,
      count: stats.count,
      totalDuration: stats.totalDuration,
      percentage: (stats.count / tracks.filter((t) => t.genre).length) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  const top8Genres = genreData.slice(0, 8);

  if (genreData.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No genre information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Genres
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top8Genres}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis
                dataKey="genre"
                stroke="#888888"
                fontSize={11}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis stroke="#888888" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                }}
                formatter={(value: number | undefined) => {
                  if (value === undefined) return ["0", "Plays"];
                  return [`${value} plays`, "Plays"];
                }}
              />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
            <Music className="h-4 w-4" />
            Genre Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top8Genres}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) =>
                  entry.genre
                    ? `${entry.genre} (${entry.percentage.toFixed(0)}%)`
                    : ""
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="count"
              >
                {top8Genres.map((entry, index) => (
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
                    props.payload.genre,
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
            <Music className="h-4 w-4" />
            All Genres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {genreData.map((genre, index) => (
              <Badge
                key={genre.genre}
                variant="secondary"
                className="text-sm px-3 py-1.5"
                style={{
                  backgroundColor:
                    index < 8
                      ? `${COLORS[index % COLORS.length]}20`
                      : undefined,
                  borderColor:
                    index < 8 ? COLORS[index % COLORS.length] : undefined,
                }}
              >
                {genre.genre} ({genre.count})
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disc, Music, User } from "lucide-react";

interface Track {
  album?: string;
  artist?: string;
  artworkURL?: string;
  year?: number;
  title?: string;
}

interface AlbumAnalyticsProps {
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

export default function AlbumAnalytics({ tracks }: AlbumAnalyticsProps) {
  const albumStats: Record<
    string,
    {
      count: number;
      artist: string;
      artworkURL?: string;
      year?: number;
      songs: Set<string>;
    }
  > = {};

  tracks.forEach((track) => {
    if (!track.album) return;

    if (!albumStats[track.album]) {
      albumStats[track.album] = {
        count: 0,
        artist: track.artist || "Unknown Artist",
        artworkURL: track.artworkURL,
        year: track.year,
        songs: new Set(),
      };
    }

    albumStats[track.album].count++;
    if (track.title) albumStats[track.album].songs.add(track.title);
    if (!albumStats[track.album].artworkURL && track.artworkURL) {
      albumStats[track.album].artworkURL = track.artworkURL;
    }
  });

  const topAlbums = Object.entries(albumStats)
    .map(([album, stats]) => ({
      album,
      count: stats.count,
      artist: stats.artist,
      artworkURL: stats.artworkURL,
      year: stats.year,
      uniqueSongs: stats.songs.size,
      percentage: (stats.count / tracks.filter((t) => t.album).length) * 100,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 24);

  if (topAlbums.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center">
            <Disc className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No album information available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
          <Disc className="h-4 w-4" />
          Most Played Albums
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {topAlbums.map((album, index) => (
            <div
              key={album.album}
              className="group relative rounded-lg overflow-hidden bg-secondary/30 hover:bg-secondary/50 transition-all hover:shadow-lg"
            >
              <div className="aspect-square relative">
                {album.artworkURL ? (
                  <img
                    src={album.artworkURL}
                    alt={album.album}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "hidden",
                      );
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full bg-primary/10 flex items-center justify-center ${album.artworkURL ? "hidden" : ""}`}
                >
                  <Disc className="h-20 w-20 text-primary opacity-50" />
                </div>

                <div
                  className="absolute top-2 left-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                >
                  {index + 1}
                </div>

                <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-semibold text-white">
                  {album.count} plays
                </div>
              </div>

              <div className="p-3">
                <h3 className="font-semibold text-sm truncate mb-1">
                  {album.album}
                </h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <User className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{album.artist}</span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {album.year && (
                      <Badge variant="outline" className="text-xs">
                        {album.year}
                      </Badge>
                    )}
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Music className="h-3 w-3" />
                      {album.uniqueSongs}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {album.percentage.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full bg-secondary rounded-full h-1 mt-2">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: `${album.percentage}%`,
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
  );
}

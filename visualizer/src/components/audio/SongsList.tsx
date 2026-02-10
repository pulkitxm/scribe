"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Music,
  Search,
  Play,
  Star,
  Hash,
  Calendar,
  User,
  Disc,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Track {
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
}

interface SongsListProps {
  tracks: Track[];
}

export default function SongsList({ tracks }: SongsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "recent" | "title" | "artist" | "playCount"
  >("recent");
  const [filterApp, setFilterApp] = useState<string>("all");

  const apps = ["all", ...new Set(tracks.map((t) => t.app))];

  const uniqueTracksMap = new Map<string, Track>();

  tracks.forEach((track) => {
    const key = `${track.title?.toLowerCase() || "unknown"}-${track.artist?.toLowerCase() || "unknown"}`;

    if (!uniqueTracksMap.has(key)) {
      uniqueTracksMap.set(key, track);
    } else {
      const existing = uniqueTracksMap.get(key)!;
      const existingScore =
        (existing.rating || 0) +
        (existing.playCount || 0) +
        (existing.year ? 1 : 0);
      const newScore =
        (track.rating || 0) + (track.playCount || 0) + (track.year ? 1 : 0);

      if (
        newScore > existingScore ||
        new Date(track.timestamp) > new Date(existing.timestamp)
      ) {
        uniqueTracksMap.set(key, track);
      }
    }
  });

  const uniqueTracks = Array.from(uniqueTracksMap.values());

  let filteredTracks = uniqueTracks.filter((track) => {
    const matchesSearch =
      !searchQuery ||
      track.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.album?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesApp = filterApp === "all" || track.app === filterApp;

    return matchesSearch && matchesApp;
  });

  filteredTracks = [...filteredTracks].sort((a, b) => {
    switch (sortBy) {
      case "title":
        return (a.title || "").localeCompare(b.title || "");
      case "artist":
        return (a.artist || "").localeCompare(b.artist || "");
      case "playCount":
        return (b.playCount || 0) - (a.playCount || 0);
      case "recent":
      default:
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
            <Music className="h-4 w-4" />
            Unique Sonas ({filteredTracks.length} unique tracks)
          </CardTitle>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search songs, artists, albums..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={filterApp} onValueChange={setFilterApp}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="All Apps" />
              </SelectTrigger>
              <SelectContent>
                {apps.map((app) => (
                  <SelectItem key={app} value={app}>
                    {app === "all" ? "All Apps" : app}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="artist">Artist</SelectItem>
                <SelectItem value="playCount">Play Count</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          {filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No songs found matching your criteria</p>
            </div>
          ) : (
            filteredTracks.map((track, index) => (
              <div
                key={`${track.timestamp}-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors border border-transparent hover:border-border"
              >
                <div className="flex-shrink-0">
                  {track.artworkURL ? (
                    <img
                      src={track.artworkURL}
                      alt={track.title || "Album art"}
                      className="w-16 h-16 rounded object-cover shadow-md"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.nextElementSibling?.classList.remove(
                          "hidden",
                        );
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-16 h-16 rounded bg-primary/10 flex items-center justify-center ${track.artworkURL ? "hidden" : ""}`}
                  >
                    <Music className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base truncate">
                          {track.title || "Unknown Track"}
                        </h3>
                        {track.year && (
                          <Badge
                            variant="outline"
                            className="text-xs flex-shrink-0"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {track.year}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        {track.artist && (
                          <span className="flex items-center gap-1 truncate">
                            <User className="h-3 w-3 flex-shrink-0" />
                            {track.artist}
                          </span>
                        )}
                        {track.artist && track.album && (
                          <span className="flex-shrink-0">•</span>
                        )}
                        {track.album && (
                          <span className="flex items-center gap-1 truncate">
                            <Disc className="h-3 w-3 flex-shrink-0" />
                            {track.album}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          {track.app}
                        </Badge>

                        {track.genre && (
                          <Badge variant="outline" className="text-xs">
                            {track.genre}
                          </Badge>
                        )}

                        {track.trackNumber && (
                          <Badge variant="outline" className="text-xs">
                            <Hash className="h-3 w-3 mr-1" />
                            {track.trackNumber}
                          </Badge>
                        )}

                        {track.duration && (
                          <span className="text-xs text-muted-foreground">
                            {formatTime(track.duration)}
                          </span>
                        )}

                        {track.rating !== undefined && track.rating > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {track.rating}/100
                          </span>
                        )}

                        {track.playCount !== undefined &&
                          track.playCount > 0 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Play className="h-3 w-3" />
                              {track.playCount} plays
                            </span>
                          )}
                      </div>

                      {(track.composer || track.albumArtist) && (
                        <div className="text-xs text-muted-foreground mt-1 truncate">
                          {track.composer && (
                            <span>Composer: {track.composer}</span>
                          )}
                          {track.composer && track.albumArtist && (
                            <span> • </span>
                          )}
                          {track.albumArtist &&
                            track.albumArtist !== track.artist && (
                              <span>Album Artist: {track.albumArtist}</span>
                            )}
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-muted-foreground whitespace-nowrap flex-shrink-0">
                      {new Date(track.timestamp).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(time: number): string {
  const seconds = time > 10000 ? time / 1000 : time;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

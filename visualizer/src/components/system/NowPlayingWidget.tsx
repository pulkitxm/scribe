"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Pause } from "lucide-react";

interface NowPlayingWidgetProps {
  track?: {
    app: string;
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    currentTime?: number;
    isPlaying?: boolean;
    genre?: string;
    year?: number;
    artworkURL?: string;
  };
}

export default function NowPlayingWidget({ track }: NowPlayingWidgetProps) {
  if (!track || !track.title) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
            <Music className="h-4 w-4" />
            Now Playing
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32 text-muted-foreground">
          No audio currently playing
        </CardContent>
      </Card>
    );
  }

  const durationInSeconds = track.duration
    ? track.duration > 10000
      ? track.duration / 1000
      : track.duration
    : 0;

  const progress =
    durationInSeconds && track.currentTime
      ? (track.currentTime / durationInSeconds) * 100
      : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
          <Music className="h-4 w-4" />
          Now Playing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            {track.artworkURL ? (
              <img
                src={track.artworkURL}
                alt={track.title}
                className="w-20 h-20 rounded-lg object-cover shadow-lg"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling?.classList.remove(
                    "hidden",
                  );
                }}
              />
            ) : null}
            <div
              className={`w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center ${track.artworkURL ? "hidden" : ""}`}
            >
              <Music className="h-10 w-10 text-primary" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/gallery?songTitle=${encodeURIComponent(track.title)}`}
                  className="font-semibold text-base truncate hover:text-primary hover:underline transition-colors cursor-pointer block"
                >
                  {track.title}
                </Link>
                {track.artist && (
                  <Link
                    href={`/gallery?artist=${encodeURIComponent(track.artist)}`}
                    className="text-sm text-muted-foreground truncate hover:text-primary hover:underline transition-colors cursor-pointer block"
                  >
                    {track.artist}
                  </Link>
                )}
                {track.album && (
                  <Link
                    href={`/gallery?album=${encodeURIComponent(track.album)}`}
                    className="text-xs text-muted-foreground truncate hover:text-primary hover:underline transition-colors cursor-pointer block"
                  >
                    {track.album}
                    {track.year && ` (${track.year})`}
                  </Link>
                )}
              </div>
              <div className="flex items-center gap-1">
                {track.isPlaying ? (
                  <Play className="h-4 w-4 text-green-500" />
                ) : (
                  <Pause className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>

            {track.duration && track.currentTime && (
              <div className="space-y-1">
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatTime(track.currentTime)}</span>
                  <span>{formatTime(track.duration)}</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Link href={`/gallery?audioApp=${encodeURIComponent(track.app)}`}>
                <Badge
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                >
                  {track.app}
                </Badge>
              </Link>
              {track.genre && (
                <Link
                  href={`/gallery?genre=${encodeURIComponent(track.genre)}`}
                >
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {track.genre}
                  </Badge>
                </Link>
              )}
            </div>
          </div>
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

import Link from "next/link";
import {
  ChevronLeft,
  Music,
  TrendingUp,
  User,
  Disc,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllScreenshots, getAudioPlaybackStats } from "@/lib/data";
import AudioPlaybackChart from "@/components/system/AudioPlaybackChart";
import NowPlayingWidget from "@/components/system/NowPlayingWidget";
import SongsList from "@/components/audio/SongsList";
import ArtistAnalytics from "@/components/audio/ArtistAnalytics";
import AlbumAnalytics from "@/components/audio/AlbumAnalytics";

export const dynamic = "force-dynamic";

export default function AudioAnalyticsPage() {
  const screenshots = getAllScreenshots();
  const audioStats = getAudioPlaybackStats(screenshots);

  if (audioStats.stats.totalPlaybackSessions === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="cursor-pointer"
          >
            <Link href="/analytics">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Audio & Music Analytics
            </h1>
            <p className="text-muted-foreground">
              Track your listening habits, favorite artists, and music patterns
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No audio playback data available</p>
              <p className="text-sm mt-2">
                Play some music and let Scribe capture your listening habits
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const uniqueTracksMap = new Map<
    string,
    (typeof audioStats.nowPlayingHistory)[0]
  >();
  audioStats.nowPlayingHistory.forEach((track) => {
    const key = `${track.title?.toLowerCase() || "unknown"}-${track.artist?.toLowerCase() || "unknown"}`;
    if (!uniqueTracksMap.has(key)) {
      uniqueTracksMap.set(key, track);
    }
  });
  const uniqueTracksCount = uniqueTracksMap.size;

  const totalListeningTime = audioStats.stats.totalPlaybackSessions * 30;
  const avgTrackDuration =
    audioStats.nowPlayingHistory.length > 0
      ? totalListeningTime / audioStats.nowPlayingHistory.length
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Button variant="ghost" size="icon" asChild className="cursor-pointer">
          <Link href="/analytics">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Audio & Music Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your listening habits, favorite artists, and music patterns
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Music className="h-4 w-4" /> Unique Tracks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {uniqueTracksCount}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Unique songs
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" /> Artists
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {
                new Set(
                  audioStats.nowPlayingHistory
                    .map((t) => t.artist)
                    .filter(Boolean),
                ).size
              }
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Unique artists
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Disc className="h-4 w-4" /> Albums
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {
                new Set(
                  audioStats.nowPlayingHistory
                    .map((t) => t.album)
                    .filter(Boolean),
                ).size
              }
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Unique albums
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Listening Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {Math.round(totalListeningTime / 3600)}h
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Total hours
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Apps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {audioStats.stats.totalUniqueApps}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Audio apps used
            </div>
          </CardContent>
        </Card>
      </div>

      {audioStats.nowPlayingHistory.length > 0 && (
        <NowPlayingWidget track={audioStats.nowPlayingHistory[0]} />
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Playback Activity
        </h2>
        <AudioPlaybackChart data={audioStats} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Top Artists
        </h2>
        <ArtistAnalytics tracks={audioStats.nowPlayingHistory} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Disc className="h-5 w-5 text-primary" />
          Top Albums
        </h2>
        <AlbumAnalytics tracks={audioStats.nowPlayingHistory} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Unique Songs
        </h2>
        <SongsList tracks={audioStats.nowPlayingHistory} />
      </section>
    </div>
  );
}

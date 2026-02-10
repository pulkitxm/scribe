"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Code,
  Monitor,
  Cpu,
  Volume2,
  Wifi,
  Battery,
  FileText,
  GraduationCap,
  MessageSquare,
  Gamepad,
  ZoomIn,
  Video,
  Activity,
  FileJson,
  MapPin,
  Music,
  Play,
  User,
  Disc,
  Star,
  Hash,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CategoryLink,
  TagLink,
  ProjectLink,
  AppLink,
  TextLink,
} from "@/components/SmartLinks";
import { Screenshot } from "@/types/screenshot";
import { JsonViewerModal } from "@/components/JsonViewerModal";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  screenshot: Screenshot;
  prevScreenshot: { date: string; id: string } | null;
  nextScreenshot: { date: string; id: string } | null;
}

export default function ScreenshotDetailView({
  screenshot,
  prevScreenshot,
  nextScreenshot,
}: Props) {
  const [showJson, setShowJson] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { data } = screenshot;

  const timestamp = data.timestamp
    ? new Date(data.timestamp.unix_ms).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
    : new Date(screenshot.timestamp).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

  const displaySummary = data.summary?.one_liner || data.short_description;

  return (
    <div className="space-y-6">
      <JsonViewerModal
        data={data}
        isOpen={showJson}
        onOpenChange={setShowJson}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="cursor-pointer">
            <Link href="/gallery">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Gallery
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {timestamp}
            </h1>
            <p className="text-sm text-muted-foreground">{displaySummary}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowJson(true)}
            className="mr-2"
          >
            <Code className="w-4 h-4 mr-2" />
            View JSON
          </Button>
          {prevScreenshot ? (
            <Button
              variant="outline"
              size="icon"
              asChild
              className="cursor-pointer"
            >
              <Link
                href={`/gallery/${prevScreenshot.date}/${prevScreenshot.id}`}
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="icon" disabled>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {nextScreenshot ? (
            <Button
              variant="outline"
              size="icon"
              asChild
              className="cursor-pointer"
            >
              <Link
                href={`/gallery/${nextScreenshot.date}/${nextScreenshot.id}`}
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="icon" disabled>
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="p-0 relative group">
              <div
                className="cursor-zoom-in relative"
                onClick={() => setLightboxOpen(true)}
              >
                <Image
                  src={screenshot.imagePath}
                  alt={data.short_description}
                  width={1200}
                  height={675}
                  className="w-full h-auto rounded-lg"
                  priority
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-black/50 backdrop-blur-sm rounded-full p-3">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Lightbox
            open={lightboxOpen}
            close={() => setLightboxOpen(false)}
            slides={[
              {
                src: screenshot.imagePath,
                alt: data.short_description,
              },
            ]}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground leading-relaxed">
                {data.detailed_analysis}
              </p>
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  Intent
                </div>
                <p className="text-sm text-foreground">
                  {data.context.intent_guess}
                </p>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="system" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="context">Context</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
            </TabsList>
            <TabsContent value="system" className="mt-4">
              <SystemMetadataView data={data} />
            </TabsContent>
            <TabsContent value="context" className="mt-4">
              <ContextView data={data} />
            </TabsContent>
            <TabsContent value="evidence" className="mt-4">
              <EvidenceView data={data} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <div className="sticky top-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Productivity Scores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {data.scores.focus_score}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-1">
                      Focus
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {data.scores.productivity_score}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-1">
                      Productivity
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {data.scores.distraction_risk}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase mt-1">
                      Distraction
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      Overall Activity
                    </span>
                    <span className="font-medium">
                      {data.overall_activity_score}
                    </span>
                  </div>
                  <Progress
                    value={data.overall_activity_score}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <CategoryLink category={data.category} />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Workspace</span>
                  <Link
                    href={`/analytics/workspaces/${encodeURIComponent(data.workspace_type)}`}
                    className="hover:underline text-foreground decoration-primary underline-offset-4"
                  >
                    {data.workspace_type}
                  </Link>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="text-foreground">
                    {Math.round(data.confidence * 100)}%
                  </span>
                </div>
                {data.location && (
                  <div className="flex justify-between items-center text-sm pt-3 border-t">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> Location
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${data.location.latitude},${data.location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-foreground decoration-primary underline-offset-4 truncate max-w-[180px] text-right"
                      title={`${data.location.latitude}, ${data.location.longitude}`}
                    >
                      {data.location.name ||
                        `${data.location.latitude.toFixed(4)}, ${data.location.longitude.toFixed(4)}`}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {data.location && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {data.location.name && (
                    <p className="text-sm font-medium text-foreground">
                      {data.location.name}
                    </p>
                  )}
                  <div className="rounded-lg overflow-hidden border border-border mt-2">
                    <iframe
                      title="Location map"
                      src={`https://www.google.com/maps?q=${data.location.latitude},${data.location.longitude}&z=15&output=embed`}
                      width="100%"
                      height="200"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full block"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {(data.summary_tags || []).map((tag, i) => (
                    <TagLink key={i} tag={tag} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemMetadataView({ data }: { data: Screenshot["data"] }) {
  if (!data.system_metadata) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Cpu className="h-4 w-4" /> Hardware Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">CPU Usage</span>
              <span>{Math.round(data.system_metadata.stats.cpu.used)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RAM Usage</span>
              <span>
                {Math.round(
                  data.system_metadata.stats.ram.used / 1024 / 1024 / 1024,
                )}
                GB /
                {Math.round(
                  data.system_metadata.stats.ram.total / 1024 / 1024 / 1024,
                )}
                GB
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Battery</span>
              <span
                className={
                  data.system_metadata.stats.battery.isPlugged
                    ? "text-green-500"
                    : ""
                }
              >
                {Math.round(data.system_metadata.stats.battery.percentage)}%
                {data.system_metadata.stats.battery.isPlugged && " ⚡"}
              </span>
            </div>
            {data.system_metadata.stats.storage && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage</span>
                <span>
                  {Math.round(
                    data.system_metadata.stats.storage.used /
                      1024 /
                      1024 /
                      1024,
                  )}
                  GB /
                  {Math.round(
                    data.system_metadata.stats.storage.total /
                      1024 /
                      1024 /
                      1024,
                  )}
                  GB
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wifi className="h-4 w-4" /> Network & Connectivity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={
                  data.system_metadata.stats.network.connected
                    ? "text-green-500"
                    : "text-destructive"
                }
              >
                {data.system_metadata.stats.network.connected
                  ? "Online"
                  : "Offline"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span>{data.system_metadata.stats.network.type}</span>
            </div>
            {data.system_metadata.stats.network.ssid && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SSID</span>
                <span>{data.system_metadata.stats.network.ssid}</span>
              </div>
            )}
            {data.system_metadata.stats.network.local_ip && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-mono text-xs">
                  {data.system_metadata.stats.network.local_ip}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signal</span>
              <span>{data.system_metadata.stats.network.signal_strength}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Volume2 className="h-4 w-4" /> Audio Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volume</span>
              <span>
                {data.system_metadata.audio.is_muted
                  ? "Muted"
                  : `${Math.round(data.system_metadata.audio.volume)}%`}
              </span>
            </div>
            {data.system_metadata.audio.inputs &&
              data.system_metadata.audio.inputs.length > 0 && (
                <div className="space-y-1 pt-2 border-t">
                  <span className="text-muted-foreground text-xs uppercase">
                    Input Devices
                  </span>
                  {data.system_metadata.audio.inputs.map((dev, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate max-w-[200px]" title={dev.name}>
                        {dev.name}
                      </span>
                      {dev.is_default && (
                        <Badge variant="secondary" className="text-[10px] h-4">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </CardContent>
        </Card>

        {data.system_metadata.audio?.playback &&
          (data.system_metadata.audio.playback.has_active_audio ||
            data.system_metadata.audio.playback.now_playing?.length > 0) && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Music className="h-4 w-4" /> Now Playing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <Badge
                    variant={
                      data.system_metadata.audio.playback.has_active_audio
                        ? "default"
                        : "secondary"
                    }
                  >
                    {data.system_metadata.audio.playback.has_active_audio
                      ? "🎵 Playing"
                      : "⏸️ Paused"}
                  </Badge>
                  {data.system_metadata.audio.playback.playing_apps &&
                    data.system_metadata.audio.playback.playing_apps.length >
                      0 && (
                      <span className="text-muted-foreground">
                        via{" "}
                        {data.system_metadata.audio.playback.playing_apps.join(
                          ", ",
                        )}
                      </span>
                    )}
                </div>

                {data.system_metadata.audio.playback.now_playing?.map(
                  (track, i) => (
                    <div
                      key={i}
                      className="flex gap-3 p-3 rounded-lg bg-secondary/30"
                    >
                      <div className="flex-shrink-0">
                        {track.artwork_url ? (
                          <img
                            src={track.artwork_url}
                            alt={track.title || "Album art"}
                            className="w-20 h-20 rounded object-cover shadow-md"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove(
                                "hidden",
                              );
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-20 h-20 rounded bg-primary/10 flex items-center justify-center ${track.artwork_url ? "hidden" : ""}`}
                        >
                          <Music className="h-10 w-10 text-primary" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {track.title ? (
                            <Link
                              href={`/gallery?songTitle=${encodeURIComponent(track.title)}`}
                              className="font-semibold text-base truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                            >
                              {track.title}
                            </Link>
                          ) : (
                            <h3 className="font-semibold text-base truncate">
                              Unknown Track
                            </h3>
                          )}
                          {track.is_playing && (
                            <Play className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>

                        {(track.artist || track.album) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            {track.artist && (
                              <Link
                                href={`/gallery?artist=${encodeURIComponent(track.artist)}`}
                                className="flex items-center gap-1 truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                              >
                                <User className="h-3 w-3 flex-shrink-0" />
                                {track.artist}
                              </Link>
                            )}
                            {track.artist && track.album && <span>•</span>}
                            {track.album && (
                              <Link
                                href={`/gallery?album=${encodeURIComponent(track.album)}`}
                                className="flex items-center gap-1 truncate hover:text-primary hover:underline transition-colors cursor-pointer"
                              >
                                <Disc className="h-3 w-3 flex-shrink-0" />
                                {track.album}
                              </Link>
                            )}
                          </div>
                        )}

                        {track.duration && track.current_time && (
                          <div className="space-y-1 mb-2">
                            <div className="w-full bg-secondary rounded-full h-1.5">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${(track.current_time / (track.duration > 10000 ? track.duration / 1000 : track.duration)) * 100}%`,
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{formatTime(track.current_time)}</span>
                              <span>{formatTime(track.duration)}</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/gallery?audioApp=${encodeURIComponent(track.app)}`}
                          >
                            <Badge
                              variant="secondary"
                              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            >
                              {track.app}
                            </Badge>
                          </Link>
                          {track.genre && (
                            <Link
                              href={`/gallery?genre=${encodeURIComponent(track.genre)}`}
                            >
                              <Badge
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
                              >
                                {track.genre}
                              </Badge>
                            </Link>
                          )}
                          {track.year && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {track.year}
                            </Badge>
                          )}
                          {track.track_number && (
                            <Badge variant="outline" className="text-xs">
                              <Hash className="h-3 w-3 mr-1" />
                              {track.track_number}
                            </Badge>
                          )}
                          {track.rating !== undefined && track.rating > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                              {track.rating}/100
                            </Badge>
                          )}
                          {track.play_count !== undefined &&
                            track.play_count > 0 && (
                              <Badge variant="outline" className="text-xs">
                                <Play className="h-3 w-3 mr-1" />
                                {track.play_count} plays
                              </Badge>
                            )}
                        </div>

                        {(track.composer || track.album_artist) && (
                          <div className="text-xs text-muted-foreground mt-2 truncate">
                            {track.composer && (
                              <span>Composer: {track.composer}</span>
                            )}
                            {track.composer && track.album_artist && (
                              <span> • </span>
                            )}
                            {track.album_artist &&
                              track.album_artist !== track.artist && (
                                <span>Album Artist: {track.album_artist}</span>
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          )}

        {data.system_metadata.video?.sources &&
          data.system_metadata.video.sources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Video className="h-4 w-4" /> Video Devices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.system_metadata.video.sources.map((dev, i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-1 pb-2 border-b last:border-0 last:pb-0"
                  >
                    <div className="flex justify-between items-start">
                      <span
                        className="font-medium truncate max-w-[200px]"
                        title={dev.name}
                      >
                        {dev.name}
                      </span>
                      {dev.is_connected && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-green-500 text-green-500"
                        >
                          Connected
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Monitor className="h-4 w-4" /> Display Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active App</span>
              <span
                className="font-medium truncate max-w-[150px]"
                title={data.system_metadata.active_app}
              >
                {data.system_metadata.active_app}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Theme</span>
              <span>
                {data.system_metadata.stats.display.dark_mode
                  ? "Dark Mode"
                  : "Light Mode"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Brightness</span>
              <span>{data.system_metadata.stats.display.brightness}%</span>
            </div>
            {data.system_metadata.stats.display.external_displays.length >
              0 && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground text-xs uppercase block mb-1">
                  External Displays
                </span>
                <ul className="list-disc list-inside text-xs">
                  {data.system_metadata.stats.display.external_displays.map(
                    (disp, i) => (
                      <li key={i}>
                        {disp.name} ({disp.width}x{disp.height})
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ContextView({ data }: { data: Screenshot["data"] }) {
  return (
    <div className="space-y-6">
      {(data.context.learning_context?.learning_topic ||
        data.context.communication_context?.communication_type ||
        data.context.entertainment_context?.entertainment_type) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Rich Context
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.context.learning_context?.learning_topic && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <GraduationCap className="h-4 w-4" /> Learning
                </div>
                <div className="text-sm">
                  {data.context.learning_context.learning_topic}
                </div>
                {data.context.learning_context.source_type && (
                  <div className="text-xs text-muted-foreground">
                    Source: {data.context.learning_context.source_type}
                  </div>
                )}
              </div>
            )}
            {data.context.communication_context?.communication_type && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <MessageSquare className="h-4 w-4" /> Communication
                </div>
                <div className="text-sm">
                  {data.context.communication_context.communication_type}
                  {data.context.communication_context.meeting_indicator && (
                    <Badge
                      variant="destructive"
                      className="ml-2 text-[10px] h-4"
                    >
                      Meeting
                    </Badge>
                  )}
                </div>
              </div>
            )}
            {data.context.entertainment_context?.entertainment_type && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 font-semibold text-sm">
                  <Gamepad className="h-4 w-4" /> Entertainment
                </div>
                <div className="text-sm">
                  {data.context.entertainment_context.entertainment_type}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data.context.code_context?.language && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Code className="h-4 w-4" /> Coding Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Language</span>
              <div className="block">
                <Link
                  href={`/analytics/languages/${encodeURIComponent(data.context.code_context.language)}`}
                >
                  <Badge
                    variant="outline"
                    className="hover:bg-accent cursor-pointer"
                  >
                    {data.context.code_context.language}
                  </Badge>
                </Link>
              </div>
            </div>
            {data.context.code_context.repo_or_project && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Project / Repo
                </span>
                <div className="text-sm font-mono truncate">
                  {data.context.code_context.repo_or_project}
                </div>
              </div>
            )}
            {data.context.code_context.files_or_modules &&
              data.context.code_context.files_or_modules.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Files</span>
                  <div className="max-h-[100px] overflow-y-auto space-y-1">
                    {data.context.code_context.files_or_modules.map((f, i) => (
                      <div
                        key={i}
                        className="text-xs font-mono break-all text-muted-foreground"
                      >
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Visible Apps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {(data.evidence?.apps_visible || []).map((app, i) => (
              <AppLink key={i} app={app}>
                <Badge
                  variant="secondary"
                  className="text-xs pointer-events-none hover:bg-secondary/80"
                >
                  {app}
                </Badge>
              </AppLink>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.evidence?.web_domains_visible &&
        data.evidence.web_domains_visible.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Web Domains
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {data.evidence.web_domains_visible.map((domain, i) => (
                  <Link
                    key={i}
                    href={`/analytics/domains/${encodeURIComponent(domain)}`}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant="outline"
                      className="text-xs hover:bg-accent hover:border-primary/50 transition-colors"
                    >
                      {domain}
                    </Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

function EvidenceView({ data }: { data: Screenshot["data"] }) {
  return (
    <div className="space-y-6">
      {data.actions_observed && data.actions_observed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Actions Observed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.actions_observed.map((action, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-foreground"
                >
                  <span className="text-muted-foreground">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.evidence?.text_snippets &&
        data.evidence.text_snippets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Text Snippets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.evidence.text_snippets.map((snippet, i) => (
                <TextLink
                  key={i}
                  text={snippet}
                  className="block px-3 py-2 bg-muted rounded text-xs font-mono break-all hover:bg-primary/10 hover:text-primary no-underline"
                />
              ))}
              {data.evidence.raw_text_content && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
                    <FileJson className="h-3 w-3" /> Raw Text Content
                  </div>
                  <div className="bg-muted/50 p-2 rounded text-[10px] font-mono whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                    {data.evidence.raw_text_content}
                  </div>
                </div>
              )}
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

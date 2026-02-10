"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface GalleryFiltersProps {
  dates: string[];
  categories: string[];
  tags: string[];
  apps?: string[];
  projects?: string[];
  languages?: string[];
  workspaces?: string[];
  domains?: string[];
  audioApps?: string[];
  artists?: string[];
  genres?: string[];
  albums?: string[];
  currentDate?: string;
  currentTag?: string;
  currentCategory?: string;
  currentTimeRange?: string;
  currentText?: string;
  currentApp?: string;
  currentProject?: string;
  currentLanguage?: string;
  currentWorkspace?: string;
  currentDomain?: string;
  currentMinFocus?: string;
  currentMaxFocus?: string;
  currentMinProductivity?: string;
  currentMaxDistraction?: string;
  currentTimeOfDay?: string;
  currentHasCode?: string;
  currentIsMeeting?: string;
  currentLowBattery?: string;
  currentHighCpu?: string;
  currentHasErrors?: string;
  currentNetwork?: string;
  currentLocationLat?: string;
  currentLocationLon?: string;
  currentHasAudio?: string;
  currentAudioApp?: string;
  currentArtist?: string;
  currentGenre?: string;
  currentSongTitle?: string;
  currentAlbum?: string;
}

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export default function GalleryFilters({
  dates,
  categories,
  tags,
  apps = [],
  projects = [],
  languages = [],
  workspaces = [],
  domains = [],
  audioApps = [],
  artists = [],
  genres = [],
  albums = [],
  currentDate,
  currentTag,
  currentCategory,
  currentTimeRange,
  currentText,
  currentApp,
  currentProject,
  currentLanguage,
  currentWorkspace,
  currentDomain,
  currentMinFocus,
  currentMaxFocus,
  currentMinProductivity,
  currentMaxDistraction,
  currentTimeOfDay,
  currentHasCode,
  currentIsMeeting,
  currentLowBattery,
  currentHighCpu,
  currentHasErrors,
  currentNetwork,
  currentLocationLat,
  currentLocationLon,
  currentHasAudio,
  currentAudioApp,
  currentArtist,
  currentGenre,
  currentSongTitle,
  currentAlbum,
}: GalleryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentText || "");
  const [locationLat, setLocationLat] = useState(currentLocationLat ?? "");
  const [locationLon, setLocationLon] = useState(currentLocationLon ?? "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [focusRange, setFocusRange] = useState<[number, number]>([
    currentMinFocus ? parseInt(currentMinFocus) : 0,
    currentMaxFocus ? parseInt(currentMaxFocus) : 100,
  ]);

  const updateSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("text", value);
      params.delete("page");
    } else {
      params.delete("text");
    }
    router.push(`/gallery?${params.toString()}`, { scroll: false });
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
      params.delete("page");
    } else {
      params.delete(key);
    }
    router.push(`/gallery?${params.toString()}`, { scroll: false });
  };

  const updateLocationFilter = (lat: string, lon: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (lat.trim() && lon.trim()) {
      params.set("locationLat", lat.trim());
      params.set("locationLon", lon.trim());
      params.delete("location");
    } else {
      params.delete("locationLat");
      params.delete("locationLon");
    }
    params.delete("page");
    router.push(`/gallery?${params.toString()}`, { scroll: false });
  };

  const updateToggleFilter = (key: string, checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (checked) {
      params.set(key, "true");
      params.delete("page");
    } else {
      params.delete(key);
    }
    router.push(`/gallery?${params.toString()}`, { scroll: false });
  };

  const updateFocusRange = (values: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (values[0] > 0) {
      params.set("minFocus", values[0].toString());
    } else {
      params.delete("minFocus");
    }
    if (values[1] < 100) {
      params.set("maxFocus", values[1].toString());
    } else {
      params.delete("maxFocus");
    }
    params.delete("page");
    router.push(`/gallery?${params.toString()}`, { scroll: false });
  };

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "locationLat" || key === "locationLon") {
      params.delete("locationLat");
      params.delete("locationLon");
      params.delete("location");
    } else {
      params.delete(key);
    }
    router.push(`/gallery?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    if (searchValue === (currentText || "")) return;

    const timer = setTimeout(() => {
      updateSearch(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, currentText]);

  useEffect(() => {
    setSearchValue(currentText || "");
  }, [currentText]);

  useEffect(() => {
    setLocationLat(currentLocationLat ?? "");
    setLocationLon(currentLocationLon ?? "");
  }, [currentLocationLat, currentLocationLon]);

  const clearFilters = () => {
    setSearchValue("");
    setLocationLat("");
    setLocationLon("");
    setFocusRange([0, 100]);
    router.push("/gallery", { scroll: false });
  };

  const getActiveFilters = (): ActiveFilter[] => {
    const filters: ActiveFilter[] = [];
    if (currentDate)
      filters.push({ key: "date", label: "Date", value: currentDate });
    if (currentTag)
      filters.push({ key: "tag", label: "Tag", value: currentTag });
    if (currentCategory)
      filters.push({
        key: "category",
        label: "Category",
        value: currentCategory,
      });
    if (currentTimeRange && currentTimeRange !== "all")
      filters.push({
        key: "timeRange",
        label: "Time",
        value: currentTimeRange,
      });
    if (currentText)
      filters.push({ key: "text", label: "Search", value: currentText });
    if (currentApp)
      filters.push({ key: "app", label: "App", value: currentApp });
    if (currentProject)
      filters.push({ key: "project", label: "Project", value: currentProject });
    if (currentLanguage)
      filters.push({
        key: "language",
        label: "Language",
        value: currentLanguage,
      });
    if (currentWorkspace)
      filters.push({
        key: "workspace",
        label: "Workspace",
        value: currentWorkspace,
      });
    if (currentDomain)
      filters.push({ key: "domain", label: "Domain", value: currentDomain });
    if (currentMinFocus)
      filters.push({
        key: "minFocus",
        label: "Min Focus",
        value: `≥${currentMinFocus}`,
      });
    if (currentMaxFocus)
      filters.push({
        key: "maxFocus",
        label: "Max Focus",
        value: `≤${currentMaxFocus}`,
      });
    if (currentMinProductivity)
      filters.push({
        key: "minProductivity",
        label: "Min Productivity",
        value: `≥${currentMinProductivity}`,
      });
    if (currentMaxDistraction)
      filters.push({
        key: "maxDistraction",
        label: "Max Distraction",
        value: `≤${currentMaxDistraction}`,
      });
    if (currentTimeOfDay)
      filters.push({
        key: "timeOfDay",
        label: "Time of Day",
        value: currentTimeOfDay,
      });
    if (currentHasCode === "true")
      filters.push({ key: "hasCode", label: "Has Code", value: "Yes" });
    if (currentIsMeeting === "true")
      filters.push({ key: "isMeeting", label: "Meeting", value: "Yes" });
    if (currentLowBattery === "true")
      filters.push({ key: "lowBattery", label: "Low Battery", value: "Yes" });
    if (currentHighCpu === "true")
      filters.push({ key: "highCpu", label: "High CPU", value: "Yes" });
    if (currentHasErrors === "true")
      filters.push({ key: "hasErrors", label: "Has Errors", value: "Yes" });
    if (currentNetwork)
      filters.push({ key: "network", label: "Network", value: currentNetwork });
    if (currentLocationLat && currentLocationLon)
      filters.push({
        key: "locationLat",
        label: "Location",
        value: `${currentLocationLat}, ${currentLocationLon}`,
      });
    if (currentHasAudio === "true")
      filters.push({ key: "hasAudio", label: "Playing Music", value: "Yes" });
    if (currentAudioApp)
      filters.push({
        key: "audioApp",
        label: "Audio App",
        value: currentAudioApp,
      });
    if (currentArtist)
      filters.push({ key: "artist", label: "Artist", value: currentArtist });
    if (currentGenre)
      filters.push({ key: "genre", label: "Genre", value: currentGenre });
    if (currentSongTitle)
      filters.push({
        key: "songTitle",
        label: "Song",
        value: currentSongTitle,
      });
    if (currentAlbum)
      filters.push({ key: "album", label: "Album", value: currentAlbum });
    return filters;
  };

  const activeFilters = getActiveFilters();
  const hasFilters = activeFilters.length > 0;
  const hasAdvancedFilters =
    currentMinFocus ||
    currentMaxFocus ||
    currentMinProductivity ||
    currentMaxDistraction ||
    currentTimeOfDay ||
    currentHasCode === "true" ||
    currentIsMeeting === "true" ||
    currentHasAudio === "true" ||
    currentLowBattery === "true" ||
    currentHighCpu === "true" ||
    currentHasErrors === "true" ||
    currentAudioApp ||
    currentArtist ||
    currentGenre ||
    currentSongTitle ||
    currentAlbum ||
    (currentLocationLat != null &&
      currentLocationLat !== "" &&
      currentLocationLon != null &&
      currentLocationLon !== "");

  useEffect(() => {
    if (hasAdvancedFilters) {
      setAdvancedOpen(true);
    }
  }, []);

  const selectTriggerClass =
    "h-9 min-w-0 cursor-pointer bg-background text-sm border border-input";

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-xl shadow-sm">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search screenshots..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-10 h-10 w-full rounded-lg border-input bg-muted/30 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-colors"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              updateSearch("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rounded p-1 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Quick filters
        </span>
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/50 px-3 py-2.5 border border-border/60">
          <Tabs
            value={currentTimeRange || "all"}
            onValueChange={(v) => updateFilter("timeRange", v)}
          >
            <TabsList className="h-9 rounded-full bg-background/80 p-0.5">
              <TabsTrigger
                value="all"
                className="cursor-pointer rounded-full text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="today"
                className="cursor-pointer rounded-full text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Today
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className="cursor-pointer rounded-full text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Week
              </TabsTrigger>
              <TabsTrigger
                value="month"
                className="cursor-pointer rounded-full text-xs px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Select
            value={currentDate || "all"}
            onValueChange={(v) => updateFilter("date", v)}
          >
            <SelectTrigger
              className={cn("w-[140px] h-9 rounded-lg", selectTriggerClass)}
            >
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {dates.map((date) => (
                <SelectItem key={date} value={date}>
                  {date}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentCategory || "all"}
            onValueChange={(v) => updateFilter("category", v)}
          >
            <SelectTrigger
              className={cn("w-[160px] h-9 rounded-lg", selectTriggerClass)}
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentApp || "all"}
            onValueChange={(v) => updateFilter("app", v)}
          >
            <SelectTrigger
              className={cn("w-[140px] h-9 rounded-lg", selectTriggerClass)}
            >
              <SelectValue placeholder="App" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              <SelectItem value="all">All Apps</SelectItem>
              {apps.map((app) => (
                <SelectItem key={app} value={app}>
                  {app}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentProject || "all"}
            onValueChange={(v) => updateFilter("project", v)}
          >
            <SelectTrigger
              className={cn("w-[140px] h-9 rounded-lg", selectTriggerClass)}
            >
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentTag || "all"}
            onValueChange={(v) => updateFilter("tag", v)}
          >
            <SelectTrigger
              className={cn("w-[140px] h-9 rounded-lg", selectTriggerClass)}
            >
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent className="max-h-[280px]">
              <SelectItem value="all">All Tags</SelectItem>
              {tags.slice(0, 50).map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="cursor-pointer text-muted-foreground hover:text-destructive ml-auto h-9 text-sm"
            >
              Clear all
            </Button>
          )}
        </div>
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 h-9 rounded-lg border-dashed"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Advanced filters
            {advancedOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {hasAdvancedFilters && (
              <Badge variant="secondary" className="ml-1 text-xs">
                Active
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4 border-l-4 border-l-primary/40">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Context
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select
                value={currentDomain || "all"}
                onValueChange={(v) => updateFilter("domain", v)}
              >
                <SelectTrigger
                  className={cn("h-9 w-full rounded-lg", selectTriggerClass)}
                >
                  <SelectValue placeholder="Domain" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="all">All Domains</SelectItem>
                  {domains.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currentLanguage || "all"}
                onValueChange={(v) => updateFilter("language", v)}
              >
                <SelectTrigger
                  className={cn("h-9 w-full rounded-lg", selectTriggerClass)}
                >
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="all">All Languages</SelectItem>
                  {languages.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currentWorkspace || "all"}
                onValueChange={(v) => updateFilter("workspace", v)}
              >
                <SelectTrigger
                  className={cn("h-9 w-full rounded-lg", selectTriggerClass)}
                >
                  <SelectValue placeholder="Workspace" />
                </SelectTrigger>
                <SelectContent className="max-h-[280px]">
                  <SelectItem value="all">All Workspaces</SelectItem>
                  {workspaces.map((w) => (
                    <SelectItem key={w} value={w}>
                      {w}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={currentTimeOfDay || "all"}
                onValueChange={(v) => updateFilter("timeOfDay", v)}
              >
                <SelectTrigger
                  className={cn("h-9 w-full rounded-lg", selectTriggerClass)}
                >
                  <SelectValue placeholder="Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Time</SelectItem>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="afternoon">Afternoon</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Focus score
              </p>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground tabular-nums w-16">
                  {focusRange[0]} – {focusRange[1]}
                </span>
                <Slider
                  value={focusRange}
                  onValueChange={(v) => setFocusRange(v as [number, number])}
                  onValueCommit={(v) => updateFocusRange(v)}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1 max-w-[280px]"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    key: "hasCode",
                    label: "Has Code",
                    icon: "💻",
                    value: currentHasCode,
                  },
                  {
                    key: "isMeeting",
                    label: "Meeting",
                    icon: "📹",
                    value: currentIsMeeting,
                  },
                  {
                    key: "hasAudio",
                    label: "Music",
                    icon: "🎵",
                    value: currentHasAudio,
                  },
                  {
                    key: "hasErrors",
                    label: "Errors",
                    icon: "🐛",
                    value: currentHasErrors,
                  },
                  {
                    key: "lowBattery",
                    label: "Low Battery",
                    icon: "🔋",
                    value: currentLowBattery,
                  },
                  {
                    key: "highCpu",
                    label: "High CPU",
                    icon: "🔥",
                    value: currentHighCpu,
                  },
                ].map(({ key, label, icon, value }) => {
                  const checked = value === "true";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateToggleFilter(key, !checked)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                        checked
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      <span>{icon}</span>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Location
              </p>
              <div className="flex items-center gap-3">
                <Input
                  type="text"
                  placeholder="Latitude"
                  value={locationLat}
                  onChange={(e) => setLocationLat(e.target.value)}
                  onBlur={() => updateLocationFilter(locationLat, locationLon)}
                  className="h-9 w-28 rounded-lg border-input bg-background text-sm"
                />
                <Input
                  type="text"
                  placeholder="Longitude"
                  value={locationLon}
                  onChange={(e) => setLocationLon(e.target.value)}
                  onBlur={() => updateLocationFilter(locationLat, locationLon)}
                  className="h-9 w-28 rounded-lg border-input bg-background text-sm"
                />
              </div>
            </div>

            {(audioApps.length > 0 ||
              artists.length > 0 ||
              genres.length > 0 ||
              albums.length > 0) && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  Music
                </p>
                <div className="flex flex-wrap gap-3">
                  {audioApps.length > 0 && (
                    <Select
                      value={currentAudioApp || "all"}
                      onValueChange={(v) => updateFilter("audioApp", v)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9 w-[140px] rounded-lg",
                          selectTriggerClass,
                        )}
                      >
                        <SelectValue placeholder="App" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        <SelectItem value="all">All Apps</SelectItem>
                        {audioApps.map((app) => (
                          <SelectItem key={app} value={app}>
                            {app}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {artists.length > 0 && (
                    <Select
                      value={currentArtist || "all"}
                      onValueChange={(v) => updateFilter("artist", v)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9 w-[140px] rounded-lg",
                          selectTriggerClass,
                        )}
                      >
                        <SelectValue placeholder="Artist" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        <SelectItem value="all">All Artists</SelectItem>
                        {artists.slice(0, 100).map((artist) => (
                          <SelectItem key={artist} value={artist}>
                            {artist}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {albums.length > 0 && (
                    <Select
                      value={currentAlbum || "all"}
                      onValueChange={(v) => updateFilter("album", v)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9 w-[140px] rounded-lg",
                          selectTriggerClass,
                        )}
                      >
                        <SelectValue placeholder="Album" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        <SelectItem value="all">All Albums</SelectItem>
                        {albums.slice(0, 100).map((album) => (
                          <SelectItem key={album} value={album}>
                            {album}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {genres.length > 0 && (
                    <Select
                      value={currentGenre || "all"}
                      onValueChange={(v) => updateFilter("genre", v)}
                    >
                      <SelectTrigger
                        className={cn(
                          "h-9 w-[140px] rounded-lg",
                          selectTriggerClass,
                        )}
                      >
                        <SelectValue placeholder="Genre" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        <SelectItem value="all">All Genres</SelectItem>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Active
          </span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1.5 cursor-pointer hover:bg-destructive/20 text-xs rounded-md py-1.5"
              onClick={() => removeFilter(filter.key)}
            >
              {filter.label}: {filter.value}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

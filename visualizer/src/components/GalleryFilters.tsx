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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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
}: GalleryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(currentText || "");
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
    params.delete(key);
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

  const clearFilters = () => {
    setSearchValue("");
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
    currentLowBattery === "true" ||
    currentHighCpu === "true" ||
    currentHasErrors === "true";

  useEffect(() => {
    if (hasAdvancedFilters) {
      setAdvancedOpen(true);
    }
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 bg-card border border-border rounded-lg shadow-sm">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search in screenshots (e.g. 'login page', 'errors', 'dashboard')..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-10 w-full bg-background/50 border-muted focus:ring-primary/20"
        />
        {searchValue && (
          <button
            onClick={() => {
              setSearchValue("");
              updateSearch("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">
            Time
          </span>
          <Tabs
            value={currentTimeRange || "all"}
            onValueChange={(v) => updateFilter("timeRange", v)}
          >
            <TabsList>
              <TabsTrigger value="all" className="cursor-pointer">
                All
              </TabsTrigger>
              <TabsTrigger value="today" className="cursor-pointer">
                Today
              </TabsTrigger>
              <TabsTrigger value="week" className="cursor-pointer">
                Week
              </TabsTrigger>
              <TabsTrigger value="month" className="cursor-pointer">
                Month
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Select
          value={currentDate || "all"}
          onValueChange={(v) => updateFilter("date", v)}
        >
          <SelectTrigger className="w-[140px] cursor-pointer bg-background/50">
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
          <SelectTrigger className="w-[150px] cursor-pointer bg-background/50">
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
          <SelectTrigger className="w-[150px] cursor-pointer bg-background/50">
            <SelectValue placeholder="App" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
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
          <SelectTrigger className="w-[150px] cursor-pointer bg-background/50">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
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
          <SelectTrigger className="w-[160px] cursor-pointer bg-background/50">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
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
            className="cursor-pointer text-muted-foreground hover:text-destructive whitespace-nowrap ml-auto"
          >
            Clear all
          </Button>
        )}
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Advanced Filters
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
        <CollapsibleContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              value={currentDomain || "all"}
              onValueChange={(v) => updateFilter("domain", v)}
            >
              <SelectTrigger className="cursor-pointer bg-background/50">
                <SelectValue placeholder="Domain" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
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
              <SelectTrigger className="cursor-pointer bg-background/50">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
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
              <SelectTrigger className="cursor-pointer bg-background/50">
                <SelectValue placeholder="Workspace" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
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
              <SelectTrigger className="cursor-pointer bg-background/50">
                <SelectValue placeholder="Time of Day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Time</SelectItem>
                <SelectItem value="morning">🌅 Morning (5am-12pm)</SelectItem>
                <SelectItem value="afternoon">
                  ☀️ Afternoon (12pm-5pm)
                </SelectItem>
                <SelectItem value="evening">🌆 Evening (5pm-9pm)</SelectItem>
                <SelectItem value="night">🌙 Night (9pm-5am)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Focus Score Range</span>
              <span className="text-sm text-muted-foreground">
                {focusRange[0]} - {focusRange[1]}
              </span>
            </div>
            <Slider
              value={focusRange}
              onValueChange={(v) => setFocusRange(v as [number, number])}
              onValueCommit={(v) => updateFocusRange(v)}
              min={0}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap gap-6 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasCode"
                checked={currentHasCode === "true"}
                onCheckedChange={(checked) =>
                  updateToggleFilter("hasCode", checked)
                }
              />
              <Label htmlFor="hasCode" className="text-sm cursor-pointer">
                💻 Has Code
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isMeeting"
                checked={currentIsMeeting === "true"}
                onCheckedChange={(checked) =>
                  updateToggleFilter("isMeeting", checked)
                }
              />
              <Label htmlFor="isMeeting" className="text-sm cursor-pointer">
                📹 Meeting
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="hasErrors"
                checked={currentHasErrors === "true"}
                onCheckedChange={(checked) =>
                  updateToggleFilter("hasErrors", checked)
                }
              />
              <Label htmlFor="hasErrors" className="text-sm cursor-pointer">
                🐛 Has Errors
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="lowBattery"
                checked={currentLowBattery === "true"}
                onCheckedChange={(checked) =>
                  updateToggleFilter("lowBattery", checked)
                }
              />
              <Label htmlFor="lowBattery" className="text-sm cursor-pointer">
                🔋 Low Battery
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="highCpu"
                checked={currentHighCpu === "true"}
                onCheckedChange={(checked) =>
                  updateToggleFilter("highCpu", checked)
                }
              />
              <Label htmlFor="highCpu" className="text-sm cursor-pointer">
                🔥 High CPU
              </Label>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground uppercase tracking-wide self-center mr-2">
            Active:
          </span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.key}
              variant="secondary"
              className="gap-1 cursor-pointer hover:bg-destructive/20"
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

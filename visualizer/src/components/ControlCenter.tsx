"use client";

import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Activity,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { HelperStats } from "@/lib/control";

export default function ControlCenter({
  initialStats,
}: {
  initialStats?: HelperStats;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<HelperStats>(
    initialStats || {
      status: "loading",
      uptime: "0s",
      successCount: 0,
      errorCount: 0,
    },
  );

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/control");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleService = async () => {
    setIsLoading(true);
    const action = stats.status === "running" ? "stop" : "start";
    try {
      await fetch("/api/control", {
        method: "POST",
        body: JSON.stringify({ command: action }),
      });

      setTimeout(fetchStats, 1500);
    } catch (error) {
      console.error("Failed to toggle service", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isRunning = stats.status === "running";

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setIsOpen(!isOpen)}
        title="Control Center"
      >
        {isRunning ? (
          <Pause className="h-5 w-5 text-green-500" />
        ) : (
          <Play className="h-5 w-5 text-red-500" />
        )}
        <span className="sr-only">Control Center</span>
      </Button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-md border border-border bg-popover p-4 shadow-md z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 text-popover-foreground">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold leading-none">Scribe Control</h4>
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  isRunning ? "bg-green-500" : "bg-red-500",
                )}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Activity className="h-4 w-4" /> Uptime
                </span>
                <span className="font-mono">{stats.uptime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" /> Processed
                </span>
                <span className="font-mono">{stats.successCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <AlertCircle className="h-4 w-4" /> Errors
                </span>
                <span className="font-mono text-xs">{stats.errorCount}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant={isRunning ? "destructive" : "default"}
                className="w-full"
                onClick={toggleService}
                disabled={isLoading}
              >
                {isLoading && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isRunning ? "Stop Service" : "Start Service"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

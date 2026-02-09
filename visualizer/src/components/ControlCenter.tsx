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

  /* Analysis State */
  const [analysisStats, setAnalysisStats] = useState({
    status: "stopped",
    processed: 0,
    total: 0,
    success: 0,
    failed: 0,
  });
  const [confirmAction, setConfirmAction] = useState<{
    type: "restart" | "delete";
    isOpen: boolean;
  } | null>(null);
  const [resetLogs, setResetLogs] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/control");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchAnalysisStats = async () => {
    try {
      const res = await fetch("/api/analysis/status");
      const data = await res.json();
      setAnalysisStats(data);
    } catch (error) {
      console.error("Failed to fetch analysis stats", error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAnalysisStats();
    const interval = setInterval(() => {
      fetchStats();
      fetchAnalysisStats();
    }, 5000);
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

  const handleAnalysisControl = async (
    command: string,
    shouldResetLogs = false,
  ) => {
    setIsLoading(true);
    try {
      await fetch("/api/analysis/control", {
        method: "POST",
        body: JSON.stringify({ command, resetLogs: shouldResetLogs }),
      });
      setTimeout(fetchAnalysisStats, 2000);
    } catch (error) {
      console.error("Failed to control analysis", error);
    } finally {
      setIsLoading(false);
      setConfirmAction(null);
      setResetLogs(false);
    }
  };

  const isRunning = stats.status === "running";
  const isAnalysisRunning =
    analysisStats.status === "online" || analysisStats.status === "launching";

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
        <div className="absolute left-0 top-full mt-2 w-80 rounded-md border border-border bg-popover p-4 shadow-md z-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 text-popover-foreground max-h-[80vh] overflow-y-auto">
          {/* Main Service Control */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold leading-none">Scribe Service</h4>
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
                size="sm"
              >
                {isLoading && (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isRunning ? "Stop Service" : "Start Service"}
              </Button>
            </div>
          </div>

          <div className="h-px bg-border my-4" />

          {/* Analysis Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold leading-none">AI Analysis</h4>
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground uppercase">
                  {analysisStats.status}
                </span>
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isAnalysisRunning ? "bg-green-500" : "bg-zinc-500",
                  )}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-mono">
                  {analysisStats.processed} / {analysisStats.total}
                  <span className="text-xs text-muted-foreground ml-1">
                    (
                    {Math.max(0, analysisStats.total - analysisStats.processed)}{" "}
                    left)
                  </span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-green-500">
                  Success
                </span>
                <span className="font-mono text-green-500">
                  {analysisStats.success}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground text-red-500">
                  Failed
                </span>
                <span className="font-mono text-red-500">
                  {analysisStats.failed}
                </span>
              </div>
            </div>

            {/* Confirm Action View */}
            {confirmAction?.isOpen ? (
              <div className="bg-muted p-2 rounded text-sm space-y-2">
                <p className="font-medium">Confirm {confirmAction.type}?</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetLogs}
                    onChange={(e) => setResetLogs(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span>Reset Logs (Permanent)</span>
                </label>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 h-7"
                    onClick={() =>
                      handleAnalysisControl(confirmAction.type, resetLogs)
                    }
                  >
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-7"
                    onClick={() => {
                      setConfirmAction(null);
                      setResetLogs(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                {!isAnalysisRunning ? (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => handleAnalysisControl("start")}
                    disabled={isLoading}
                    size="sm"
                  >
                    Start Analysis
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    onClick={() => handleAnalysisControl("stop")}
                    disabled={isLoading}
                    size="sm"
                  >
                    Stop Analysis
                  </Button>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() =>
                      setConfirmAction({ type: "restart", isOpen: true })
                    }
                    disabled={isLoading}
                    size="sm"
                  >
                    Restart
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1 hover:bg-red-100 hover:text-red-700"
                    onClick={() =>
                      setConfirmAction({ type: "delete", isOpen: true })
                    }
                    disabled={isLoading}
                    size="sm"
                  >
                    Delete
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  className="w-full h-8 text-xs text-muted-foreground"
                  onClick={() => window.open("/api/analysis/logs", "_blank")}
                >
                  Download Logs
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

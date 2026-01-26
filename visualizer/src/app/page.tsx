"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Filters, { FilterState } from "@/components/Filters";
import ScoreRing from "@/components/ScoreRing";
import AppsList from "@/components/AppsList";

const ProductivityChart = dynamic(() => import("@/components/ProductivityChart"), { ssr: false });
const CategoryChart = dynamic(() => import("@/components/CategoryChart"), { ssr: false });
const HourlyChart = dynamic(() => import("@/components/HourlyChart"), { ssr: false });

interface Stats {
  avgFocus: number;
  avgProductivity: number;
  avgDistraction: number;
  totalScreenshots: number;
  categories: Record<string, number>;
  apps: Record<string, number>;
  hourlyDistribution: Record<number, number>;
}

interface DailyStats {
  date: string;
  avgFocusScore: number;
  avgProductivityScore: number;
  avgDistraction: number;
  totalScreenshots: number;
}

interface ApiResponse {
  stats: Stats;
  aggregatedStats: DailyStats[];
  categories: string[];
  apps: string[];
  total: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "all",
    aggregation: "daily",
    category: "",
    app: "",
    minFocusScore: 0,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    const params = new URLSearchParams({
      statsOnly: "true",
      aggregation: filters.aggregation,
    });

    if (filters.dateRange !== "all") {
      const now = new Date();
      let startDate: Date;

      switch (filters.dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = now;
      }

      params.set("startDate", startDate.toISOString().split("T")[0]);
      params.set("endDate", now.toISOString().split("T")[0]);
    }

    if (filters.category) params.set("category", filters.category);
    if (filters.app) params.set("app", filters.app);
    if (filters.minFocusScore > 0) params.set("minFocusScore", filters.minFocusScore.toString());

    const res = await fetch(`/api/screenshots?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  if (loading && !data) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">Your productivity at a glance</p>
        </div>
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Your productivity at a glance</p>
      </div>

      <Filters
        onChange={handleFilterChange}
        categories={data?.categories || []}
        apps={data?.apps || []}
      />

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-4" style={{ marginBottom: "24px" }}>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "var(--color-accent-light)" }}>
                {data.total.toLocaleString()}
              </div>
              <div className="stat-label">Total Screenshots</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: data.stats.avgFocus >= 80 ? "var(--color-success)" : data.stats.avgFocus >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                {data.stats.avgFocus}
              </div>
              <div className="stat-label">Average Focus</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: data.stats.avgProductivity >= 80 ? "var(--color-success)" : data.stats.avgProductivity >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                {data.stats.avgProductivity}
              </div>
              <div className="stat-label">Average Productivity</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: data.stats.avgDistraction <= 20 ? "var(--color-success)" : data.stats.avgDistraction <= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>
                {data.stats.avgDistraction}%
              </div>
              <div className="stat-label">Distraction Risk</div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginBottom: "24px" }}>
            <ProductivityChart
              data={data.aggregatedStats}
              title={`Productivity Trend (${filters.aggregation})`}
            />
            <CategoryChart data={data.stats.categories} title="Activity Categories" />
          </div>

          <div className="grid grid-2" style={{ marginBottom: "24px" }}>
            <HourlyChart data={data.stats.hourlyDistribution} title="Activity by Hour" />
            <AppsList apps={data.stats.apps} />
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Score Overview</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", padding: "20px" }}>
              <ScoreRing value={data.stats.avgFocus} label="Focus Score" />
              <ScoreRing value={data.stats.avgProductivity} label="Productivity" />
              <ScoreRing value={100 - data.stats.avgDistraction} label="Concentration" />
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No Data Available</div>
          <p>Start capturing screenshots to see your productivity insights</p>
        </div>
      )}
    </div>
  );
}

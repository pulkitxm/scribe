"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
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

export default function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const dateRange = searchParams.get("range") || "all";
    const aggregation = (searchParams.get("aggregation") as "daily" | "weekly" | "monthly") || "daily";
    const category = searchParams.get("category") || "";
    const app = searchParams.get("app") || "";

    const [data, setData] = useState<ApiResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const updateUrl = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all" && value !== "daily") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/?${params.toString()}`, { scroll: false });
    };

    const fetchData = useCallback(async () => {
        setLoading(true);

        const params = new URLSearchParams({
            statsOnly: "true",
            aggregation,
        });

        if (dateRange !== "all") {
            const now = new Date();
            let startDate: Date;

            switch (dateRange) {
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

        if (category) params.set("category", category);
        if (app) params.set("app", app);

        const res = await fetch(`/api/screenshots?${params}`);
        const json = await res.json();
        setData(json);
        setLoading(false);
    }, [dateRange, aggregation, category, app]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return "var(--color-success)";
        if (score >= 60) return "var(--color-warning)";
        return "var(--color-danger)";
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">Your productivity at a glance</p>
            </div>

            <div className="filter-bar">
                <div className="filter-group-inline">
                    <span className="filter-label">Time</span>
                    <div className="tabs">
                        {(["today", "week", "month", "all"] as const).map((range) => (
                            <button
                                key={range}
                                className={`tab ${dateRange === range ? "active" : ""}`}
                                onClick={() => updateUrl("range", range)}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="filter-group-inline">
                    <span className="filter-label">View</span>
                    <div className="tabs">
                        {(["daily", "weekly", "monthly"] as const).map((agg) => (
                            <button
                                key={agg}
                                className={`tab ${aggregation === agg ? "active" : ""}`}
                                onClick={() => updateUrl("aggregation", agg)}
                            >
                                {agg.charAt(0).toUpperCase() + agg.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <select
                    className="select"
                    value={category}
                    onChange={(e) => updateUrl("category", e.target.value)}
                >
                    <option value="">All Categories</option>
                    {data?.categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <select
                    className="select"
                    value={app}
                    onChange={(e) => updateUrl("app", e.target.value)}
                >
                    <option value="">All Apps</option>
                    {data?.apps.map((a) => (
                        <option key={a} value={a}>{a}</option>
                    ))}
                </select>

                {(category || app || dateRange !== "all" || aggregation !== "daily") && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => router.push("/")}
                    >
                        Reset
                    </button>
                )}
            </div>

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
                            <div className="stat-value" style={{ color: getScoreColor(data.stats.avgFocus) }}>
                                {data.stats.avgFocus}
                            </div>
                            <div className="stat-label">Average Focus</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: getScoreColor(data.stats.avgProductivity) }}>
                                {data.stats.avgProductivity}
                            </div>
                            <div className="stat-label">Average Productivity</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: getScoreColor(100 - data.stats.avgDistraction) }}>
                                {data.stats.avgDistraction}%
                            </div>
                            <div className="stat-label">Distraction Risk</div>
                        </div>
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: "24px" }}>
                        <ProductivityChart
                            data={data.aggregatedStats}
                            title={`Productivity Trend (${aggregation})`}
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

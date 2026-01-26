"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";

const ProductivityChart = dynamic(() => import("@/components/ProductivityChart"), { ssr: false });
const CategoryChart = dynamic(() => import("@/components/CategoryChart"), { ssr: false });
const HourlyChart = dynamic(() => import("@/components/HourlyChart"), { ssr: false });

interface DailyStats {
    date: string;
    avgFocusScore: number;
    avgProductivityScore: number;
    avgDistraction: number;
    totalScreenshots: number;
    categories: Record<string, number>;
    apps: Record<string, number>;
    workTypes: Record<string, number>;
}

interface Stats {
    avgFocus: number;
    avgProductivity: number;
    avgDistraction: number;
    totalScreenshots: number;
    categories: Record<string, number>;
    apps: Record<string, number>;
    hourlyDistribution: Record<number, number>;
}

export default function AnalyticsPage() {
    const [aggregation, setAggregation] = useState<"daily" | "weekly" | "monthly">("daily");
    const [stats, setStats] = useState<Stats | null>(null);
    const [aggregatedStats, setAggregatedStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/screenshots?statsOnly=true&aggregation=${aggregation}`);
        const data = await res.json();
        setStats(data.stats);
        setAggregatedStats(data.aggregatedStats);
        setLoading(false);
    }, [aggregation]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const getProductivityInsight = () => {
        if (!stats) return null;
        if (stats.avgProductivity >= 80) {
            return { emoji: "🚀", text: "Excellent productivity! You're in the zone.", color: "var(--color-success)" };
        }
        if (stats.avgProductivity >= 60) {
            return { emoji: "👍", text: "Good productivity. Keep up the momentum.", color: "var(--color-warning)" };
        }
        return { emoji: "🎯", text: "Room for improvement. Try reducing distractions.", color: "var(--color-danger)" };
    };

    const getMostProductiveTime = () => {
        if (!stats || Object.keys(stats.hourlyDistribution).length === 0) return null;
        const sorted = Object.entries(stats.hourlyDistribution).sort((a, b) => b[1] - a[1]);
        const peakHour = parseInt(sorted[0][0]);
        return `${peakHour.toString().padStart(2, "0")}:00 - ${((peakHour + 1) % 24).toString().padStart(2, "0")}:00`;
    };

    const getTopCategory = () => {
        if (!stats || Object.keys(stats.categories).length === 0) return null;
        const sorted = Object.entries(stats.categories).sort((a, b) => b[1] - a[1]);
        return sorted[0][0];
    };

    const getTopApp = () => {
        if (!stats || Object.keys(stats.apps).length === 0) return null;
        const sorted = Object.entries(stats.apps).sort((a, b) => b[1] - a[1]);
        return sorted[0][0];
    };

    const insight = getProductivityInsight();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Analytics</h1>
                <p className="page-description">Deep dive into your productivity patterns</p>
            </div>

            <div className="card" style={{ marginBottom: "24px" }}>
                <div className="card-header">
                    <div className="card-title">Time Period</div>
                </div>
                <div className="tabs">
                    {(["daily", "weekly", "monthly"] as const).map((agg) => (
                        <button
                            key={agg}
                            className={`tab ${aggregation === agg ? "active" : ""}`}
                            onClick={() => setAggregation(agg)}
                        >
                            {agg.charAt(0).toUpperCase() + agg.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner" />
                </div>
            ) : stats ? (
                <>
                    {insight && (
                        <div className="card" style={{ marginBottom: "24px", borderColor: insight.color }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <span style={{ fontSize: "3rem" }}>{insight.emoji}</span>
                                <div>
                                    <div style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "4px" }}>
                                        Productivity Insight
                                    </div>
                                    <div style={{ color: "var(--text-secondary)" }}>{insight.text}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-4" style={{ marginBottom: "24px" }}>
                        <div className="insight-card">
                            <div className="insight-icon">⏰</div>
                            <div className="insight-title">Peak Activity Time</div>
                            <div className="insight-value">{getMostProductiveTime() || "N/A"}</div>
                        </div>
                        <div className="insight-card">
                            <div className="insight-icon">🎯</div>
                            <div className="insight-title">Top Category</div>
                            <div className="insight-value">{getTopCategory() || "N/A"}</div>
                        </div>
                        <div className="insight-card">
                            <div className="insight-icon">💻</div>
                            <div className="insight-title">Most Used App</div>
                            <div className="insight-value" style={{ fontSize: "1rem" }}>{getTopApp() || "N/A"}</div>
                        </div>
                        <div className="insight-card">
                            <div className="insight-icon">📸</div>
                            <div className="insight-title">Total Captures</div>
                            <div className="insight-value">{stats.totalScreenshots}</div>
                        </div>
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: "24px" }}>
                        <ProductivityChart data={aggregatedStats} title={`Trend (${aggregation})`} />
                        <HourlyChart data={stats.hourlyDistribution} title="Activity Distribution" />
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: "24px" }}>
                        <CategoryChart data={stats.categories} title="Category Breakdown" />
                        <div className="card">
                            <div className="card-title">Detailed Stats</div>
                            <div style={{ marginTop: "20px" }}>
                                <div className="list-item">
                                    <span className="list-item-label">Average Focus Score</span>
                                    <span className="list-item-value" style={{ color: stats.avgFocus >= 80 ? "var(--color-success)" : stats.avgFocus >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                                        {stats.avgFocus}/100
                                    </span>
                                </div>
                                <div className="list-item">
                                    <span className="list-item-label">Average Productivity</span>
                                    <span className="list-item-value" style={{ color: stats.avgProductivity >= 80 ? "var(--color-success)" : stats.avgProductivity >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                                        {stats.avgProductivity}/100
                                    </span>
                                </div>
                                <div className="list-item">
                                    <span className="list-item-label">Distraction Risk</span>
                                    <span className="list-item-value" style={{ color: stats.avgDistraction <= 20 ? "var(--color-success)" : stats.avgDistraction <= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>
                                        {stats.avgDistraction}%
                                    </span>
                                </div>
                                <div className="list-item">
                                    <span className="list-item-label">Categories Tracked</span>
                                    <span className="list-item-value">{Object.keys(stats.categories).length}</span>
                                </div>
                                <div className="list-item">
                                    <span className="list-item-label">Apps Tracked</span>
                                    <span className="list-item-value">{Object.keys(stats.apps).length}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {aggregatedStats.length > 0 && (
                        <div className="card">
                            <div className="card-title" style={{ marginBottom: "20px" }}>
                                {aggregation.charAt(0).toUpperCase() + aggregation.slice(1)} Breakdown
                            </div>
                            <div style={{ overflowX: "auto" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                                            <th style={{ textAlign: "left", padding: "12px 8px", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Period</th>
                                            <th style={{ textAlign: "right", padding: "12px 8px", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Screenshots</th>
                                            <th style={{ textAlign: "right", padding: "12px 8px", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Focus</th>
                                            <th style={{ textAlign: "right", padding: "12px 8px", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Productivity</th>
                                            <th style={{ textAlign: "right", padding: "12px 8px", color: "var(--text-muted)", fontSize: "0.75rem", textTransform: "uppercase" }}>Distraction</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregatedStats.map((stat) => (
                                            <tr key={stat.date} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                                <td style={{ padding: "12px 8px", color: "var(--text-secondary)" }}>{stat.date}</td>
                                                <td style={{ textAlign: "right", padding: "12px 8px" }}>{stat.totalScreenshots}</td>
                                                <td style={{ textAlign: "right", padding: "12px 8px", color: stat.avgFocusScore >= 80 ? "var(--color-success)" : stat.avgFocusScore >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                                                    {stat.avgFocusScore}
                                                </td>
                                                <td style={{ textAlign: "right", padding: "12px 8px", color: stat.avgProductivityScore >= 80 ? "var(--color-success)" : stat.avgProductivityScore >= 60 ? "var(--color-warning)" : "var(--color-danger)" }}>
                                                    {stat.avgProductivityScore}
                                                </td>
                                                <td style={{ textAlign: "right", padding: "12px 8px", color: stat.avgDistraction <= 20 ? "var(--color-success)" : stat.avgDistraction <= 40 ? "var(--color-warning)" : "var(--color-danger)" }}>
                                                    {stat.avgDistraction}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📈</div>
                    <div className="empty-state-title">No Analytics Data</div>
                    <p>Start capturing screenshots to see analytics</p>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    workTypes: Record<string, number>;
    languages: Record<string, number>;
    repos: Record<string, number>;
    domains: Record<string, number>;
    tags: Record<string, number>;
    workspaceTypes: Record<string, number>;
    avgConfidence: number;
}

export default function AnalyticsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const aggregation = (searchParams.get("aggregation") as "daily" | "weekly" | "monthly") || "daily";
    const dateRange = searchParams.get("range") || "all";

    const [stats, setStats] = useState<Stats | null>(null);
    const [aggregatedStats, setAggregatedStats] = useState<DailyStats[]>([]);
    const [loading, setLoading] = useState(true);

    const updateUrl = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value && value !== "all" && value !== "daily") {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/analytics?${params.toString()}`, { scroll: false });
    };

    const fetchData = useCallback(async () => {
        setLoading(true);

        const params = new URLSearchParams({
            statsOnly: "true",
            aggregation,
            extended: "true",
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

        const res = await fetch(`/api/screenshots?${params}`);
        const data = await res.json();
        setStats(data.stats);
        setAggregatedStats(data.aggregatedStats);
        setLoading(false);
    }, [aggregation, dateRange]);

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

    const getTopLanguage = () => {
        if (!stats || !stats.languages || Object.keys(stats.languages).length === 0) return null;
        const sorted = Object.entries(stats.languages).sort((a, b) => b[1] - a[1]);
        return sorted[0][0];
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "var(--color-success)";
        if (score >= 60) return "var(--color-warning)";
        return "var(--color-danger)";
    };

    const insight = getProductivityInsight();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Analytics</h1>
                <p className="page-description">Deep dive into your productivity patterns</p>
            </div>

            <div className="filter-bar" style={{ marginBottom: "24px" }}>
                <div className="filter-group-inline">
                    <span className="filter-label">Time Range</span>
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
                    <span className="filter-label">Aggregation</span>
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
            </div>

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner" />
                </div>
            ) : stats ? (
                <>
                    {insight && (
                        <div className="insight-banner" style={{ borderColor: insight.color }}>
                            <span className="insight-banner-emoji">{insight.emoji}</span>
                            <div>
                                <div className="insight-banner-title">Productivity Insight</div>
                                <div className="insight-banner-text">{insight.text}</div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-4" style={{ marginBottom: "24px" }}>
                        <div className="insight-card">
                            <div className="insight-icon">⏰</div>
                            <div className="insight-title">Peak Activity</div>
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
                            <div className="insight-icon">📝</div>
                            <div className="insight-title">Top Language</div>
                            <div className="insight-value" style={{ fontSize: "1rem" }}>{getTopLanguage() || "N/A"}</div>
                        </div>
                    </div>

                    <div className="grid grid-4" style={{ marginBottom: "24px" }}>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: "var(--color-accent-light)" }}>
                                {stats.totalScreenshots}
                            </div>
                            <div className="stat-label">Screenshots</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: getScoreColor(stats.avgFocus) }}>
                                {stats.avgFocus}
                            </div>
                            <div className="stat-label">Avg Focus</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: getScoreColor(stats.avgProductivity) }}>
                                {stats.avgProductivity}
                            </div>
                            <div className="stat-label">Avg Productivity</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-value" style={{ color: getScoreColor(100 - stats.avgDistraction) }}>
                                {stats.avgDistraction}%
                            </div>
                            <div className="stat-label">Distraction Risk</div>
                        </div>
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: "24px" }}>
                        <ProductivityChart data={aggregatedStats} title={`Trend (${aggregation})`} />
                        <HourlyChart data={stats.hourlyDistribution} title="Activity by Hour" />
                    </div>

                    <div className="grid grid-3" style={{ marginBottom: "24px" }}>
                        <CategoryChart data={stats.categories} title="Categories" />
                        {stats.workspaceTypes && Object.keys(stats.workspaceTypes).length > 0 && (
                            <CategoryChart data={stats.workspaceTypes} title="Workspace Types" />
                        )}
                        {stats.workTypes && Object.keys(stats.workTypes).length > 0 && (
                            <CategoryChart data={stats.workTypes} title="Work Types" />
                        )}
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: "24px" }}>
                        {stats.languages && Object.keys(stats.languages).length > 0 && (
                            <div className="card">
                                <div className="card-title">Languages Used</div>
                                <div className="bar-list">
                                    {Object.entries(stats.languages)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 8)
                                        .map(([lang, count]) => (
                                            <div key={lang} className="bar-item">
                                                <div className="bar-item-header">
                                                    <span>{lang}</span>
                                                    <span className="bar-item-count">{count}</span>
                                                </div>
                                                <div className="score-bar">
                                                    <div
                                                        className="score-bar-fill"
                                                        style={{
                                                            width: `${(count / Math.max(...Object.values(stats.languages))) * 100}%`,
                                                            background: "var(--color-info)",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {stats.repos && Object.keys(stats.repos).length > 0 && (
                            <div className="card">
                                <div className="card-title">Repositories / Projects</div>
                                <div className="bar-list">
                                    {Object.entries(stats.repos)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 8)
                                        .map(([repo, count]) => (
                                            <div key={repo} className="bar-item">
                                                <div className="bar-item-header">
                                                    <span>{repo}</span>
                                                    <span className="bar-item-count">{count}</span>
                                                </div>
                                                <div className="score-bar">
                                                    <div
                                                        className="score-bar-fill"
                                                        style={{
                                                            width: `${(count / Math.max(...Object.values(stats.repos))) * 100}%`,
                                                            background: "var(--color-success)",
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-2" style={{ marginBottom: "24px" }}>
                        <div className="card">
                            <div className="card-title">Top Apps</div>
                            <div className="bar-list">
                                {Object.entries(stats.apps)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 10)
                                    .map(([app, count]) => (
                                        <div key={app} className="bar-item">
                                            <div className="bar-item-header">
                                                <span>{app}</span>
                                                <span className="bar-item-count">{count}</span>
                                            </div>
                                            <div className="score-bar">
                                                <div
                                                    className="score-bar-fill"
                                                    style={{
                                                        width: `${(count / Math.max(...Object.values(stats.apps))) * 100}%`,
                                                        background: "var(--gradient-primary)",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        {stats.tags && Object.keys(stats.tags).length > 0 && (
                            <div className="card">
                                <div className="card-title">Common Tags</div>
                                <div className="tag-cloud">
                                    {Object.entries(stats.tags)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 20)
                                        .map(([tag, count]) => (
                                            <span
                                                key={tag}
                                                className="tag-cloud-item"
                                                style={{
                                                    fontSize: `${Math.max(0.75, Math.min(1.25, 0.75 + (count / stats.totalScreenshots) * 5))}rem`,
                                                }}
                                                onClick={() => router.push(`/gallery?tag=${encodeURIComponent(tag)}`)}
                                            >
                                                {tag}
                                                <span className="tag-count">{count}</span>
                                            </span>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {stats.domains && Object.keys(stats.domains).length > 0 && (
                        <div className="card" style={{ marginBottom: "24px" }}>
                            <div className="card-title">Web Domains Visited</div>
                            <div className="domain-list">
                                {Object.entries(stats.domains)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([domain, count]) => (
                                        <div key={domain} className="domain-item">
                                            <span className="domain-name">{domain}</span>
                                            <span className="domain-count">{count}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {aggregatedStats.length > 0 && (
                        <div className="card">
                            <div className="card-title" style={{ marginBottom: "20px" }}>
                                {aggregation.charAt(0).toUpperCase() + aggregation.slice(1)} Breakdown
                            </div>
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Period</th>
                                            <th>Screenshots</th>
                                            <th>Focus</th>
                                            <th>Productivity</th>
                                            <th>Distraction</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregatedStats.map((stat) => (
                                            <tr key={stat.date}>
                                                <td className="table-date">{stat.date}</td>
                                                <td>{stat.totalScreenshots}</td>
                                                <td style={{ color: getScoreColor(stat.avgFocusScore) }}>{stat.avgFocusScore}</td>
                                                <td style={{ color: getScoreColor(stat.avgProductivityScore) }}>{stat.avgProductivityScore}</td>
                                                <td style={{ color: getScoreColor(100 - stat.avgDistraction) }}>{stat.avgDistraction}%</td>
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

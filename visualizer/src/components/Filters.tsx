"use client";

import { useState, useEffect } from "react";

interface Props {
    onChange: (filters: FilterState) => void;
    categories: string[];
    apps: string[];
}

export interface FilterState {
    dateRange: "today" | "week" | "month" | "all";
    aggregation: "daily" | "weekly" | "monthly";
    category: string;
    app: string;
    minFocusScore: number;
}

export default function Filters({ onChange, categories, apps }: Props) {
    const [filters, setFilters] = useState<FilterState>({
        dateRange: "all",
        aggregation: "daily",
        category: "",
        app: "",
        minFocusScore: 0,
    });

    useEffect(() => {
        onChange(filters);
    }, [filters, onChange]);

    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="card" style={{ marginBottom: "24px" }}>
            <div className="card-header">
                <div className="card-title">Filters</div>
            </div>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Time Range
                    </label>
                    <div className="tabs">
                        {(["today", "week", "month", "all"] as const).map((range) => (
                            <button
                                key={range}
                                className={`tab ${filters.dateRange === range ? "active" : ""}`}
                                onClick={() => updateFilter("dateRange", range)}
                            >
                                {range.charAt(0).toUpperCase() + range.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Aggregation
                    </label>
                    <div className="tabs">
                        {(["daily", "weekly", "monthly"] as const).map((agg) => (
                            <button
                                key={agg}
                                className={`tab ${filters.aggregation === agg ? "active" : ""}`}
                                onClick={() => updateFilter("aggregation", agg)}
                            >
                                {agg.charAt(0).toUpperCase() + agg.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Category
                    </label>
                    <select
                        className="select"
                        value={filters.category}
                        onChange={(e) => updateFilter("category", e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat) => (
                            <option key={cat} value={cat}>
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        App
                    </label>
                    <select
                        className="select"
                        value={filters.app}
                        onChange={(e) => updateFilter("app", e.target.value)}
                    >
                        <option value="">All Apps</option>
                        {apps.map((app) => (
                            <option key={app} value={app}>
                                {app}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: "block", marginBottom: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Min Focus Score: {filters.minFocusScore}
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.minFocusScore}
                        onChange={(e) => updateFilter("minFocusScore", parseInt(e.target.value))}
                        style={{ width: "120px" }}
                    />
                </div>
            </div>
        </div>
    );
}

"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";

interface DailyStats {
    date: string;
    avgFocusScore: number;
    avgProductivityScore: number;
    avgDistraction: number;
    totalScreenshots: number;
}

interface Props {
    data: DailyStats[];
    title: string;
}

export default function ProductivityChart({ data, title }: Props) {
    const chartData = [...data].reverse().slice(-14);

    if (chartData.length === 0) {
        return (
            <div className="card">
                <div className="card-title">{title}</div>
                <div className="empty-state" style={{ padding: "40px" }}>
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-title">{title}</div>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis
                            dataKey="date"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickFormatter={(value) => {
                                if (value.startsWith("Week")) return value.substring(0, 10);
                                const parts = value.split("-");
                                if (parts.length === 3) return `${parts[0]}/${parts[1]}`;
                                return value.substring(0, 8);
                            }}
                        />
                        <YAxis stroke="var(--text-muted)" fontSize={12} domain={[0, 100]} />
                        <Tooltip
                            contentStyle={{
                                background: "#16161f",
                                border: "1px solid #2a2a3a",
                                borderRadius: "8px",
                                color: "#f0f0f5",
                            }}
                            labelStyle={{ color: "#f0f0f5" }}
                            itemStyle={{ color: "#f0f0f5" }}
                        />
                        <Legend />
                        <Area
                            type="monotone"
                            dataKey="avgFocusScore"
                            name="Focus"
                            stroke="#8b5cf6"
                            fill="url(#focusGradient)"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="avgProductivityScore"
                            name="Productivity"
                            stroke="#10b981"
                            fill="url(#productivityGradient)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

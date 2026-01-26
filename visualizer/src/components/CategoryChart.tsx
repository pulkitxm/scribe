"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Props {
    data: Record<string, number>;
    title: string;
}

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4", "#6366f1"];

export default function CategoryChart({ data, title }: Props) {
    const chartData = Object.entries(data)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

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
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
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
                        <Legend
                            formatter={(value) => <span style={{ color: "var(--text-secondary)" }}>{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

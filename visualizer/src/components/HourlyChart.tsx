"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
    data: Record<number, number>;
    title: string;
}

export default function HourlyChart({ data, title }: Props) {
    const chartData = Array.from({ length: 24 }, (_, hour) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        count: data[hour] || 0,
    }));

    const maxCount = Math.max(...chartData.map((d) => d.count), 1);

    if (Object.keys(data).length === 0) {
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
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis
                            dataKey="hour"
                            stroke="var(--text-muted)"
                            fontSize={10}
                            interval={2}
                        />
                        <YAxis stroke="var(--text-muted)" fontSize={12} />
                        <Tooltip
                            contentStyle={{
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-color)",
                                borderRadius: "8px",
                            }}
                            formatter={(value: number) => [`${value} screenshots`, "Count"]}
                        />
                        <Bar
                            dataKey="count"
                            fill="#8b5cf6"
                            radius={[4, 4, 0, 0]}
                            opacity={0.8}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

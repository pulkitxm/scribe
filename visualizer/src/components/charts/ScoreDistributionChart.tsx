"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface ScoreDistributionChartProps {
    data: Array<{ range: string; count: number }>; // Pre-binned data
    title?: string;
    scoreType?: "focus" | "productivity" | "distraction";
}

export default function ScoreDistributionChart({
    data,
    title = "Focus Score Distribution",
    scoreType = "focus"
}: ScoreDistributionChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No score data available
                </CardContent>
            </Card>
        );
    }

    // Create bins with colors: 0-20, 20-40, 40-60, 60-80, 80-100
    const colorMap = [
        { range: "0-20", color: "#ef4444" },
        { range: "20-40", color: "#f59e0b" },
        { range: "40-60", color: "#eab308" },
        { range: "60-80", color: "#3b82f6" },
        { range: "80-100", color: "#10b981" }
    ];

    // Apply colors to data
    const binsWithColors = data.map(d => {
        const colorEntry = colorMap.find(c => c.range === d.range);
        return {
            ...d,
            color: colorEntry?.color || "#888888"
        };
    });

    const total = data.reduce((sum, d) => sum + d.count, 0);

    // Calculate approximate average from bins
    const avgScore = Math.round(
        data.reduce((sum, d, i) => sum + (i * 20 + 10) * d.count, 0) / total
    );

    // Calculate approximate median
    let cumulative = 0;
    let medianScore = 0;
    for (let i = 0; i < data.length; i++) {
        cumulative += data[i].count;
        if (cumulative >= total / 2) {
            medianScore = i * 20 + 10;
            break;
        }
    }

    // Color based on scoreType
    let colorScheme = binsWithColors;
    if (scoreType === "distraction") {
        // Reverse colors for distraction (low is good)
        colorScheme = binsWithColors.map((b, i) => ({
            ...b,
            color: colorMap[colorMap.length - 1 - i].color
        }));
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-muted-foreground">{title}</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Avg: <span className="font-semibold text-foreground">{avgScore}</span></span>
                        <span>Median: <span className="font-semibold text-foreground">{medianScore}</span></span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Distribution of scores across {total} captures
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={colorScheme} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="range"
                            stroke="#888888"
                            fontSize={11}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={11}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                            itemStyle={{ color: "#e5e7eb" }}
                            formatter={(value: number | undefined) => {
                                if (value === undefined) return ['0 captures (0%)', 'Count'];
                                const percent = ((value / total) * 100).toFixed(1);
                                return [`${value} captures (${percent}%)`, 'Count'];
                            }}
                            labelFormatter={(label) => `Score Range: ${label}`}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {colorScheme.map((entry: { color: string }, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

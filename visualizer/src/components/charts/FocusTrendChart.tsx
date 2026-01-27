"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface FocusTrendChartProps {
    data: Array<{
        date: string;
        avgFocusScore: number;
        avgProductivityScore: number;
        totalScreenshots: number;
    }>;
    title?: string;
    days?: number;
}

export default function FocusTrendChart({ data, title = "Focus & Productivity Trend", days = 30 }: FocusTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No trend data available
                </CardContent>
            </Card>
        );
    }

    // Take last N days
    const recentData = data.slice(-days);

    const avgFocus = recentData.reduce((sum, d) => sum + d.avgFocusScore, 0) / recentData.length;
    const avgProd = recentData.reduce((sum, d) => sum + d.avgProductivityScore, 0) / recentData.length;

    // Format dates for display
    const formattedData = recentData.map(d => ({
        ...d,
        dateLabel: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-muted-foreground">{title}</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Avg Focus: <span className="font-semibold text-foreground">{avgFocus.toFixed(0)}</span></span>
                        <span>Avg Productivity: <span className="font-semibold text-foreground">{avgProd.toFixed(0)}</span></span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Daily average scores over the last {days} days
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="dateLabel"
                            stroke="#888888"
                            fontSize={10}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={11}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                            itemStyle={{ color: "#e5e7eb" }}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="avgFocusScore"
                            name="Focus Score"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={{ fill: "#10b981", r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="avgProductivityScore"
                            name="Productivity Score"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: "#3b82f6", r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface DayOfWeekChartProps {
    data: Array<{ day: string; count: number }>; // [{ day: "Monday", count: 45 }, ...]
    title?: string;
}

const DAY_ORDER = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const DAY_COLORS: Record<string, string> = {
    "Monday": "#3b82f6",
    "Tuesday": "#10b981",
    "Wednesday": "#f59e0b",
    "Thursday": "#ef4444",
    "Friday": "#8b5cf6",
    "Saturday": "#ec4899",
    "Sunday": "#6366f1"
};

export default function DayOfWeekChart({ data, title = "Usage by Day of Week" }: DayOfWeekChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No usage data available
                </CardContent>
            </Card>
        );
    }

    // Convert array to record for easier lookup
    const dataRecord: Record<string, number> = {};
    data.forEach(d => {
        dataRecord[d.day] = d.count;
    });

    // Sort by day order
    const sortedData = DAY_ORDER
        .filter(day => dataRecord[day] !== undefined)
        .map(day => ({
            day: day.substring(0, 3), // "Mon", "Tue", etc.
            fullDay: day,
            count: dataRecord[day] || 0
        }));

    const total = sortedData.reduce((sum, d) => sum + d.count, 0);
    const mostActiveDay = sortedData.reduce((max, d) => d.count > max.count ? d : max, sortedData[0]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-muted-foreground">{title}</span>
                    <div className="text-xs text-muted-foreground">
                        Most Active: <span className="font-semibold text-foreground">{mostActiveDay.fullDay}</span> ({mostActiveDay.count})
                    </div>
                </CardTitle>
                <CardDescription>
                    Activity distribution across weekdays
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sortedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="day"
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
                            labelFormatter={(label) => {
                                const item = sortedData.find(d => d.day === label);
                                return item?.fullDay || label;
                            }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {sortedData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={DAY_COLORS[entry.fullDay] || '#888888'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

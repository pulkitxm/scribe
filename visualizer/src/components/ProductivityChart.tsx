"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    const chartData = data;

    if (chartData.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No data available
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickFormatter={(value) => {
                                    if (value.startsWith("Week")) return value.substring(0, 10);
                                    const parts = value.split("-");
                                    if (parts.length === 3) return `${parts[0]}/${parts[1]}`;
                                    return value.substring(0, 8);
                                }}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                domain={[0, 100]}
                                tickLine={false}
                                axisLine={false}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    borderColor: "hsl(var(--border))",
                                    borderRadius: "var(--radius)",
                                    color: "hsl(var(--foreground))",
                                }}
                                labelStyle={{ color: "hsl(var(--foreground))" }}
                                itemStyle={{ color: "hsl(var(--foreground))" }}
                            />
                            <Area
                                type="monotone"
                                dataKey="avgFocusScore"
                                name="Focus"
                                stroke="hsl(var(--primary))"
                                fill="url(#focusGradient)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="avgProductivityScore"
                                name="Productivity"
                                stroke="hsl(var(--muted-foreground))"
                                fill="url(#productivityGradient)"
                                strokeWidth={2}
                                strokeDasharray="4 4"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

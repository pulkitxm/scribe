"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

interface StorageTrendChartProps {
    data: Array<{
        hour: number;
        used: number;
        free: number;
        total: number;
        count: number;
    }>;
    totalStorage: number;
}

export default function StorageTrendChart({ data, totalStorage }: StorageTrendChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Storage Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No storage data available
                </CardContent>
            </Card>
        );
    }

    const avgUsed = data.reduce((sum, d) => sum + d.used, 0) / data.length;
    const avgFree = data.reduce((sum, d) => sum + d.free, 0) / data.length;
    const avgPercent = (avgUsed / totalStorage) * 100;

    const freePercentages = data.map(d => (d.free / d.total) * 100);
    const minFreePercent = Math.min(...freePercentages);
    const criticalPeriods = data.filter(d => (d.free / d.total) * 100 < 10).length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-muted-foreground">Storage Usage Trend</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Avg Used: <span className="font-semibold text-foreground">{avgUsed.toFixed(1)} GB</span> ({avgPercent.toFixed(0)}%)</span>
                        <span>Avg Free: <span className="font-semibold text-foreground">{avgFree.toFixed(1)} GB</span></span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Disk space usage over time • Total: {totalStorage} GB •
                    {criticalPeriods > 0 && <span className="text-red-500 ml-1">⚠️ {criticalPeriods} critical period(s) (&lt;10% free)</span>}
                    {criticalPeriods === 0 && minFreePercent < 20 && <span className="text-amber-500 ml-1">⚠️ Low space warning (&lt;20% free)</span>}
                    {criticalPeriods === 0 && minFreePercent >= 20 && <span className="text-green-500 ml-1">✓ Healthy storage space</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2} />
                            </linearGradient>
                            <linearGradient id="colorFree" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis
                            dataKey="hour"
                            stroke="#888888"
                            fontSize={11}
                            tickFormatter={(value) => `${value}:00`}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={11}
                            domain={[0, totalStorage]}
                            label={{ value: 'Storage (GB)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                            itemStyle={{ color: "#e5e7eb" }}
                            formatter={(value: number | undefined, name: string | undefined, props: any) => {
                                if (value === undefined) return ['0 GB (0%)', name || ''];
                                const percent = ((value / props.payload.total) * 100).toFixed(1);
                                return [`${value.toFixed(1)} GB (${percent}%)`, name || ''];
                            }}
                            labelFormatter={(label) => `Hour: ${label}:00`}
                        />
                        <Legend />

                        <ReferenceLine
                            y={totalStorage * 0.9}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            label={{ value: 'Critical (90%)', position: 'right', fontSize: 10 }}
                        />
                        <ReferenceLine
                            y={totalStorage * 0.8}
                            stroke="#f59e0b"
                            strokeDasharray="3 3"
                            label={{ value: 'Warning (80%)', position: 'right', fontSize: 10 }}
                        />

                        <Area
                            type="monotone"
                            dataKey="used"
                            name="Used Space"
                            stackId="1"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#colorUsed)"
                        />
                        <Area
                            type="monotone"
                            dataKey="free"
                            name="Free Space"
                            stackId="1"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="url(#colorFree)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

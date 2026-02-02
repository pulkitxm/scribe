"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

interface RAMChartProps {
    data: Array<{ hour: number; ram: number; count: number }>;
    totalRAM?: number; 
}

export default function RAMChart({ data, totalRAM = 32 }: RAMChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">RAM Usage</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No RAM data available
                </CardContent>
            </Card>
        );
    }

    const ramValues = data.map(d => d.ram);
    const avgRAM = ramValues.reduce((a, b) => a + b, 0) / ramValues.length;
    const maxRAM = Math.max(...ramValues);
    const peakHour = data.find(d => d.ram === maxRAM)?.hour || 0;

    
    const avgPercent = (avgRAM / totalRAM) * 100;
    const maxPercent = (maxRAM / totalRAM) * 100;

    
    const warningThreshold = totalRAM * 0.8; 
    const criticalThreshold = totalRAM * 0.9; 

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-muted-foreground">RAM Usage Over Time</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Avg: <span className="font-semibold text-foreground">{avgRAM.toFixed(1)} GB</span> ({avgPercent.toFixed(0)}%)</span>
                        <span>Peak: <span className="font-semibold text-foreground">{maxRAM.toFixed(1)} GB</span> @{peakHour}:00</span>
                    </div>
                </CardTitle>
                <CardDescription>
                    Memory usage patterns • Total RAM: {totalRAM} GB •
                    <span className="text-amber-500 ml-1">Warning (80%)</span>
                    <span className="text-red-500 ml-2">Critical (90%)</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorRAM" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
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
                            domain={[0, totalRAM]}
                            label={{ value: 'RAM (GB)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                            itemStyle={{ color: "#e5e7eb" }}
                            formatter={(value: number | undefined) => {
                                if (value === undefined) return ['0 GB (0%)', 'RAM Usage'];
                                const percent = ((value / totalRAM) * 100).toFixed(1);
                                return [`${value.toFixed(2)} GB (${percent}%)`, 'RAM Usage'];
                            }}
                            labelFormatter={(label) => `Hour: ${label}:00`}
                        />
                        <Legend />

                        {}
                        <ReferenceLine
                            y={warningThreshold}
                            stroke="#f59e0b"
                            strokeDasharray="3 3"
                            label={{ value: 'Warning 80%', position: 'right', fontSize: 10 }}
                        />
                        <ReferenceLine
                            y={criticalThreshold}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            label={{ value: 'Critical 90%', position: 'right', fontSize: 10 }}
                        />
                        <ReferenceLine
                            y={avgRAM}
                            stroke="#8b5cf6"
                            strokeDasharray="5 5"
                            label={{ value: 'Avg', position: 'right', fontSize: 10 }}
                        />

                        <Area
                            type="monotone"
                            dataKey="ram"
                            name="RAM Usage (GB)"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#colorRAM)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

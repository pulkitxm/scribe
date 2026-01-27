"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";

interface BatteryChartProps {
    data: Array<{
        hour: number;
        battery: number;
        count: number;
        isPlugged?: boolean; // Optional: track plugged state
    }>;
}

export default function BatteryChart({ data }: BatteryChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Battery</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No battery data available
                </CardContent>
            </Card>
        );
    }

    const batteryValues = data.map(d => d.battery);
    const avgBattery = batteryValues.reduce((a, b) => a + b, 0) / batteryValues.length;
    const minBattery = Math.min(...batteryValues);
    const lowBatteryPeriods = data.filter(d => d.battery < 20).length;

    // Calculate drain rate (if we have sequential data)
    let drainRate = 0;
    if (data.length > 1) {
        const nonZeroDiffs = [];
        for (let i = 1; i < data.length; i++) {
            const diff = data[i - 1].battery - data[i].battery;
            if (diff > 0 && diff < 50) { // Reasonable drain (not plugged in jump)
                nonZeroDiffs.push(diff);
            }
        }
        if (nonZeroDiffs.length > 0) {
            drainRate = nonZeroDiffs.reduce((a, b) => a + b, 0) / nonZeroDiffs.length;
        }
    }

    // Identify plugged periods (when battery increases)
    const dataWithPluggedInfo = data.map((d, i) => {
        if (i === 0) return { ...d, pluggedIndicator: 0 };
        const diff = d.battery - data[i - 1].battery;
        return {
            ...d,
            pluggedIndicator: diff > 5 ? 10 : 0 // Show bar if significant increase
        };
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-muted-foreground">Battery Level Over Time</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Avg: <span className="font-semibold text-foreground">{avgBattery.toFixed(0)}%</span></span>
                        <span>Min: <span className="font-semibold text-foreground">{minBattery.toFixed(0)}%</span></span>
                        {drainRate > 0 && <span>Drain: <span className="font-semibold text-foreground">~{drainRate.toFixed(1)}%/hr</span></span>}
                    </div>
                </CardTitle>
                <CardDescription>
                    Battery percentage trends •
                    {lowBatteryPeriods > 0 && <span className="text-red-500 ml-1">{lowBatteryPeriods} low battery period(s)</span>}
                    {lowBatteryPeriods === 0 && <span className="text-green-500 ml-1">Good battery health</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={dataWithPluggedInfo} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBattery" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
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
                            domain={[0, 100]}
                            label={{ value: 'Battery %', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                            itemStyle={{ color: "#e5e7eb" }}
                            formatter={(value: number | undefined, name: string | undefined) => {
                                if (name === 'pluggedIndicator') return null; // Hide plugged indicator in tooltip
                                if (value === undefined) return ['0%', 'Battery Level'];
                                return [`${value.toFixed(0)}%`, 'Battery Level'];
                            }}
                            labelFormatter={(label) => `Hour: ${label}:00`}
                        />
                        <Legend />

                        {/* Low battery threshold */}
                        <ReferenceLine
                            y={20}
                            stroke="#ef4444"
                            strokeDasharray="3 3"
                            label={{ value: 'Low Battery', position: 'right', fontSize: 10 }}
                        />
                        <ReferenceLine
                            y={avgBattery}
                            stroke="#8b5cf6"
                            strokeDasharray="5 5"
                            label={{ value: 'Avg', position: 'right', fontSize: 10 }}
                        />

                        {/* Plugged in indicators (subtle bars) */}
                        <Bar
                            dataKey="pluggedIndicator"
                            name="Charging"
                            fill="#f59e0b"
                            opacity={0.5}
                            radius={[4, 4, 0, 0]}
                        />

                        {/* Battery level line */}
                        <Line
                            type="monotone"
                            dataKey="battery"
                            name="Battery Level %"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                const color = payload.battery < 20 ? "#ef4444" : payload.battery < 50 ? "#f59e0b" : "#10b981";
                                return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} />;
                            }}
                            activeDot={{ r: 6 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

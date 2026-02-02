"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface NetworkSignalChartProps {
    data: Array<{
        hour: number;
        signalStrength: number;
        count: number;
    }>;
    disconnectionCount?: number;
}

export default function NetworkSignalChart({ data, disconnectionCount = 0 }: NetworkSignalChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Network Signal</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No signal data available
                </CardContent>
            </Card>
        );
    }

    
    const dBmToPercent = (dbm: number) => {
        const clamped = Math.max(-90, Math.min(-30, dbm));
        return ((clamped + 90) / 60) * 100;
    };

    const signalDataWithPercent = data.map(d => ({
        ...d,
        signalPercent: dBmToPercent(d.signalStrength)
    }));

    const avgSignal = signalDataWithPercent.reduce((a, b) => a + b.signalPercent, 0) / signalDataWithPercent.length;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span className="text-sm font-medium uppercase text-muted-foreground">Network Signal Strength</span>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>Avg Quality: <span className="font-semibold text-foreground">{avgSignal.toFixed(0)}%</span></span>
                        {disconnectionCount > 0 && <span className="text-red-500">{disconnectionCount} disconnect(s)</span>}
                    </div>
                </CardTitle>
                <CardDescription>
                    WiFi signal quality over time •
                    <span className="text-green-500 ml-1">Excellent (&gt;80%)</span>
                    <span className="text-amber-500 ml-2">Good (50-80%)</span>
                    <span className="text-red-500 ml-2">Poor (&lt;50%)</span>
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={signalDataWithPercent} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                            label={{ value: 'Signal %', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                            itemStyle={{ color: "#e5e7eb" }}
                            formatter={(value: number | undefined, name: string | undefined, props: any) => {
                                if (value === undefined) return ['0% (0 dBm)', 'Signal Quality'];
                                const dbm = props.payload.signalStrength;
                                return [`${value.toFixed(0)}% (${dbm} dBm)`, 'Signal Quality'];
                            }}
                            labelFormatter={(label) => `Hour: ${label}:00`}
                        />
                        <Legend />

                        <Line
                            type="monotone"
                            dataKey="signalPercent"
                            name="Signal Quality %"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                const percent = payload.signalPercent;
                                const color = percent > 80 ? "#10b981" : percent > 50 ? "#f59e0b" : "#ef4444";
                                return <circle cx={cx} cy={cy} r={4} fill={color} stroke={color} />;
                            }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}


"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AppStat {
    name: string;
    efficiency: number;
    avgProductivity: number;
    avgDistraction: number;
    count: number;
}

export default function AppEfficiencyChart({ data }: { data: AppStat[] }) {
    // Filter out low usage apps
    const topApps = data.filter(d => d.count > 10).sort((a, b) => b.efficiency - a.efficiency).slice(0, 10);

    return (
        <Card>
            <CardHeader>
                <CardTitle>🏆 App Efficiency Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
                <div style={{ width: "100%", height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                        <BarChart
                            data={topApps}
                            layout="vertical"
                            margin={{
                                top: 5,
                                right: 30,
                                left: 100,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis type="number" domain={[-20, 100]} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={100}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="efficiency" radius={[0, 4, 4, 0]}>
                                {topApps.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.efficiency > 0 ? "#4ade80" : "#f87171"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

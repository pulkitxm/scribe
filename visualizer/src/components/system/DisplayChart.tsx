"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DisplayChartProps {
    darkModeByHour?: Array<{
        hour: number;
        darkModeCount: number;
        lightModeCount: number;
    }>;
    monitorUsage?: Array<{
        type: string; 
        count: number;
    }>;
    externalDisplayCorrelation?: {
        withExternal: { avgFocus: number; count: number };
        withoutExternal: { avgFocus: number; count: number };
    };
}

export default function DisplayChart({ darkModeByHour, monitorUsage, externalDisplayCorrelation }: DisplayChartProps) {
    const hasDarkModeData = darkModeByHour && darkModeByHour.length > 0;
    const hasMonitorData = monitorUsage && monitorUsage.length > 0;
    const hasCorrelationData = externalDisplayCorrelation !== undefined;

    if (!hasDarkModeData && !hasMonitorData) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Display Settings</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No display data available
                </CardContent>
            </Card>
        );
    }

    
    let darkModePercent = 0;
    if (hasDarkModeData) {
        const totalDark = darkModeByHour.reduce((sum, d) => sum + d.darkModeCount, 0);
        const totalLight = darkModeByHour.reduce((sum, d) => sum + d.lightModeCount, 0);
        darkModePercent = ((totalDark / (totalDark + totalLight)) * 100);
    }

    
    const darkModeData = hasDarkModeData
        ? darkModeByHour.map(d => ({
            hour: d.hour,
            "Dark Mode": d.darkModeCount,
            "Light Mode": d.lightModeCount
        }))
        : [];

    const MONITOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

    return (
        <div className="space-y-4">
            {hasDarkModeData && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="text-sm font-medium uppercase text-muted-foreground">Dark Mode Usage by Hour</span>
                            <div className="text-xs text-muted-foreground">
                                Dark Mode: <span className="font-semibold text-foreground">{darkModePercent.toFixed(0)}%</span> of time
                            </div>
                        </CardTitle>
                        <CardDescription>
                            Theme preference throughout the day •
                            <span className="text-blue-400 ml-1">■ Dark Mode</span>
                            <span className="text-amber-400 ml-2">■ Light Mode</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={darkModeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis
                                    dataKey="hour"
                                    stroke="#888888"
                                    fontSize={11}
                                    tickFormatter={(value) => `${value}:00`}
                                />
                                <YAxis stroke="#888888" fontSize={11} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                    itemStyle={{ color: "#e5e7eb" }}
                                    labelFormatter={(label) => `Hour: ${label}:00`}
                                />
                                <Legend />
                                <Bar dataKey="Dark Mode" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Light Mode" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hasMonitorData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                                Monitor Configuration
                            </CardTitle>
                            <CardDescription>External display usage distribution</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={monitorUsage}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        dataKey="count"
                                        label={(props: any) => {
                                            const { name, percent } = props;
                                            return `${name} (${(percent * 100).toFixed(0)}%)`;
                                        }}
                                    >
                                        {monitorUsage.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={MONITOR_COLORS[index % MONITOR_COLORS.length]}
                                                stroke="hsl(var(--card))"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                        itemStyle={{ color: "#e5e7eb" }}
                                        formatter={(value: number | undefined, name: string | undefined) => value !== undefined ? [`${value} captures`, name || ''] : ['0 captures', name || '']}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

                {hasCorrelationData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                                External Monitor Impact
                            </CardTitle>
                            <CardDescription>Focus score correlation with display setup</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            <div className="space-y-6 pt-8">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">With External Display</span>
                                        <span className="text-sm font-bold text-green-500">
                                            {externalDisplayCorrelation.withExternal.avgFocus.toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-3">
                                        <div
                                            className="bg-green-500 h-3 rounded-full transition-all"
                                            style={{ width: `${externalDisplayCorrelation.withExternal.avgFocus}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {externalDisplayCorrelation.withExternal.count} captures
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium">Without External Display</span>
                                        <span className="text-sm font-bold text-blue-500">
                                            {externalDisplayCorrelation.withoutExternal.avgFocus.toFixed(0)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-3">
                                        <div
                                            className="bg-blue-500 h-3 rounded-full transition-all"
                                            style={{ width: `${externalDisplayCorrelation.withoutExternal.avgFocus}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {externalDisplayCorrelation.withoutExternal.count} captures
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-border">
                                    <div className="text-center">
                                        {externalDisplayCorrelation.withExternal.avgFocus > externalDisplayCorrelation.withoutExternal.avgFocus ? (
                                            <div className="text-sm">
                                                <span className="text-green-500 font-semibold">
                                                    +{(externalDisplayCorrelation.withExternal.avgFocus - externalDisplayCorrelation.withoutExternal.avgFocus).toFixed(0)}%
                                                </span>
                                                <span className="text-muted-foreground ml-1">focus boost with external monitor</span>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">
                                                No significant difference detected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

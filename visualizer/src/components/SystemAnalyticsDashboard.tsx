"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";

interface SystemStats {
    learningTopics: Record<string, number>;
    communicationPlatforms: Record<string, number>;
    entertainmentTypes: Record<string, number>;
    audioInputDevices: Record<string, number>;
    audioOutputDevices: Record<string, number>;
    hourlyTrends: {
        hour: number;
        cpu: number;
        ram: number;
        volume: number;
        battery: number;
    }[];
}

interface Props {
    stats: SystemStats;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#a855f7', '#ec4899', '#f43f5e'];

export default function SystemAnalyticsDashboard({ stats }: Props) {
    const learningData = Object.entries(stats.learningTopics).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    const commData = Object.entries(stats.communicationPlatforms).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const entData = Object.entries(stats.entertainmentTypes).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const audioInData = Object.entries(stats.audioInputDevices).map(([name, value]) => ({ name, value }));
    const audioOutData = Object.entries(stats.audioOutputDevices).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">System & Context Analytics</h2>

            {/* System Health Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>System Load (Hourly Avg)</CardTitle>
                        <CardDescription>CPU (%) and RAM (GB) usage patterns throughout the day</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats.hourlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="hour" stroke="#888888" fontSize={12} tickFormatter={(value) => `${value}:00`} />
                                <YAxis yAxisId="left" stroke="#888888" fontSize={12} />
                                <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                    itemStyle={{ color: "#e5e7eb" }}
                                />
                                <Legend />
                                <Line yAxisId="left" type="monotone" dataKey="cpu" name="CPU %" stroke="#f43f5e" strokeWidth={2} dot={false} />
                                <Line yAxisId="right" type="monotone" dataKey="ram" name="RAM (GB)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Environment (Audio & Battery)</CardTitle>
                        <CardDescription>Volume levels and Battery state trends</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.hourlyTrends}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="hour" stroke="#888888" fontSize={12} tickFormatter={(value) => `${value}:00`} />
                                <YAxis stroke="#888888" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                    itemStyle={{ color: "#e5e7eb" }}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="battery" name="Battery %" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                                <Area type="monotone" dataKey="volume" name="Volume %" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Context Distribution */}
            <h3 className="text-xl font-semibold mt-8 mb-4">Context Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Learning Topics</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        {learningData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={learningData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }: { name: string; percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {learningData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">No learning data</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Communication Apps</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        {commData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={commData} layout="vertical" margin={{ left: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none" }} />
                                    <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                                        {commData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">No communication data</div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Audio Inputs</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                        <div className="space-y-4 pt-4">
                            {audioInData.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <span>{item.name}</span>
                                    <Badge variant="secondary">{item.value}x</Badge>
                                </div>
                            ))}
                            {audioInData.length === 0 && <div className="text-center text-muted-foreground">No input devices recorded</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

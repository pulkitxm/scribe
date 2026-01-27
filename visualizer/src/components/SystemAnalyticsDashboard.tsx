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
            {/* Context Distribution */}
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
                                        label={(props: any) => {
                                            const { name, percent } = props;
                                            if (!name || percent === undefined) return null;
                                            const val = (percent * 100).toFixed(0);
                                            if (percent < 0.05) return null;
                                            return `${name.substring(0, 12)}${name.length > 12 ? '..' : ''} ${val}%`;
                                        }}
                                        labelLine={{ stroke: '#6b7280' }}
                                    >
                                        {learningData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="hsl(var(--card))" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                        itemStyle={{ color: "#e5e7eb" }}
                                    />
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
                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: "#888888" }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                                        itemStyle={{ color: "#e5e7eb" }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
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

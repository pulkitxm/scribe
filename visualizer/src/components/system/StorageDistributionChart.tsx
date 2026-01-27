"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface StorageDistributionChartProps {
    used: number;
    free: number;
    total: number;
}

export default function StorageDistributionChart({ used, free, total }: StorageDistributionChartProps) {
    const pieData = [
        { name: 'Used', value: used, color: '#3b82f6' },
        { name: 'Free', value: free, color: '#10b981' }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
                    Current Storage Distribution
                </CardTitle>
                <CardDescription>
                    Latest snapshot: {used.toFixed(1)} GB used / {free.toFixed(1)} GB free
                </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={2}
                            dataKey="value"
                            label={(props: any) => {
                                const { name, value } = props;
                                const percent = ((value / total) * 100).toFixed(1);
                                return `${name}: ${value.toFixed(0)} GB (${percent}%)`;
                            }}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--card))" strokeWidth={2} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px" }}
                            itemStyle={{ color: "#e5e7eb" }}
                            formatter={(value: number | undefined) => {
                                if (value === undefined) return ['0 GB (0%)', ''];
                                const percent = ((value / total) * 100).toFixed(1);
                                return [`${value.toFixed(1)} GB (${percent}%)`, ''];
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

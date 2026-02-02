"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

interface CPUChartProps {
  data: Array<{ hour: number; cpu: number; count: number }>;
}

export default function CPUChart({ data }: CPUChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
            CPU Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No CPU data available
        </CardContent>
      </Card>
    );
  }

  const cpuValues = data.map((d) => d.cpu);
  const avgCPU = cpuValues.reduce((a, b) => a + b, 0) / cpuValues.length;
  const maxCPU = Math.max(...cpuValues);
  const minCPU = Math.min(...cpuValues);
  const peakHour = data.find((d) => d.cpu === maxCPU)?.hour || 0;

  const getColor = (value: number) => {
    if (value < 30) return "#10b981";
    if (value < 70) return "#f59e0b";
    return "#ef4444";
  };

  const enhancedData = data.map((d) => ({
    ...d,
    color: getColor(d.cpu),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-sm font-medium uppercase text-muted-foreground">
            CPU Usage Over Time
          </span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              Avg:{" "}
              <span className="font-semibold text-foreground">
                {avgCPU.toFixed(1)}%
              </span>
            </span>
            <span>
              Peak:{" "}
              <span className="font-semibold text-foreground">
                {maxCPU.toFixed(1)}%
              </span>{" "}
              @{peakHour}:00
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Hourly CPU utilization patterns •
          <span className="text-green-500 ml-1">Low (&lt;30%)</span>
          <span className="text-amber-500 ml-2">Medium (30-70%)</span>
          <span className="text-red-500 ml-2">High (&gt;70%)</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={enhancedData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
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
              label={{
                value: "CPU %",
                angle: -90,
                position: "insideLeft",
                style: { fontSize: 11 },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
              }}
              itemStyle={{ color: "#e5e7eb" }}
              formatter={(value: number | undefined) =>
                value !== undefined
                  ? [`${value.toFixed(1)}%`, "CPU Usage"]
                  : ["0%", "CPU Usage"]
              }
              labelFormatter={(label) => `Hour: ${label}:00`}
            />
            <Legend />

            {}
            <ReferenceLine
              y={30}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{ value: "Low", position: "right", fontSize: 10 }}
            />
            <ReferenceLine
              y={70}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: "High", position: "right", fontSize: 10 }}
            />
            <ReferenceLine
              y={avgCPU}
              stroke="#8b5cf6"
              strokeDasharray="5 5"
              label={{ value: "Avg", position: "right", fontSize: 10 }}
            />

            <Line
              type="monotone"
              dataKey="cpu"
              name="CPU Usage %"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

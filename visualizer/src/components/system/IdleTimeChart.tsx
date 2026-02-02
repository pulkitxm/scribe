"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

interface IdleTimeChartProps {
  distributionData?: Array<{
    range: string;
    count: number;
    isBreak?: boolean;
  }>;
  hourlyIdleData?: Array<{
    hour: number;
    avgIdleSeconds: number;
    activeMinutes: number;
    passiveMinutes: number;
  }>;
}

export default function IdleTimeChart({
  distributionData,
  hourlyIdleData,
}: IdleTimeChartProps) {
  const hasDistribution = distributionData && distributionData.length > 0;
  const hasHourlyData = hourlyIdleData && hourlyIdleData.length > 0;

  if (!hasDistribution && !hasHourlyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
            Activity & Idle Time
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No idle time data available
        </CardContent>
      </Card>
    );
  }

  const totalCaptures = hasDistribution
    ? distributionData.reduce((sum, d) => sum + d.count, 0)
    : 0;
  const breakCount = hasDistribution
    ? distributionData
        .filter((d) => d.isBreak)
        .reduce((sum, d) => sum + d.count, 0)
    : 0;
  const breakPercent =
    totalCaptures > 0 ? (breakCount / totalCaptures) * 100 : 0;

  const totalActiveTime = hasHourlyData
    ? hourlyIdleData.reduce((sum, d) => sum + d.activeMinutes, 0)
    : 0;
  const totalPassiveTime = hasHourlyData
    ? hourlyIdleData.reduce((sum, d) => sum + d.passiveMinutes, 0)
    : 0;
  const activePercent =
    totalActiveTime + totalPassiveTime > 0
      ? (totalActiveTime / (totalActiveTime + totalPassiveTime)) * 100
      : 0;

  const getColor = (range: string, isBreak?: boolean) => {
    if (isBreak) return "#ef4444";
    if (range.includes("0-5")) return "#10b981";
    if (range.includes("5-30")) return "#3b82f6";
    return "#f59e0b";
  };

  return (
    <div className="space-y-4">
      {hasDistribution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                Idle Time Distribution
              </span>
              <div className="text-xs text-muted-foreground">
                Breaks (&gt;5min):{" "}
                <span className="font-semibold text-foreground">
                  {breakCount}
                </span>{" "}
                ({breakPercent.toFixed(0)}%)
              </div>
            </CardTitle>
            <CardDescription>
              Histogram of idle periods between screenshots •
              <span className="text-green-500 ml-1">■ Active (0-5s)</span>
              <span className="text-blue-500 ml-2">■ Short idle (5-30s)</span>
              <span className="text-amber-500 ml-2">■ Moderate (30s-5m)</span>
              <span className="text-red-500 ml-2">■ Break (5m+)</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="range" stroke="#888888" fontSize={11} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  label={{
                    value: "Count",
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
                  formatter={(
                    value: number | undefined,
                    name: string | undefined,
                    props: any,
                  ) => {
                    if (value === undefined)
                      return ["0 captures (0%)", "Count"];
                    const percent = ((value / totalCaptures) * 100).toFixed(1);
                    return [`${value} captures (${percent}%)`, "Count"];
                  }}
                />
                <Bar dataKey="count" name="Idle Periods" radius={[4, 4, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getColor(entry.range, entry.isBreak)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {hasHourlyData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-sm font-medium uppercase text-muted-foreground">
                Active vs Passive Time by Hour
              </span>
              <div className="text-xs text-muted-foreground">
                Active Work:{" "}
                <span className="font-semibold text-foreground">
                  {activePercent.toFixed(0)}%
                </span>
              </div>
            </CardTitle>
            <CardDescription>
              Breakdown of active work time vs passive viewing throughout the
              day
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourlyIdleData}
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
                  label={{
                    value: "Minutes",
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
                  formatter={(
                    value: number | undefined,
                    name: string | undefined,
                  ) =>
                    value !== undefined
                      ? [`${value.toFixed(1)} min`, name || ""]
                      : ["0 min", name || ""]
                  }
                  labelFormatter={(label) => `Hour: ${label}:00`}
                />
                <Legend />
                <Bar
                  dataKey="activeMinutes"
                  name="Active Work"
                  stackId="a"
                  fill="#10b981"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="passiveMinutes"
                  name="Passive/Idle"
                  stackId="a"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";

interface AudioVolumeChartProps {
  data: Array<{
    hour: number;
    volume: number;
    count: number;
    mutedCount?: number;
  }>;
}

export default function AudioVolumeChart({ data }: AudioVolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
            Audio Volume
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No audio data available
        </CardContent>
      </Card>
    );
  }

  const volumeValues = data.map((d) => d.volume);
  const avgVolume =
    volumeValues.reduce((a, b) => a + b, 0) / volumeValues.length;
  const maxVolume = Math.max(...volumeValues);
  const minVolume = Math.min(...volumeValues);

  const silentPeriods = data.filter((d) => d.volume === 0).length;
  const lowVolumePeriods = data.filter(
    (d) => d.volume > 0 && d.volume < 20,
  ).length;

  const peakHours = data.filter((d) => d.volume > 50).map((d) => d.hour);
  const avgPeakHour =
    peakHours.length > 0
      ? Math.round(peakHours.reduce((a, b) => a + b, 0) / peakHours.length)
      : 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-sm font-medium uppercase text-muted-foreground">
            Audio Volume Over Time
          </span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>
              Avg:{" "}
              <span className="font-semibold text-foreground">
                {avgVolume.toFixed(0)}%
              </span>
            </span>
            <span>
              Range:{" "}
              <span className="font-semibold text-foreground">
                {minVolume.toFixed(0)}-{maxVolume.toFixed(0)}%
              </span>
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Volume levels throughout the day •
          {silentPeriods > 0 && (
            <span className="text-muted-foreground ml-1">
              {silentPeriods} silent hour(s)
            </span>
          )}
          {lowVolumePeriods > 0 && (
            <span className="text-muted-foreground ml-2">
              • {lowVolumePeriods} low volume period(s)
            </span>
          )}
          {peakHours.length > 0 && (
            <span className="text-muted-foreground ml-2">
              • Peak activity ~{avgPeakHour}:00
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
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
              label={{
                value: "Volume %",
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
              formatter={(value: number | undefined) => {
                if (value === undefined) return ["0%", "Volume"];
                if (value === 0) return ["Muted", "Volume"];
                return [`${value.toFixed(0)}%`, "Volume Level"];
              }}
              labelFormatter={(label) => `Hour: ${label}:00`}
            />
            <Legend />

            {}
            <ReferenceLine
              y={50}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{ value: "Medium", position: "right", fontSize: 10 }}
            />
            <ReferenceLine
              y={avgVolume}
              stroke="#8b5cf6"
              strokeDasharray="5 5"
              label={{ value: "Avg", position: "right", fontSize: 10 }}
            />

            <Area
              type="monotone"
              dataKey="volume"
              name="Volume Level %"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#colorVolume)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

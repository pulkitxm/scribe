"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { DefaultLegendContentProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: Record<string, number | { count: number; avgProductivity?: number }>;
  title: string;
  limit?: number;
}

const DEFAULT_CATEGORY_LIMIT = 12;

export default function CategoryChart({ data, title, limit }: Props) {
  let chartDataRaw = Object.entries(data)
    .map(([name, value]) => {
      if (typeof value === "number") {
        return { name, value };
      }
      return { name, value: value.count };
    })
    .sort((a, b) => b.value - a.value);

  const effectiveLimit = limit ?? DEFAULT_CATEGORY_LIMIT;
  chartDataRaw = chartDataRaw.slice(0, effectiveLimit);

  const chartData = chartDataRaw;

  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--muted-foreground))",
    "hsl(var(--border))",
    "hsl(var(--muted))",
  ];

  const renderLegend = (props: DefaultLegendContentProps) => {
    const payload = props.payload ?? [];
    return (
      <div className="flex justify-center overflow-y-auto max-h-24 mt-2">
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 list-none m-0 p-0">
          {payload.map((entry, index) => (
            <li
              key={index}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              <span
                className="inline-block shrink-0 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.value}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (chartData.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer
            width="100%"
            height="100%"
            minWidth={0}
            minHeight={0}
          >
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--foreground))",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend verticalAlign="bottom" content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

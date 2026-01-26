"use client";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DayActivity {
    date: string;
    count: number;
    avgFocus: number;
}

interface ActivityHeatmapProps {
    data: DayActivity[];
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    const today = new Date();
    const weeks = 20;

    const grid: (DayActivity | null)[][] = Array.from({ length: 7 }, () =>
        Array.from({ length: weeks }, () => null)
    );

    const dataMap = new Map<string, DayActivity>();
    data.forEach(d => dataMap.set(d.date, d));

    const getRowIndex = (d: Date) => (d.getDay() + 6) % 7;

    for (let w = weeks - 1; w >= 0; w--) {
        for (let r = 6; r >= 0; r--) {
            const daysOffset = (weeks - 1 - w) * 7 + (getRowIndex(today) - r);

            if (daysOffset < 0) {
                continue;
            }

            const d = new Date(today);
            d.setDate(d.getDate() - daysOffset);
            const dateStr = d.toISOString().split("T")[0];

            const activity = dataMap.get(dateStr) || { date: dateStr, count: 0, avgFocus: 0 };
            grid[r][w] = activity;
        }
    }

    const getColor = (count: number) => {
        if (count === 0) return "bg-muted/40";
        if (count < 5) return "bg-primary/20";
        if (count < 15) return "bg-primary/40";
        if (count < 30) return "bg-primary/60";
        if (count < 50) return "bg-primary/80";
        return "bg-primary";
    };

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const weekLabels: string[] = [];

    for (let w = 0; w < weeks; w++) {
        const cell = grid[0][w] || grid[6][w];
        if (cell) {
            const d = new Date(cell.date);
            if (d.getDate() <= 7) {
                weekLabels.push(months[d.getMonth()]);
            } else {
                weekLabels.push("");
            }
        } else {
            weekLabels.push("");
        }
    }

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-fit p-4 bg-card border border-border rounded-lg">
                <h3 className="text-sm font-medium text-foreground mb-4">Activity Patterns</h3>

                <div className="flex">
                    <div className="flex flex-col justify-between text-[10px] text-muted-foreground mr-2 h-[86px] py-1">
                        <span>Mon</span>
                        <span>Wed</span>
                        <span>Fri</span>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex text-[10px] text-muted-foreground ml-[1px] h-3">
                            {weekLabels.map((l, i) => (
                                <div key={i} className="w-3 mx-[1px] overflow-visible whitespace-nowrap">{l}</div>
                            ))}
                        </div>

                        <div className="flex gap-[2px]">
                            {Array.from({ length: weeks }).map((_, w) => (
                                <div key={w} className="flex flex-col gap-[2px]">
                                    {Array.from({ length: 7 }).map((_, r) => {
                                        const cell = grid[r][w];
                                        if (!cell) return <div key={r} className="w-3 h-3" />;

                                        return (
                                            <TooltipProvider key={r}>
                                                <Tooltip delayDuration={100}>
                                                    <TooltipTrigger>
                                                        <div className={cn("w-3 h-3 rounded-[2px]", getColor(cell.count))} />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="text-xs">
                                                            <div className="font-semibold">{cell.date}</div>
                                                            <div>{cell.count} screenshots</div>
                                                            <div>Focus: {cell.avgFocus}</div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

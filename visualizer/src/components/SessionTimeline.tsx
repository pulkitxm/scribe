
import { Session } from "@/types/screenshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export default function SessionTimeline({ sessions }: { sessions: Session[] }) {
    if (!sessions.length) return null;

    // Filter to today (or range, but for now assuming single day timeline for clarity)
    // Actually, if we pass multiple days, we might want one row per day.
    // Let's assume sessions are pre-filtered for the view context.

    // Group by day for multi-day support
    const sessionsByDay: Record<string, Session[]> = {};
    sessions.forEach(s => {
        const day = s.startTime.toLocaleDateString();
        if (!sessionsByDay[day]) sessionsByDay[day] = [];
        sessionsByDay[day].push(s);
    });

    const days = Object.keys(sessionsByDay).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <Card>
            <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    ⏳ Session Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {days.slice(0, 5).map(day => (
                        <DayTimeline key={day} day={day} sessions={sessionsByDay[day]} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

function DayTimeline({ day, sessions }: { day: string, sessions: Session[] }) {
    // Sort sessions by start time
    const sortedSessions = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Normalize to 0-24h
    const startOfDay = new Date(sortedSessions[0].startTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(sortedSessions[0].startTime);
    endOfDay.setHours(23, 59, 59, 999);

    const totalMs = 24 * 60 * 60 * 1000;

    return (
        <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">{day}</div>
            <div className="relative h-12 bg-secondary/30 rounded-md w-full overflow-hidden flex items-center">
                {/* Hour markers */}
                {Array.from({ length: 24 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute h-full border-l border-border/10 text-[10px] text-muted-foreground/30 pl-1 pt-1"
                        style={{ left: `${(i / 24) * 100}%` }}
                    >
                        {i}
                    </div>
                ))}

                {sortedSessions.map(session => {
                    const startOffset = session.startTime.getTime() - startOfDay.getTime();
                    const duration = session.endTime.getTime() - session.startTime.getTime();

                    const leftPct = Math.max(0, (startOffset / totalMs) * 100);
                    const widthPct = Math.min(100 - leftPct, (duration / totalMs) * 100);

                    // Min width for visibility
                    const finalWidth = Math.max(widthPct, 0.2);

                    let colorClass = "bg-gray-500";
                    if (session.avgFocusScore > 75) colorClass = "bg-green-500";
                    else if (session.avgDistractionScore > 50) colorClass = "bg-red-500";
                    else if (session.category === "coding") colorClass = "bg-blue-500";
                    else if (session.category === "meeting") colorClass = "bg-yellow-500";

                    return (
                        <TooltipProvider key={session.id}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "absolute h-8 rounded-sm mx-[1px] cursor-pointer hover:brightness-110 transition-all",
                                            colorClass
                                        )}
                                        style={{
                                            left: `${leftPct}%`,
                                            width: `${finalWidth}%`
                                        }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-xs">
                                        <div className="font-bold">{session.category}</div>
                                        <div>{session.dominantApp}</div>
                                        <div>{session.startTime.toLocaleTimeString()} - {session.endTime.toLocaleTimeString()}</div>
                                        <div>Focus: {session.avgFocusScore}</div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    );
                })}
            </div>
        </div>
    );
}

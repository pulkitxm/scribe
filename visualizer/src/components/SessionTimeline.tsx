"use client";

import { Session } from "@/types/screenshot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useRef, useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { DataSet } from "vis-data";
import { Timeline } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { useRouter } from "next/navigation";

export default function SessionTimeline({ sessions: rawSessions }: { sessions: any[] }) {
    if (!rawSessions?.length) return null;

    const timelineRef = useRef<HTMLDivElement>(null);
    const timelineInstance = useRef<Timeline | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!timelineRef.current) return;

        // Normalize dates
        const sessions: Session[] = rawSessions.map(s => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: new Date(s.endTime)
        }));

        // Group sessions by day for groups
        const sessionsByDay: Record<string, Session[]> = {};
        sessions.forEach(s => {
            const day = s.startTime.toLocaleDateString();
            if (!sessionsByDay[day]) sessionsByDay[day] = [];
            sessionsByDay[day].push(s);
        });

        // Create groups for each day
        const days = Object.keys(sessionsByDay).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        const groups = new DataSet(
            days.map((day, idx) => {
                let displayDay = day;
                try {
                    const d = new Date(day);
                    if (!isNaN(d.getTime())) {
                        displayDay = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                    }
                } catch { }
                return {
                    id: idx,
                    content: displayDay,
                    className: 'timeline-group',
                };
            })
        );

        // Create items for sessions
        const items = new DataSet(
            sessions.map(session => {
                const day = session.startTime.toLocaleDateString();
                const groupId = days.indexOf(day);

                // Determine color class based on session properties
                let className = "session-default";
                if (session.avgFocusScore > 75) className = "session-focus";
                else if (session.avgDistractionScore > 40) className = "session-distracted";
                else if (session.category === "coding") className = "session-coding";
                else if (session.category === "meeting") className = "session-meeting";

                return {
                    id: session.id,
                    group: groupId,
                    start: session.startTime,
                    end: session.endTime,
                    content: '',
                    className,
                    type: 'range',
                    title: `${session.category} - ${session.dominantApp}<br/>Focus: ${Math.round(session.avgFocusScore)} | Distraction: ${Math.round(session.avgDistractionScore)}`,
                };
            })
        );

        // Timeline options
        const options = {
            stack: true,
            stackSubgroups: true,
            showCurrentTime: true,
            zoomMin: 1000 * 60 * 10, // 10 minutes
            zoomMax: 1000 * 60 * 60 * 24 * 7, // 1 week
            orientation: { axis: 'top' as const, item: 'top' as const },
            height: '400px',
            margin: {
                item: {
                    horizontal: 0,
                    vertical: 8
                },
                axis: 5,
            },
            groupHeightMode: 'auto' as const,
            groupOrder: (a: any, b: any) => a.id - b.id,
            verticalScroll: true,
            horizontalScroll: true,
            zoomKey: 'ctrlKey' as const,
        };

        // Create timeline
        const timeline = new Timeline(timelineRef.current, items, groups, options);
        timelineInstance.current = timeline;

        // Handle click events to navigate to session detail
        timeline.on('select', (properties: any) => {
            if (properties.items.length > 0) {
                const sessionId = properties.items[0];
                router.push(`/sessions/${sessionId}`);
            }
        });

        // Cleanup
        return () => {
            if (timelineInstance.current) {
                timelineInstance.current.destroy();
                timelineInstance.current = null;
            }
        };
    }, [rawSessions, router]);

    const handleReset = () => {
        if (timelineInstance.current) {
            timelineInstance.current.fit();
        }
    };

    return (
        <Card className="w-full shadow-md border-border/60">
            <CardHeader className="pb-4 pt-5 px-6 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    Session Timeline
                </CardTitle>
                <button
                    onClick={handleReset}
                    className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground"
                    title="Fit to View"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div ref={timelineRef} className="timeline-container" />
                <div className="mt-3 flex justify-end items-center text-[10px] text-muted-foreground px-1">
                    <div className="flex gap-3">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500/80"></div> Focus</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500/80"></div> Coding</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500/80"></div> Meeting</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500/80"></div> Distracted</div>
                    </div>
                </div>
                <style jsx global>{`
                    .timeline-container .vis-timeline {
                        border: 1px solid hsl(var(--border));
                        border-radius: 0.5rem;
                        background: rgba(9, 9, 11, 0.4);
                        font-family: inherit;
                    }

                    .timeline-container .vis-panel.vis-background {
                        background: transparent;
                    }

                    .timeline-container .vis-panel.vis-center,
                    .timeline-container .vis-panel.vis-left,
                    .timeline-container .vis-panel.vis-right,
                    .timeline-container .vis-panel.vis-top,
                    .timeline-container .vis-panel.vis-bottom {
                        border-color: rgba(255, 255, 255, 0.05);
                    }

                    .timeline-container .vis-time-axis .vis-text {
                        color: hsl(var(--muted-foreground));
                        font-size: 11px;
                    }

                    .timeline-container .vis-time-axis .vis-grid.vis-minor {
                        border-color: rgba(255, 255, 255, 0.05);
                    }

                    .timeline-container .vis-time-axis .vis-grid.vis-major {
                        border-color: rgba(255, 255, 255, 0.15);
                    }

                    .timeline-container .vis-labelset .vis-label {
                        color: hsl(var(--muted-foreground));
                        border-color: rgba(255, 255, 255, 0.05);
                        font-size: 10px;
                        font-weight: 500;
                        background: transparent;
                    }

                    .timeline-container .vis-item {
                        border-radius: 3px;
                        border-width: 2px;
                        border-left-width: 3px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .timeline-container .vis-item:hover {
                        filter: brightness(1.2);
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
                        z-index: 999 !important;
                    }

                    .timeline-container .vis-item.vis-selected {
                        border-width: 2px;
                        border-left-width: 3px;
                        filter: brightness(1.1);
                    }

                    .timeline-container .vis-item.session-focus {
                        background-color: rgba(16, 185, 129, 0.9);
                        border-color: rgba(16, 185, 129, 0.5);
                    }

                    .timeline-container .vis-item.session-coding {
                        background-color: rgba(59, 130, 246, 0.9);
                        border-color: rgba(59, 130, 246, 0.5);
                    }

                    .timeline-container .vis-item.session-meeting {
                        background-color: rgba(245, 158, 11, 0.9);
                        border-color: rgba(245, 158, 11, 0.5);
                    }

                    .timeline-container .vis-item.session-distracted {
                        background-color: rgba(244, 63, 94, 0.9);
                        border-color: rgba(244, 63, 94, 0.5);
                    }

                    .timeline-container .vis-item.session-default {
                        background-color: rgba(100, 116, 139, 0.9);
                        border-color: rgba(100, 116, 139, 0.5);
                    }

                    .timeline-container .vis-current-time {
                        background-color: rgba(239, 68, 68, 0.6);
                    }

                    .timeline-container .vis-custom-time {
                        background-color: rgba(59, 130, 246, 0.6);
                    }
                `}</style>
            </CardContent>
        </Card>
    );
}

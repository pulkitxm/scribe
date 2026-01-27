import { getSessionById, getExtendedStats } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import HourlyChart from "@/components/HourlyChart";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Zap, Target, AlertTriangle } from "lucide-react";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = getSessionById(id);

    if (!session) {
        return notFound();
    }

    // Calculate local stats for charts
    const { hourlyContextSwitches } = getExtendedStats(session.screenshots);

    return (
        <div className="space-y-6 container py-8 max-w-6xl mx-auto">
            <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 pl-0 hover:pl-2 transition-all">
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
            </Link>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold tracking-tight">Session Details</h1>
                        <Badge variant={session.avgFocusScore > 70 ? "default" : "secondary"}>
                            {session.category}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{session.startTime.toLocaleString()}</span>
                        <span>—</span>
                        <span>{session.endTime.toLocaleTimeString()}</span>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-mono font-bold">{Math.round(session.durationSeconds / 60)}<span className="text-lg font-sans font-normal text-muted-foreground ml-1">min</span></div>
                    <div className="text-muted-foreground text-sm">Duration</div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Focus</div>
                            <Target className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-3xl font-bold">{session.avgFocusScore}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Productivity</div>
                            <Zap className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-3xl font-bold">{session.avgProductivityScore}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Context Switches</div>
                            <div className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">Count</div>
                        </div>
                        <div className="text-3xl font-bold">{session.contextSwitches}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start mb-2">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Interruptions</div>
                            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="text-3xl font-bold">{session.interruptions}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <HourlyChart data={hourlyContextSwitches} title="Context Switches (During Session)" />
                <div className="space-y-4">
                    <div className="bg-card rounded-lg border p-6 h-full">
                        <h3 className="font-semibold mb-4">Session Summary</h3>
                        <dl className="grid grid-cols-1 gap-4 text-sm">
                            <div className="flex justify-between py-2 border-b">
                                <dt className="text-muted-foreground">Dominant App</dt>
                                <dd className="font-medium">{session.dominantApp}</dd>
                            </div>
                            {session.dominantProject && (
                                <div className="flex justify-between py-2 border-b">
                                    <dt className="text-muted-foreground">Project</dt>
                                    <dd className="font-medium">{session.dominantProject}</dd>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-b">
                                <dt className="text-muted-foreground">Context Switch Rate</dt>
                                <dd className="font-medium">{(session.contextSwitches / (session.durationSeconds / 3600)).toFixed(1)} / hr</dd>
                            </div>
                            <div className="flex justify-between py-2 border-b">
                                <dt className="text-muted-foreground">Screenshots</dt>
                                <dd className="font-medium">{session.screenshotCount}</dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>

            <section>
                <h2 className="text-lg font-semibold mb-4">Screenshots ({session.screenshotCount})</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {session.screenshots.map(s => (
                        <Link key={s.id} href={`/gallery/${s.date}/${s.id}`}>
                            <Card className="overflow-hidden hover:border-primary/50 transition-all cursor-pointer group hover:shadow-md">
                                <div className="relative aspect-video">
                                    <Image
                                        src={s.imagePath}
                                        alt={s.data.short_description}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Badge className={s.data.scores.focus_score > 70 ? "bg-green-500" : "bg-yellow-500"}>
                                            {s.data.scores.focus_score} Focus
                                        </Badge>
                                    </div>
                                </div>
                                <div className="p-2">
                                    <div className="text-xs font-medium truncate">{s.data.evidence?.active_app_guess}</div>
                                    <div className="text-[10px] text-muted-foreground">{s.timestamp.toLocaleTimeString()}</div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}

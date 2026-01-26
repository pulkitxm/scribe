import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getScreenshotById, getScreenshotsForDate, getAllDates } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CategoryLink, TagLink, ProjectLink, AppLink, TextLink } from "@/components/SmartLinks";

interface PageProps {
    params: Promise<{
        date: string;
        id: string;
    }>;
}

export default async function ScreenshotDetailPage({ params }: PageProps) {
    const { date, id } = await params;
    const screenshot = getScreenshotById(date, id);

    if (!screenshot) {
        notFound();
    }

    const allDates = getAllDates();
    const allScreenshots: { date: string; id: string }[] = [];

    for (const d of allDates) {
        const screenshots = getScreenshotsForDate(d);
        for (const s of screenshots) {
            allScreenshots.push({ date: d, id: s.id });
        }
    }

    const currentIndex = allScreenshots.findIndex(
        (s) => s.date === date && s.id === id
    );
    const prevScreenshot = currentIndex > 0 ? allScreenshots[currentIndex - 1] : null;
    const nextScreenshot = currentIndex < allScreenshots.length - 1 ? allScreenshots[currentIndex + 1] : null;

    const { data } = screenshot;
    const timestamp = screenshot.timestamp.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" asChild className="cursor-pointer">
                        <Link href="/gallery">
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Back to Gallery
                        </Link>
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <div>
                        <h1 className="text-lg font-semibold text-foreground">{timestamp}</h1>
                        <p className="text-sm text-muted-foreground">{data.short_description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {prevScreenshot ? (
                        <Button variant="outline" size="icon" asChild className="cursor-pointer">
                            <Link href={`/gallery/${prevScreenshot.date}/${prevScreenshot.id}`}>
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="outline" size="icon" disabled>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )}
                    {nextScreenshot ? (
                        <Button variant="outline" size="icon" asChild className="cursor-pointer">
                            <Link href={`/gallery/${nextScreenshot.date}/${nextScreenshot.id}`}>
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    ) : (
                        <Button variant="outline" size="icon" disabled>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardContent className="p-0">
                            <Image
                                src={screenshot.imagePath}
                                alt={data.short_description}
                                width={1200}
                                height={675}
                                className="w-full h-auto rounded-lg"
                                priority
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                AI Analysis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground leading-relaxed">
                                {data.detailed_analysis}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Intent
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-foreground">{data.context.intent_guess}</p>
                        </CardContent>
                    </Card>

                    {data.actions_observed.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Actions Observed
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {data.actions_observed.map((action, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                                            <span className="text-muted-foreground">→</span>
                                            {action}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}

                    {data.evidence.text_snippets.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Text Snippets Detected
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.evidence.text_snippets.map((snippet, i) => (
                                    <TextLink
                                        key={i}
                                        text={snippet}
                                        className="block px-3 py-2 bg-muted rounded text-xs font-mono break-all hover:bg-primary/10 hover:text-primary no-underline"
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Scores
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {data.scores.focus_score}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase">Focus</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {data.scores.productivity_score}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase">Productivity</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-foreground">
                                        {data.scores.distraction_risk}
                                    </div>
                                    <div className="text-xs text-muted-foreground uppercase">Distraction</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Overall Activity</span>
                                    <span className="font-medium">{data.overall_activity_score}</span>
                                </div>
                                <Progress value={data.overall_activity_score} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Category</span>
                                <CategoryLink category={data.category} />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Workspace</span>
                                <Link
                                    href={`/analytics/workspaces/${encodeURIComponent(data.workspace_type)}`}
                                    className="hover:underline text-foreground decoration-primary underline-offset-4"
                                >
                                    {data.workspace_type}
                                </Link>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Active App</span>
                                <AppLink app={data.evidence.active_app_guess} className="text-foreground" />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Confidence</span>
                                <span className="text-foreground">{Math.round(data.confidence * 100)}%</span>
                            </div>
                        </CardContent>
                    </Card>

                    {data.context.code_context?.language && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Code Context
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Language</span>
                                    <Link
                                        href={`/analytics/languages/${encodeURIComponent(data.context.code_context.language)}`}
                                        className="hover:underline text-foreground decoration-primary underline-offset-4"
                                    >
                                        <Badge variant="outline" className="cursor-pointer hover:bg-accent">{data.context.code_context.language}</Badge>
                                    </Link>
                                </div>
                                {data.context.code_context.repo_or_project && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Project</span>
                                        <ProjectLink
                                            project={data.context.code_context.repo_or_project}
                                            className="text-right max-w-[180px] truncate"
                                        />
                                    </div>
                                )}
                                {data.context.code_context.tools_or_frameworks.length > 0 && (
                                    <div>
                                        <span className="text-xs text-muted-foreground">Tools & Frameworks</span>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {data.context.code_context.tools_or_frameworks.map((t, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {t}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Apps Visible
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1">
                                {data.evidence.apps_visible.map((app, i) => (
                                    <AppLink key={i} app={app}>
                                        <Badge variant="secondary" className="text-xs pointer-events-none">
                                            {app}
                                        </Badge>
                                    </AppLink>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {data.evidence.web_domains_visible.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                    Web Domains
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-1">
                                    {data.evidence.web_domains_visible.map((domain, i) => (
                                        <Link
                                            key={i}
                                            href={`/analytics/domains/${encodeURIComponent(domain)}`}
                                            className="cursor-pointer"
                                        >
                                            <Badge variant="outline" className="text-xs hover:bg-accent hover:border-primary/50 transition-colors">
                                                {domain}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                                Tags
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-1">
                                {data.summary_tags.map((tag, i) => (
                                    <TagLink key={i} tag={tag} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

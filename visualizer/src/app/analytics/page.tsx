import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

function AnalyticsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="border-b border-border pb-6">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-64 mt-2" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const links = [
        { title: "Apps", href: "/analytics/apps", icon: "💻", description: "Application usage trends" },
        { title: "Languages", href: "/analytics/languages", icon: "📝", description: "Programming languages used" },
        { title: "Projects", href: "/analytics/projects", icon: "📁", description: "Project activity analysis" },
        { title: "Domains", href: "/analytics/domains", icon: "🌐", description: "Web browsing statistics" },
        { title: "Workspaces", href: "/analytics/workspaces", icon: "🖥️", description: "Workspace environment breakdown" },
    ];

    return (
        <div className="space-y-6">
            <div className="border-b border-border pb-6">
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Deep dive into your productivity patterns
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {links.map((link) => (
                    <Link key={link.href} href={link.href} className="group cursor-pointer">
                        <Card className="h-full hover:border-foreground/20 transition-colors">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <span>{link.icon}</span>
                                    {link.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {link.description}
                                </p>
                                <Button variant="secondary" className="w-full cursor-pointer group-hover:bg-accent">
                                    View Analysis
                                </Button>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

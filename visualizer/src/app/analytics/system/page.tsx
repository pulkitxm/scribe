import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAllScreenshots, getSystemContextStats } from "@/lib/data";
import SystemAnalyticsDashboard from "@/components/SystemAnalyticsDashboard";

export default function SystemPage() {
    const screenshots = getAllScreenshots();
    const stats = getSystemContextStats(screenshots);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 border-b border-border pb-6">
                <Button variant="ghost" size="icon" asChild className="cursor-pointer">
                    <Link href="/analytics">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System & Context</h1>
                    <p className="text-muted-foreground">
                        Deep dive into your environment, hardware usage, and context distribution.
                    </p>
                </div>
            </div>
            <SystemAnalyticsDashboard stats={stats} />
        </div>
    );
}

import { getAllScreenshots, getSystemContextStats } from "@/lib/data";
import SystemAnalyticsDashboard from "@/components/SystemAnalyticsDashboard";

export default function SystemPage() {
    const screenshots = getAllScreenshots();
    const stats = getSystemContextStats(screenshots);

    return (
        <div className="container mx-auto py-6">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight">System & Context</h1>
                <p className="text-muted-foreground">
                    Deep dive into your environment, hardware usage, and context distribution.
                </p>
            </div>
            <SystemAnalyticsDashboard stats={stats} />
        </div>
    );
}

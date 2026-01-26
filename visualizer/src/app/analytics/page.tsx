import { Suspense } from "react";
import AnalyticsContent from "@/components/AnalyticsContent";

function AnalyticsLoading() {
    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Analytics</h1>
                <p className="page-description">Deep dive into your productivity patterns</p>
            </div>
            <div className="loading">
                <div className="loading-spinner" />
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    return (
        <Suspense fallback={<AnalyticsLoading />}>
            <AnalyticsContent />
        </Suspense>
    );
}

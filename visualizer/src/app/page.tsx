import { Suspense } from "react";
import DashboardContent from "@/components/DashboardContent";

function DashboardLoading() {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Your productivity at a glance</p>
      </div>
      <div className="loading">
        <div className="loading-spinner" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}

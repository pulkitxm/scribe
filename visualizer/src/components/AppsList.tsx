"use client";

interface Props {
    apps: Record<string, number>;
}

export default function AppsList({ apps }: Props) {
    const sortedApps = Object.entries(apps)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    const maxValue = sortedApps.length > 0 ? sortedApps[0][1] : 0;

    if (sortedApps.length === 0) {
        return (
            <div className="card">
                <div className="card-title">Top Apps</div>
                <div className="empty-state" style={{ padding: "40px" }}>
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="card-title">Top Apps</div>
            <div style={{ marginTop: "16px" }}>
                {sortedApps.map(([app, count]) => (
                    <div key={app} style={{ marginBottom: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                            <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{app}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{count}</span>
                        </div>
                        <div className="score-bar">
                            <div
                                className="score-bar-fill"
                                style={{
                                    width: `${(count / maxValue) * 100}%`,
                                    background: "var(--gradient-primary)",
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

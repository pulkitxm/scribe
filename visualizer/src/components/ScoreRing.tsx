"use client";

interface Props {
    value: number;
    max?: number;
    size?: number;
    strokeWidth?: number;
    label: string;
    color?: string;
}

export default function ScoreRing({ value, max = 100, size = 120, strokeWidth = 10, label, color }: Props) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / max) * circumference;

    const getColor = () => {
        if (color) return color;
        if (value >= 80) return "var(--color-success)";
        if (value >= 60) return "var(--color-warning)";
        return "var(--color-danger)";
    };

    return (
        <div style={{ textAlign: "center" }}>
            <svg width={size} height={size} className="progress-ring">
                <circle
                    stroke="var(--bg-tertiary)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="progress-ring-circle"
                    stroke={getColor()}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                    }}
                />
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy="0.3em"
                    fill="var(--text-primary)"
                    fontSize="1.5rem"
                    fontWeight="700"
                    style={{ transform: "rotate(90deg)", transformOrigin: "center" }}
                >
                    {value}
                </text>
            </svg>
            <div style={{ marginTop: "8px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {label}
            </div>
        </div>
    );
}

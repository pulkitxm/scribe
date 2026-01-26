import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";

export function formatDate(dateStr: string): string {
    const parts = dateStr.split("-");
    const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    return format(date, "MMM dd, yyyy");
}

export function formatTime(date: Date): string {
    return format(date, "HH:mm:ss");
}

export function formatDateTime(date: Date): string {
    return format(date, "MMM dd, yyyy HH:mm");
}

export function getDateRange(range: "today" | "week" | "month" | "all"): { start: Date; end: Date } | null {
    const now = new Date();

    switch (range) {
        case "today":
            return {
                start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                end: now,
            };
        case "week":
            return {
                start: startOfWeek(now, { weekStartsOn: 1 }),
                end: endOfWeek(now, { weekStartsOn: 1 }),
            };
        case "month":
            return {
                start: startOfMonth(now),
                end: endOfMonth(now),
            };
        case "all":
            return null;
    }
}

export function getScoreColor(score: number): string {
    if (score >= 80) return "var(--color-success)";
    if (score >= 60) return "var(--color-warning)";
    return "var(--color-danger)";
}

export function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        coding: "#8b5cf6",
        browsing: "#3b82f6",
        communication: "#10b981",
        entertainment: "#f59e0b",
        productivity: "#06b6d4",
        learning: "#ec4899",
        unknown: "#6b7280",
    };
    return colors[category.toLowerCase()] || colors.unknown;
}

export function getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
        coding: "💻",
        browsing: "🌐",
        communication: "💬",
        entertainment: "🎮",
        productivity: "📊",
        learning: "📚",
        unknown: "❓",
    };
    return icons[category.toLowerCase()] || icons.unknown;
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

interface GalleryItem {
    id: string;
    timestamp: string;
    date: string;
    imagePath: string;
}

interface ScreenshotDetail {
    id: string;
    timestamp: string;
    date: string;
    imagePath: string;
    data: {
        overall_activity_score: number;
        category: string;
        workspace_type: string;
        short_description: string;
        detailed_analysis: string;
        scores: {
            focus_score: number;
            productivity_score: number;
            distraction_risk: number;
        };
        evidence: {
            apps_visible: string[];
            active_app_guess: string;
            key_windows_or_panels: string[];
            text_snippets: string[];
        };
        context: {
            intent_guess: string;
            work_context: {
                work_type: string;
                project_or_doc: string;
            };
            code_context: {
                language: string;
                tools_or_frameworks: string[];
                repo_or_project: string;
            };
        };
        actions_observed: string[];
        summary_tags: string[];
        confidence: number;
    };
}

interface Props {
    initialDate?: string;
}

export default function Gallery({ initialDate }: Props) {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedDate, setSelectedDate] = useState(initialDate || "");
    const [dates, setDates] = useState<string[]>([]);
    const [selectedItem, setSelectedItem] = useState<ScreenshotDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    useEffect(() => {
        fetch("/api/dates")
            .then((res) => res.json())
            .then((data) => setDates(data.dates));
    }, []);

    const loadItems = useCallback(async (pageNum: number, reset: boolean = false) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams({
            page: pageNum.toString(),
            limit: "24",
        });
        if (selectedDate) params.set("date", selectedDate);

        const res = await fetch(`/api/gallery?${params}`);
        const data = await res.json();

        if (reset) {
            setItems(data.screenshots);
        } else {
            setItems((prev) => [...prev, ...data.screenshots]);
        }
        setHasMore(data.hasMore);
        setLoading(false);
        setLoadingMore(false);
    }, [selectedDate]);

    useEffect(() => {
        setPage(1);
        loadItems(1, true);
    }, [selectedDate, loadItems]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadItems(nextPage);
    };

    const openDetail = async (item: GalleryItem) => {
        setLoadingDetail(true);
        setSelectedItem(null);

        const res = await fetch(`/api/screenshot/${item.date}/${item.id}`);
        const data = await res.json();
        setSelectedItem(data);
        setLoadingDetail(false);
    };

    const closeDetail = () => {
        setSelectedItem(null);
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDateTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getScoreClass = (score: number) => {
        if (score >= 80) return "score-high";
        if (score >= 60) return "score-medium";
        return "score-low";
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "var(--color-success)";
        if (score >= 60) return "var(--color-warning)";
        return "var(--color-danger)";
    };

    return (
        <div>
            <div className="filter-group">
                <select
                    className="select"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                >
                    <option value="">All Dates</option>
                    {dates.map((date) => (
                        <option key={date} value={date}>
                            {date}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner" />
                </div>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📷</div>
                    <div className="empty-state-title">No screenshots found</div>
                    <p>Start capturing screenshots to see them here</p>
                </div>
            ) : (
                <>
                    <div className="gallery-grid">
                        {items.map((item) => (
                            <div
                                key={`${item.date}-${item.id}`}
                                className="gallery-item fade-in"
                                onClick={() => openDetail(item)}
                            >
                                <Image
                                    src={item.imagePath}
                                    alt={`Screenshot from ${item.timestamp}`}
                                    width={400}
                                    height={200}
                                    style={{ objectFit: "cover", width: "100%", height: "200px" }}
                                    loading="lazy"
                                />
                                <div className="gallery-item-overlay">
                                    <div className="gallery-item-time">{formatTime(item.timestamp)}</div>
                                    <div className="gallery-item-category">{item.date}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="load-more">
                            <button
                                className="btn btn-secondary"
                                onClick={loadMore}
                                disabled={loadingMore}
                            >
                                {loadingMore ? "Loading..." : "Load More"}
                            </button>
                        </div>
                    )}
                </>
            )}

            {(selectedItem || loadingDetail) && (
                <div className="modal-backdrop" onClick={closeDetail}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {selectedItem ? formatDateTime(selectedItem.timestamp) : "Loading..."}
                            </h2>
                            <button className="modal-close" onClick={closeDetail}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-content">
                            {loadingDetail ? (
                                <div className="loading">
                                    <div className="loading-spinner" />
                                </div>
                            ) : selectedItem ? (
                                <div className="two-column">
                                    <div>
                                        <Image
                                            src={selectedItem.imagePath}
                                            alt="Screenshot"
                                            width={800}
                                            height={450}
                                            className="image-preview"
                                            style={{ width: "100%", height: "auto" }}
                                        />

                                        <div className="detail-section" style={{ marginTop: "24px" }}>
                                            <div className="detail-section-title">AI Analysis</div>
                                            <div className="detail-content">
                                                {selectedItem.data.detailed_analysis}
                                            </div>
                                        </div>

                                        <div className="detail-section">
                                            <div className="detail-section-title">Intent</div>
                                            <div className="detail-content">
                                                {selectedItem.data.context.intent_guess}
                                            </div>
                                        </div>

                                        <div className="detail-section">
                                            <div className="detail-section-title">Actions Observed</div>
                                            <ul className="detail-content" style={{ paddingLeft: "20px" }}>
                                                {selectedItem.data.actions_observed.map((action, i) => (
                                                    <li key={i}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="score-grid" style={{ marginBottom: "24px" }}>
                                            <div className="score-item">
                                                <div
                                                    className="score-item-value"
                                                    style={{ color: getScoreColor(selectedItem.data.scores.focus_score) }}
                                                >
                                                    {selectedItem.data.scores.focus_score}
                                                </div>
                                                <div className="score-item-label">Focus</div>
                                            </div>
                                            <div className="score-item">
                                                <div
                                                    className="score-item-value"
                                                    style={{ color: getScoreColor(selectedItem.data.scores.productivity_score) }}
                                                >
                                                    {selectedItem.data.scores.productivity_score}
                                                </div>
                                                <div className="score-item-label">Productivity</div>
                                            </div>
                                            <div className="score-item">
                                                <div
                                                    className="score-item-value"
                                                    style={{ color: getScoreColor(100 - selectedItem.data.scores.distraction_risk) }}
                                                >
                                                    {selectedItem.data.scores.distraction_risk}
                                                </div>
                                                <div className="score-item-label">Distraction</div>
                                            </div>
                                        </div>

                                        <div className="card" style={{ marginBottom: "16px" }}>
                                            <div className="card-title" style={{ marginBottom: "16px" }}>Details</div>
                                            <div className="list-item">
                                                <span className="list-item-label">Category</span>
                                                <span className="badge badge-accent">{selectedItem.data.category}</span>
                                            </div>
                                            <div className="list-item">
                                                <span className="list-item-label">Workspace</span>
                                                <span className="list-item-value">{selectedItem.data.workspace_type}</span>
                                            </div>
                                            <div className="list-item">
                                                <span className="list-item-label">Active App</span>
                                                <span className="list-item-value">
                                                    {selectedItem.data.evidence.active_app_guess}
                                                </span>
                                            </div>
                                            <div className="list-item">
                                                <span className="list-item-label">Confidence</span>
                                                <span className="list-item-value">
                                                    {Math.round(selectedItem.data.confidence * 100)}%
                                                </span>
                                            </div>
                                            {selectedItem.data.context.work_context.work_type && (
                                                <div className="list-item">
                                                    <span className="list-item-label">Work Type</span>
                                                    <span className="list-item-value">
                                                        {selectedItem.data.context.work_context.work_type}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedItem.data.context.code_context.language && (
                                                <div className="list-item">
                                                    <span className="list-item-label">Language</span>
                                                    <span className="list-item-value">
                                                        {selectedItem.data.context.code_context.language}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card" style={{ marginBottom: "16px" }}>
                                            <div className="card-title" style={{ marginBottom: "12px" }}>Apps Visible</div>
                                            <div className="tag-list">
                                                {selectedItem.data.evidence.apps_visible.map((app, i) => (
                                                    <span key={i} className="tag">{app}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="card">
                                            <div className="card-title" style={{ marginBottom: "12px" }}>Tags</div>
                                            <div className="tag-list">
                                                {selectedItem.data.summary_tags.map((tag, i) => (
                                                    <span key={i} className="badge badge-info">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

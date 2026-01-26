"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

interface GalleryItem {
    id: string;
    timestamp: string;
    date: string;
    imagePath: string;
    category?: string;
    tags?: string[];
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
            web_domains_visible: string[];
            text_snippets: string[];
        };
        context: {
            intent_guess: string;
            topic_or_game_or_media: string;
            work_context: {
                work_type: string;
                project_or_doc: string;
            };
            code_context: {
                language: string;
                tools_or_frameworks: string[];
                files_or_modules: string[];
                repo_or_project: string;
                errors_or_logs_visible: boolean;
            };
            learning_context: {
                learning_topic: string;
                source_type: string;
            };
            communication_context: {
                communication_type: string;
                platform_guess: string;
                meeting_indicator: boolean;
            };
            entertainment_context: {
                entertainment_type: string;
                platform_guess: string;
            };
        };
        actions_observed: string[];
        privacy_notes: string[];
        summary_tags: string[];
        dedupe_signature: string;
        confidence: number;
    };
}

export default function Gallery() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [items, setItems] = useState<GalleryItem[]>([]);
    const [allTags, setAllTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ScreenshotDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const selectedDate = searchParams.get("date") || "";
    const selectedTag = searchParams.get("tag") || "";
    const selectedCategory = searchParams.get("category") || "";

    const [dates, setDates] = useState<string[]>([]);

    useEffect(() => {
        fetch("/api/dates")
            .then((res) => res.json())
            .then((data) => setDates(data.dates));

        fetch("/api/tags")
            .then((res) => res.json())
            .then((data) => setAllTags(data.tags || []));
    }, []);

    const updateUrl = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set(key, value);
        } else {
            params.delete(key);
        }
        router.push(`/gallery?${params.toString()}`, { scroll: false });
    };

    const loadItems = useCallback(async (pageNum: number, reset: boolean = false) => {
        if (pageNum === 1) setLoading(true);
        else setLoadingMore(true);

        const params = new URLSearchParams({
            page: pageNum.toString(),
            limit: "24",
        });
        if (selectedDate) params.set("date", selectedDate);
        if (selectedTag) params.set("tag", selectedTag);
        if (selectedCategory) params.set("category", selectedCategory);

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
    }, [selectedDate, selectedTag, selectedCategory]);

    useEffect(() => {
        setPage(1);
        loadItems(1, true);
    }, [selectedDate, selectedTag, selectedCategory, loadItems]);

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

    const handleTagClick = (tag: string) => {
        updateUrl("tag", tag);
        closeDetail();
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

    const getScoreColor = (score: number) => {
        if (score >= 80) return "var(--color-success)";
        if (score >= 60) return "var(--color-warning)";
        return "var(--color-danger)";
    };

    return (
        <div>
            <div className="filter-bar">
                <select
                    className="select"
                    value={selectedDate}
                    onChange={(e) => updateUrl("date", e.target.value)}
                >
                    <option value="">All Dates</option>
                    {dates.map((date) => (
                        <option key={date} value={date}>{date}</option>
                    ))}
                </select>

                <select
                    className="select"
                    value={selectedTag}
                    onChange={(e) => updateUrl("tag", e.target.value)}
                >
                    <option value="">All Tags</option>
                    {allTags.map((tag) => (
                        <option key={tag} value={tag}>{tag}</option>
                    ))}
                </select>

                <select
                    className="select"
                    value={selectedCategory}
                    onChange={(e) => updateUrl("category", e.target.value)}
                >
                    <option value="">All Categories</option>
                    <option value="coding">Coding</option>
                    <option value="browsing">Browsing</option>
                    <option value="communication">Communication</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="productivity">Productivity</option>
                    <option value="learning">Learning</option>
                </select>

                {(selectedDate || selectedTag || selectedCategory) && (
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => router.push("/gallery")}
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {selectedTag && (
                <div className="active-filter">
                    <span>Showing screenshots tagged with:</span>
                    <span className="badge badge-accent">{selectedTag}</span>
                </div>
            )}

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner" />
                </div>
            ) : items.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📷</div>
                    <div className="empty-state-title">No screenshots found</div>
                    <p>Try adjusting your filters or start capturing screenshots</p>
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
                                    <div className="gallery-item-category">
                                        {item.category && <span className="badge badge-sm">{item.category}</span>}
                                        <span style={{ marginLeft: "8px" }}>{item.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMore && (
                        <div className="load-more">
                            <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                                {loadingMore ? "Loading..." : "Load More"}
                            </button>
                        </div>
                    )}
                </>
            )}

            {(selectedItem || loadingDetail) && (
                <div className="modal-backdrop" onClick={closeDetail}>
                    <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {selectedItem ? formatDateTime(selectedItem.timestamp) : "Loading..."}
                            </h2>
                            <button className="modal-close" onClick={closeDetail}>✕</button>
                        </div>
                        <div className="modal-content">
                            {loadingDetail ? (
                                <div className="loading">
                                    <div className="loading-spinner" />
                                </div>
                            ) : selectedItem ? (
                                <div className="detail-layout">
                                    <div className="detail-main">
                                        <Image
                                            src={selectedItem.imagePath}
                                            alt="Screenshot"
                                            width={900}
                                            height={506}
                                            className="image-preview"
                                            style={{ width: "100%", height: "auto" }}
                                        />

                                        <div className="detail-section">
                                            <div className="detail-section-title">AI Analysis</div>
                                            <div className="detail-content">{selectedItem.data.detailed_analysis}</div>
                                        </div>

                                        <div className="detail-section">
                                            <div className="detail-section-title">Intent</div>
                                            <div className="detail-content">{selectedItem.data.context.intent_guess}</div>
                                        </div>

                                        {selectedItem.data.context.topic_or_game_or_media && (
                                            <div className="detail-section">
                                                <div className="detail-section-title">Topic / Media</div>
                                                <div className="detail-content">{selectedItem.data.context.topic_or_game_or_media}</div>
                                            </div>
                                        )}

                                        <div className="detail-section">
                                            <div className="detail-section-title">Actions Observed</div>
                                            <ul className="action-list">
                                                {selectedItem.data.actions_observed.map((action, i) => (
                                                    <li key={i}>{action}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        {selectedItem.data.evidence.text_snippets.length > 0 && (
                                            <div className="detail-section">
                                                <div className="detail-section-title">Text Snippets Detected</div>
                                                <div className="snippet-list">
                                                    {selectedItem.data.evidence.text_snippets.map((snippet, i) => (
                                                        <code key={i} className="snippet">{snippet}</code>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {selectedItem.data.evidence.key_windows_or_panels.length > 0 && (
                                            <div className="detail-section">
                                                <div className="detail-section-title">Windows / Panels</div>
                                                <div className="tag-list">
                                                    {selectedItem.data.evidence.key_windows_or_panels.map((w, i) => (
                                                        <span key={i} className="tag">{w}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="detail-sidebar">
                                        <div className="score-grid-3">
                                            <div className="score-item">
                                                <div className="score-item-value" style={{ color: getScoreColor(selectedItem.data.scores.focus_score) }}>
                                                    {selectedItem.data.scores.focus_score}
                                                </div>
                                                <div className="score-item-label">Focus</div>
                                            </div>
                                            <div className="score-item">
                                                <div className="score-item-value" style={{ color: getScoreColor(selectedItem.data.scores.productivity_score) }}>
                                                    {selectedItem.data.scores.productivity_score}
                                                </div>
                                                <div className="score-item-label">Productivity</div>
                                            </div>
                                            <div className="score-item">
                                                <div className="score-item-value" style={{ color: getScoreColor(100 - selectedItem.data.scores.distraction_risk) }}>
                                                    {selectedItem.data.scores.distraction_risk}
                                                </div>
                                                <div className="score-item-label">Distraction</div>
                                            </div>
                                        </div>

                                        <div className="sidebar-card">
                                            <div className="sidebar-card-title">Details</div>
                                            <div className="detail-list">
                                                <div className="detail-row">
                                                    <span>Category</span>
                                                    <span className="badge badge-accent">{selectedItem.data.category}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>Workspace</span>
                                                    <span>{selectedItem.data.workspace_type}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>Active App</span>
                                                    <span>{selectedItem.data.evidence.active_app_guess}</span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>Overall Score</span>
                                                    <span style={{ color: getScoreColor(selectedItem.data.overall_activity_score) }}>
                                                        {selectedItem.data.overall_activity_score}
                                                    </span>
                                                </div>
                                                <div className="detail-row">
                                                    <span>Confidence</span>
                                                    <span>{Math.round(selectedItem.data.confidence * 100)}%</span>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedItem.data.context.work_context.work_type && (
                                            <div className="sidebar-card">
                                                <div className="sidebar-card-title">Work Context</div>
                                                <div className="detail-list">
                                                    <div className="detail-row">
                                                        <span>Type</span>
                                                        <span>{selectedItem.data.context.work_context.work_type}</span>
                                                    </div>
                                                    {selectedItem.data.context.work_context.project_or_doc && (
                                                        <div className="detail-row">
                                                            <span>Project</span>
                                                            <span>{selectedItem.data.context.work_context.project_or_doc}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {selectedItem.data.context.code_context.language && (
                                            <div className="sidebar-card">
                                                <div className="sidebar-card-title">Code Context</div>
                                                <div className="detail-list">
                                                    <div className="detail-row">
                                                        <span>Language</span>
                                                        <span>{selectedItem.data.context.code_context.language}</span>
                                                    </div>
                                                    {selectedItem.data.context.code_context.repo_or_project && (
                                                        <div className="detail-row">
                                                            <span>Repo</span>
                                                            <span>{selectedItem.data.context.code_context.repo_or_project}</span>
                                                        </div>
                                                    )}
                                                    {selectedItem.data.context.code_context.errors_or_logs_visible && (
                                                        <div className="detail-row">
                                                            <span>Errors Visible</span>
                                                            <span className="badge badge-danger">Yes</span>
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedItem.data.context.code_context.tools_or_frameworks.length > 0 && (
                                                    <div style={{ marginTop: "12px" }}>
                                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "8px" }}>Tools</div>
                                                        <div className="tag-list">
                                                            {selectedItem.data.context.code_context.tools_or_frameworks.map((t, i) => (
                                                                <span key={i} className="tag">{t}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="sidebar-card">
                                            <div className="sidebar-card-title">Apps Visible</div>
                                            <div className="tag-list">
                                                {selectedItem.data.evidence.apps_visible.map((app, i) => (
                                                    <span key={i} className="tag">{app}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {selectedItem.data.evidence.web_domains_visible.length > 0 && (
                                            <div className="sidebar-card">
                                                <div className="sidebar-card-title">Web Domains</div>
                                                <div className="tag-list">
                                                    {selectedItem.data.evidence.web_domains_visible.map((d, i) => (
                                                        <span key={i} className="badge badge-info">{d}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="sidebar-card">
                                            <div className="sidebar-card-title">Tags</div>
                                            <div className="tag-list">
                                                {selectedItem.data.summary_tags.map((tag, i) => (
                                                    <button
                                                        key={i}
                                                        className="tag-button"
                                                        onClick={() => handleTagClick(tag)}
                                                    >
                                                        {tag}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="sidebar-card">
                                            <div className="sidebar-card-title">Signature</div>
                                            <code className="signature">{selectedItem.data.dedupe_signature}</code>
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

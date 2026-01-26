"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TagData {
    tags: string[];
    tagCounts: Record<string, number>;
}

export default function TagsPage() {
    const router = useRouter();
    const [data, setData] = useState<TagData | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/tags")
            .then((res) => res.json())
            .then((d) => {
                setData(d);
                setLoading(false);
            });
    }, []);

    const filteredTags = data?.tags.filter((tag) =>
        tag.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const maxCount = data ? Math.max(...Object.values(data.tagCounts)) : 1;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Tags</h1>
                <p className="page-description">Explore screenshots by tags</p>
            </div>

            <div className="filter-bar" style={{ marginBottom: "24px" }}>
                <input
                    type="text"
                    className="select"
                    placeholder="Search tags..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: 1, maxWidth: "300px" }}
                />
                <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    {filteredTags.length} tags found
                </span>
            </div>

            {loading ? (
                <div className="loading">
                    <div className="loading-spinner" />
                </div>
            ) : data && filteredTags.length > 0 ? (
                <div className="tags-grid">
                    {filteredTags.map((tag) => {
                        const count = data.tagCounts[tag];
                        const intensity = count / maxCount;

                        return (
                            <div
                                key={tag}
                                className="tag-card"
                                onClick={() => router.push(`/gallery?tag=${encodeURIComponent(tag)}`)}
                                style={{
                                    borderColor: `rgba(139, 92, 246, ${0.2 + intensity * 0.6})`,
                                }}
                            >
                                <div className="tag-card-name">{tag}</div>
                                <div className="tag-card-count">{count} screenshot{count !== 1 ? "s" : ""}</div>
                                <div className="tag-card-bar">
                                    <div
                                        className="tag-card-bar-fill"
                                        style={{ width: `${intensity * 100}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🏷️</div>
                    <div className="empty-state-title">No Tags Found</div>
                    <p>Tags will appear here once screenshots are captured and analyzed</p>
                </div>
            )}

            <style jsx>{`
        .tags-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .tag-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tag-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--color-accent);
        }

        .tag-card-name {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .tag-card-count {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .tag-card-bar {
          height: 4px;
          background: var(--bg-tertiary);
          border-radius: 2px;
          overflow: hidden;
        }

        .tag-card-bar-fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: 2px;
        }
      `}</style>
        </div>
    );
}

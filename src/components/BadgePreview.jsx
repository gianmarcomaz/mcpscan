import { useState } from "react";

/**
 * Badge preview with copy-to-clipboard markdown.
 * Props: scanId (string), score (number), tier (string), repoName (string)
 */
export default function BadgePreview({ scanId, score, tier, repoName }) {
    const [copied, setCopied] = useState(false);

    const domain = window.location.origin;
    const badgeUrl = `${domain}/api/badge/${scanId}`;
    const reportUrl = `${domain}/report/${scanId}`;
    const markdown = `[![MCP Certified](${badgeUrl})](${reportUrl})`;

    const tierColor =
        tier === "certified" ? "rgb(0,150,100)"
            : tier === "reviewed" ? "rgb(230,170,30)"
                : "rgb(255,60,60)";

    const tierLabel =
        tier === "certified" ? "Certified"
            : `${score}/100`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="hover-card" style={{
            overflow: "hidden", borderRadius: "0.75rem",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
        }}>
            <div style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                    <div>
                        <h3 style={{
                            fontSize: "0.85rem", fontWeight: 800,
                            color: "var(--color-text-primary)", margin: 0,
                        }}>Add to your README</h3>
                        <p style={{
                            fontSize: "0.7rem", fontWeight: 500, color: "var(--color-text-muted)",
                            margin: "0.125rem 0 0",
                        }}>Copy the markdown below to display your certification badge</p>
                    </div>
                </div>

                {/* Badge SVG preview */}
                <div style={{
                    marginBottom: "1.25rem", display: "flex", justifyContent: "center",
                    borderRadius: "0.5rem", backgroundColor: "rgba(0,0,0,0.3)",
                    padding: "1.5rem",
                }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="240" height="28" viewBox="0 0 240 28">
                        <defs>
                            <linearGradient id="bgGrad" x2="0" y2="100%">
                                <stop offset="0" stopColor="#fff" stopOpacity=".1" />
                                <stop offset="1" stopColor="#000" stopOpacity=".1" />
                            </linearGradient>
                        </defs>
                        <clipPath id="clip">
                            <rect width="240" height="28" rx="6" />
                        </clipPath>
                        <g clipPath="url(#clip)">
                            <rect width="120" height="28" fill="rgba(30,40,60,0.9)" />
                            <rect x="120" width="120" height="28" fill={tierColor} />
                            <rect width="240" height="28" fill="url(#bgGrad)" />
                        </g>
                        <g fill="#fff" textAnchor="middle" fontFamily="'Plus Jakarta Sans','Inter','Segoe UI',system-ui,sans-serif" fontSize="12" fontWeight="700">
                            <text x="60" y="18">MCP Certify</text>
                            <text x="180" y="18" fillOpacity="0.95">{tierLabel}</text>
                        </g>
                    </svg>
                </div>

                {/* Markdown snippet */}
                <div style={{
                    borderRadius: "0.5rem", backgroundColor: "rgba(0,0,0,0.3)",
                    padding: "1rem",
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        marginBottom: "0.5rem",
                    }}>
                        <span style={{
                            fontSize: "0.55rem", fontWeight: 800, textTransform: "uppercase",
                            letterSpacing: "0.06em", color: "var(--color-text-muted)",
                        }}>Markdown</span>
                    </div>
                    <pre style={{
                        overflowX: "auto", whiteSpace: "pre-wrap",
                        fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 500,
                        lineHeight: 1.6, color: "var(--color-text-secondary)", margin: 0,
                    }}>
                        {markdown}
                    </pre>
                </div>
            </div>

            {/* Copy button */}
            <button
                onClick={handleCopy}
                className="hover-ghost"
                style={{
                    display: "flex", width: "100%", cursor: "pointer",
                    alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    padding: "0.75rem", fontSize: "0.8rem", fontWeight: 700,
                    border: "none",
                    borderTop: "1px solid var(--color-border)",
                    backgroundColor: copied ? "rgba(0,150,100,0.08)" : "transparent",
                    color: copied ? "var(--color-safe)" : "var(--color-text-secondary)",
                }}
            >
                {copied ? (
                    <>
                        <svg style={{ width: "0.875rem", height: "0.875rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied to clipboard
                    </>
                ) : (
                    <>
                        <svg style={{ width: "0.875rem", height: "0.875rem" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Markdown
                    </>
                )}
            </button>
        </div>
    );
}

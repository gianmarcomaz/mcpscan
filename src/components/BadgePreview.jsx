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
        tier === "certified" ? "#22c55e"
            : tier === "reviewed" ? "#eab308"
                : "#ef4444";

    const tierLabel =
        tier === "certified" ? "Certified ✓"
            : `${score}/100`;

    const handleCopy = async () => {
        await navigator.clipboard.writeText(markdown);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
            <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                    <span className="text-xl">🏅</span>
                    <div>
                        <h3 className="text-sm font-bold text-white">Add to your README</h3>
                        <p className="text-xs text-slate-500">Copy the markdown below to display your certification badge</p>
                    </div>
                </div>

                {/* Badge SVG preview */}
                <div className="mb-5 flex justify-center rounded-xl bg-slate-950 p-6">
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
                            <rect width="120" height="28" fill="#334155" />
                            <rect x="120" width="120" height="28" fill={tierColor} />
                            <rect width="240" height="28" fill="url(#bgGrad)" />
                        </g>
                        <g fill="#fff" textAnchor="middle" fontFamily="'Inter','Segoe UI',system-ui,sans-serif" fontSize="12" fontWeight="600">
                            <text x="60" y="18">MCP Certify</text>
                            <text x="180" y="18" fillOpacity="0.95">{tierLabel}</text>
                        </g>
                    </svg>
                </div>

                {/* Markdown snippet */}
                <div className="rounded-lg bg-slate-950 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Markdown</span>
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-400">
                        {markdown}
                    </pre>
                </div>
            </div>

            {/* Copy button */}
            <button
                onClick={handleCopy}
                className={`flex w-full cursor-pointer items-center justify-center gap-2 border-t py-3.5 text-sm font-semibold transition-all duration-200 ${copied
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
            >
                {copied ? (
                    <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Copied to clipboard!
                    </>
                ) : (
                    <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Markdown
                    </>
                )}
            </button>
        </div>
    );
}

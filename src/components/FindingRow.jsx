const SEVERITY_STYLES = {
    critical: { label: "CRITICAL", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.15)", dot: "bg-red-500" },
    high: { label: "HIGH", color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.15)", dot: "bg-orange-500" },
    medium: { label: "MEDIUM", color: "#eab308", bg: "rgba(234,179,8,0.08)", border: "rgba(234,179,8,0.15)", dot: "bg-yellow-500" },
    low: { label: "LOW", color: "#3b82f6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.15)", dot: "bg-blue-500" },
    info: { label: "INFO", color: "#64748b", bg: "rgba(100,116,139,0.08)", border: "rgba(100,116,139,0.15)", dot: "bg-slate-500" },
};

/**
 * A single finding row with severity, file, line, snippet, message, and remediation.
 * Props: finding ({ severity, file, line, snippet, message, remediation })
 */
export default function FindingRow({ finding }) {
    const s = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.info;

    return (
        <div
            className="overflow-hidden rounded-lg"
            style={{
                backgroundColor: s.bg,
                border: `1px solid ${s.border}`,
            }}
        >
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 px-4 pt-3 pb-2">
                {/* Severity badge */}
                <span
                    className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: s.color, backgroundColor: "rgba(0,0,0,0.2)" }}
                >
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                </span>
                {/* File path */}
                <span className="font-mono text-xs text-slate-400">
                    {finding.file}
                    {finding.line != null && (
                        <span className="text-slate-600">:{finding.line}</span>
                    )}
                </span>
            </div>

            {/* Message */}
            <div className="px-4 pb-3">
                <p className="text-sm leading-relaxed text-slate-300">
                    {finding.message}
                </p>
            </div>

            {/* Code snippet */}
            {finding.snippet && (
                <div className="mx-3 mb-3">
                    <pre className="overflow-x-auto rounded-md bg-black/30 p-3 font-mono text-xs leading-5 text-emerald-400/90">
                        {finding.snippet}
                    </pre>
                </div>
            )}

            {/* Remediation */}
            {finding.remediation && (
                <div className="mx-3 mb-3 rounded-md bg-black/20 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs">💡</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                            How to fix
                        </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                        {finding.remediation}
                    </p>
                </div>
            )}
        </div>
    );
}

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import ScoreGauge from "../components/ScoreGauge";
import CheckCard from "../components/CheckCard";
import BadgePreview from "../components/BadgePreview";

const CHECK_ORDER = [
    "networkExposure",
    "commandInjection",
    "credentialLeaks",
    "toolPoisoning",
    "specCompliance",
    "inputValidation",
];

const STEP_LABELS = {
    pending: "Initializing…",
    fetching: "Fetching repository files…",
    networkExposure: "Analyzing network exposure…",
    commandInjection: "Checking for command injection…",
    credentialLeaks: "Scanning for credential leaks…",
    toolPoisoning: "Detecting tool poisoning…",
    specCompliance: "Validating spec compliance…",
    inputValidation: "Reviewing input validation…",
    scoring: "Calculating final score…",
    complete: "Complete",
    error: "Failed",
};

export default function ReportPage() {
    const { scanId } = useParams();
    const [scan, setScan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(
            doc(db, "scans", scanId),
            (snap) => {
                if (snap.exists()) setScan({ id: snap.id, ...snap.data() });
                else setError("Scan not found");
                setLoading(false);
            },
            (err) => { setError(err.message); setLoading(false); }
        );
        return unsub;
    }, [scanId]);

    /* Loading */
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
            </div>
        );
    }

    /* Error */
    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-4">
                <span className="text-4xl">🔍</span>
                <p className="text-slate-400">{error}</p>
                <Link to="/" className="text-sm text-emerald-400 no-underline hover:underline">Back to Home</Link>
            </div>
        );
    }

    /* Scanning in progress */
    if (scan.status !== "complete" && scan.status !== "error") {
        return <ScanProgress scan={scan} />;
    }

    /* Scan error */
    if (scan.status === "error") {
        return (
            <PageShell>
                <div className="text-center py-16">
                    <span className="text-5xl mb-4 block">⚠️</span>
                    <h1 className="text-xl font-bold text-white mb-2">Scan Failed</h1>
                    <p className="text-sm text-slate-400 mb-6">{scan.errorMessage || "Unknown error"}</p>
                    <Link to="/scan" className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white no-underline hover:bg-emerald-600">
                        Try Again
                    </Link>
                </div>
            </PageShell>
        );
    }

    /* Completed scan */
    return <ScanReport scan={scan} scanId={scanId} />;
}

/* ─── Page wrapper ─── */
function PageShell({ children }) {
    return (
        <div style={{ paddingTop: "6rem" }}>
            <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "0 1.25rem 3rem" }}>
                {children}
            </div>
        </div>
    );
}

/* ─── Progress view ─── */
function ScanProgress({ scan }) {
    const keys = Object.keys(STEP_LABELS);
    const stepIndex = keys.indexOf(scan.currentStep || "pending");
    const totalSteps = keys.length - 2;
    const pct = Math.min(Math.max((stepIndex / totalSteps) * 100, 5), 100);

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="w-full max-w-sm px-6 text-center">
                <div className="mb-5 text-4xl">🔍</div>
                <h2 className="text-lg font-bold text-white mb-1">
                    Scanning {scan.repoOwner}/{scan.repoName}
                </h2>
                <p className="text-sm text-emerald-400 mb-6">
                    {STEP_LABELS[scan.currentStep] || "Processing…"}
                </p>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2">
                    <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <p className="text-xs text-slate-600">Step {Math.max(stepIndex, 1)} of {totalSteps}</p>
            </div>
        </div>
    );
}

/* ─── Completed scan report ─── */
function ScanReport({ scan, scanId }) {
    const tierColor =
        scan.tier === "certified" ? "#22c55e"
            : scan.tier === "reviewed" ? "#eab308"
                : "#ef4444";

    const tierLabel =
        scan.tier === "certified" ? "Certified"
            : scan.tier === "reviewed" ? "Reviewed"
                : "Not Certified";

    const passedChecks = CHECK_ORDER.filter(k => (scan.checks?.[k]?.score ?? 0) >= 90).length;
    const totalFindings = CHECK_ORDER.reduce((s, k) => s + (scan.checks?.[k]?.findings || []).length, 0);
    const criticalCount = CHECK_ORDER.reduce((s, k) => s + (scan.checks?.[k]?.findings || []).filter(f => f.severity === "critical").length, 0);

    const scanDate = scan.completedAt?.toDate
        ? scan.completedAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "—";

    return (
        <div style={{ paddingTop: "6rem", width: "100%" }}>
            <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem 3rem" }}>

                {/* ══════ HERO ══════ */}
                <div className="text-center mb-10">
                    {/* Score */}
                    <div className="flex justify-center mb-5">
                        <ScoreGauge score={scan.overallScore || 0} size={150} />
                    </div>

                    {/* Repo name */}
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {scan.repoOwner}/{scan.repoName}
                    </h1>

                    {/* Tier badge */}
                    <span
                        className="inline-block rounded-full px-4 py-1 text-xs font-bold uppercase tracking-wider mb-4"
                        style={{ color: tierColor, backgroundColor: tierColor + "18" }}
                    >
                        {tierLabel}
                    </span>

                    {/* Summary */}
                    <p className="text-sm text-slate-400 mb-5 leading-relaxed" style={{ maxWidth: "28rem", margin: "0 auto 1.25rem" }}>
                        {scan.overallScore >= 90
                            ? "All security checks passed. This server meets MCP certification criteria."
                            : scan.overallScore >= 70
                                ? "Minor issues detected. Review the findings below before certification."
                                : "Significant security concerns found. Address the issues below."}
                    </p>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                        <Pill>{scanDate}</Pill>
                        <Pill>{passedChecks}/{CHECK_ORDER.length} passed</Pill>
                        <Pill>{totalFindings} finding{totalFindings !== 1 ? "s" : ""}</Pill>
                        {criticalCount > 0 && (
                            <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400">
                                {criticalCount} critical
                            </span>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-800 mb-6" />

                {/* ══════ CHECK CARDS ══════ */}
                <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                    Security Checks
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.75rem", marginBottom: "2.5rem" }}>
                    {CHECK_ORDER.map(key => (
                        <CheckCard
                            key={key}
                            checkName={key}
                            data={scan.checks?.[key] || { score: 0, status: "info", findings: [] }}
                        />
                    ))}
                </div>

                {/* ══════ BADGE ══════ */}
                {scan.overallScore >= 70 && (
                    <>
                        <div className="h-px bg-slate-800 mb-6" />
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                            Badge
                        </h2>
                        <div style={{ maxWidth: "28rem", margin: "0 auto 2.5rem" }}>
                            <BadgePreview
                                scanId={scanId}
                                score={scan.overallScore}
                                tier={scan.tier}
                                repoName={`${scan.repoOwner}/${scan.repoName}`}
                            />
                        </div>
                    </>
                )}

                {/* ══════ FOOTER NAV ══════ */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                    <Link to="/dashboard" className="text-sm text-slate-500 no-underline hover:text-emerald-400 transition-colors">
                        ← Dashboard
                    </Link>
                    <Link to="/scan" className="text-sm text-slate-500 no-underline hover:text-emerald-400 transition-colors">
                        Scan Another →
                    </Link>
                </div>
            </div>
        </div>
    );
}

function Pill({ children }) {
    return (
        <span className="rounded-full bg-slate-800 px-3 py-1.5 text-slate-400">
            {children}
        </span>
    );
}

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
            <div style={{
                display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center",
            }}>
                <div style={{
                    width: "2.5rem", height: "2.5rem", borderRadius: "50%",
                    border: "2px solid var(--color-border)",
                    borderTopColor: "var(--color-cta-end)",
                    animation: "spin 1s linear infinite",
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    /* Error */
    if (error) {
        return (
            <div style={{
                display: "flex", minHeight: "100vh", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: "1rem",
            }}>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>{error}</p>
                <Link to="/" className="hover-link" style={{
                    fontSize: "0.8rem", fontWeight: 600, color: "var(--color-cta-end)", textDecoration: "none",
                }}>Back to Home</Link>
            </div>
        );
    }

    /* Scanning in progress */
    if (scan.status !== "complete" && scan.status !== "error") {
        return <ScanProgressView scan={scan} />;
    }

    /* Scan error */
    if (scan.status === "error") {
        return (
            <PageShell>
                <div style={{ textAlign: "center", padding: "4rem 0" }}>
                    <h1 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "0.5rem" }}>Scan Failed</h1>
                    <p style={{
                        fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "1.5rem",
                    }}>{scan.errorMessage || "Unknown error"}</p>
                    <Link to="/scan" className="hover-glow" style={{
                        display: "inline-block", borderRadius: "0.5rem",
                        background: "linear-gradient(135deg, var(--color-cta-start), var(--color-cta-end))",
                        padding: "0.625rem 1.5rem", fontSize: "0.8rem", fontWeight: 700,
                        color: "#fff", textDecoration: "none",
                        boxShadow: "0 4px 16px var(--color-cta-glow)",
                    }}>
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
        <div style={{ paddingTop: "5.5rem" }}>
            <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "0 1.5rem 3rem" }}>
                {children}
            </div>
        </div>
    );
}

/* ─── Progress view ─── */
function ScanProgressView({ scan }) {
    const keys = Object.keys(STEP_LABELS);
    const stepIndex = keys.indexOf(scan.currentStep || "pending");
    const totalSteps = keys.length - 2;
    const pct = Math.min(Math.max((stepIndex / totalSteps) * 100, 5), 100);

    return (
        <div style={{
            display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center",
        }}>
            <div style={{ width: "100%", maxWidth: "22rem", padding: "0 1.5rem", textAlign: "center" }}>
                <h2 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "0.375rem" }}>
                    Scanning {scan.repoOwner}/{scan.repoName}
                </h2>
                <p style={{
                    fontSize: "0.8rem", fontWeight: 600, color: "var(--color-cta-end)", marginBottom: "1.5rem",
                }}>
                    {STEP_LABELS[scan.currentStep] || "Processing…"}
                </p>
                <div style={{
                    height: "3px", borderRadius: "2px",
                    backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden",
                    marginBottom: "0.5rem",
                }}>
                    <div style={{
                        height: "100%", borderRadius: "2px",
                        background: "linear-gradient(90deg, var(--color-cta-start), var(--color-cta-end))",
                        transition: "width 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                        width: `${pct}%`,
                    }} />
                </div>
                <p style={{
                    fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-muted)",
                }}>Step {Math.max(stepIndex, 1)} of {totalSteps}</p>
            </div>
        </div>
    );
}

/* ─── Completed scan report ─── */
function ScanReport({ scan, scanId }) {
    const tierColor =
        scan.tier === "certified" ? "rgb(0,150,100)"
            : scan.tier === "reviewed" ? "rgb(230,170,30)"
                : "rgb(255,60,60)";

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
        <div style={{ paddingTop: "5.5rem", width: "100%" }}>
            <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "0 1.5rem 3rem" }}>

                {/* ══════ HERO ══════ */}
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    {/* Score */}
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
                        <ScoreGauge score={scan.overallScore || 0} size={140} />
                    </div>

                    {/* Repo name */}
                    <h1 style={{
                        fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.625rem",
                    }}>
                        {scan.repoOwner}/{scan.repoName}
                    </h1>

                    {/* Tier badge */}
                    <span style={{
                        display: "inline-block", borderRadius: "9999px",
                        padding: "0.25rem 0.875rem", fontSize: "0.6rem",
                        fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em",
                        color: tierColor,
                        backgroundColor: tierColor.replace("rgb", "rgba").replace(")", ",0.1)"),
                        marginBottom: "1rem",
                    }}>
                        {tierLabel}
                    </span>

                    {/* Summary */}
                    <p style={{
                        fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-secondary)",
                        lineHeight: 1.7, maxWidth: "26rem", margin: "0 auto 1.25rem",
                    }}>
                        {scan.overallScore >= 90
                            ? "All security checks passed. This server meets MCP certification criteria."
                            : scan.overallScore >= 70
                                ? "Minor issues detected. Review the findings below before certification."
                                : "Significant security concerns found. Address the issues below."}
                    </p>

                    {/* Stats row */}
                    <div style={{
                        display: "flex", flexWrap: "wrap", alignItems: "center",
                        justifyContent: "center", gap: "0.5rem",
                    }}>
                        <Pill>{scanDate}</Pill>
                        <Pill>{passedChecks}/{CHECK_ORDER.length} passed</Pill>
                        <Pill>{totalFindings} finding{totalFindings !== 1 ? "s" : ""}</Pill>
                        {criticalCount > 0 && (
                            <span style={{
                                borderRadius: "9999px", padding: "0.25rem 0.625rem",
                                fontSize: "0.7rem", fontWeight: 800,
                                color: "var(--color-danger)",
                                backgroundColor: "rgba(255,60,60,0.08)",
                            }}>
                                {criticalCount} critical
                            </span>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div style={{ height: "1px", backgroundColor: "var(--color-border)", marginBottom: "1.5rem" }} />

                {/* ══════ CHECK CARDS + SCORING LEGEND ══════ */}
                <h2 style={{
                    fontSize: "0.7rem", fontWeight: 800, color: "var(--color-text-muted)",
                    textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem",
                }}>
                    Security Checks
                </h2>

                <div style={{
                    display: "flex", gap: "1.25rem", alignItems: "flex-start",
                    marginBottom: "2.5rem",
                }}>
                    {/* Left: Check cards grid */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "0.75rem", flex: 1, minWidth: 0,
                    }}>
                        {CHECK_ORDER.map(key => (
                            <CheckCard
                                key={key}
                                checkName={key}
                                data={scan.checks?.[key] || { score: 0, status: "info", findings: [] }}
                            />
                        ))}
                    </div>

                    {/* Right: Scoring Legend */}
                    <div className="hover-card" style={{
                        width: "12rem", flexShrink: 0, borderRadius: "0.625rem",
                        border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)", padding: "1rem",
                    }}>
                        <div style={{
                            fontSize: "0.6rem", fontWeight: 800, color: "var(--color-text-muted)",
                            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem",
                        }}>
                            How Scores Work
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                            {[
                                { score: "100", issues: "0 issues", color: "rgb(0,150,100)", icon: "✓" },
                                { score: "80–99", issues: "1–2 issues", color: "rgb(0,150,100)", icon: "✓" },
                                { score: "60–79", issues: "3–5 issues", color: "rgb(230,170,30)", icon: "!" },
                                { score: "40–59", issues: "6–8 issues", color: "rgb(255,60,60)", icon: "✗" },
                                { score: "0–39", issues: "9+ issues", color: "rgb(255,60,60)", icon: "✗" },
                            ].map((t) => (
                                <div key={t.score} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <span style={{
                                        fontFamily: "var(--font-mono)", fontSize: "0.65rem",
                                        fontWeight: 800, color: t.color, width: "2.25rem", textAlign: "right",
                                    }}>
                                        {t.score}
                                    </span>
                                    <span style={{ fontSize: "0.55rem", fontWeight: 600, color: "var(--color-text-muted)" }}>→</span>
                                    <span style={{ fontSize: "0.6rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>{t.issues}</span>
                                    <span style={{ fontSize: "0.55rem", fontWeight: 800, color: t.color, marginLeft: "auto" }}>{t.icon}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{
                            marginTop: "0.625rem", paddingTop: "0.5rem",
                            borderTop: "1px solid var(--color-border)",
                        }}>
                            <p style={{
                                fontSize: "0.55rem", fontWeight: 500, color: "var(--color-text-muted)",
                                lineHeight: 1.5, margin: 0,
                            }}>
                                Scores reflect the number and severity of findings. Critical issues have a higher impact on the score.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ══════ BADGE ══════ */}
                {scan.overallScore >= 70 && (
                    <>
                        <div style={{ height: "1px", backgroundColor: "var(--color-border)", marginBottom: "1.5rem" }} />
                        <h2 style={{
                            fontSize: "0.7rem", fontWeight: 800, color: "var(--color-text-muted)",
                            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem",
                        }}>
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
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    paddingTop: "1.5rem", borderTop: "1px solid var(--color-border)",
                }}>
                    <Link to="/dashboard" className="hover-link" style={{
                        fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", textDecoration: "none",
                    }}>
                        ← Dashboard
                    </Link>
                    <Link to="/scan" className="hover-link" style={{
                        fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-muted)", textDecoration: "none",
                    }}>
                        Scan Another →
                    </Link>
                </div>
            </div>
        </div>
    );
}

function Pill({ children }) {
    return (
        <span style={{
            borderRadius: "9999px", padding: "0.25rem 0.625rem",
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            fontSize: "0.7rem", fontWeight: 600, color: "var(--color-text-secondary)",
        }}>
            {children}
        </span>
    );
}

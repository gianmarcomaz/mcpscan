import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../utils/auth";

const TIER_STYLES = {
    certified: { color: "rgb(0,150,100)", bg: "rgba(0,150,100,0.08)", label: "Certified" },
    reviewed: { color: "rgb(230,170,30)", bg: "rgba(230,170,30,0.08)", label: "Reviewed" },
    failed: { color: "rgb(255,60,60)", bg: "rgba(255,60,60,0.08)", label: "Failed" },
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchScans() {
            try {
                const q = query(
                    collection(db, "scans"),
                    where("userId", "==", user.uid),
                    orderBy("startedAt", "desc")
                );
                const snap = await getDocs(q);
                setScans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Failed to fetch scans:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchScans();
    }, [user]);

    return (
        <div style={{ minHeight: "100vh", paddingTop: "3.5rem" }}>
            <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "3rem 1.5rem" }}>
                {/* Header */}
                <div style={{
                    display: "flex", flexWrap: "wrap", alignItems: "center",
                    justifyContent: "space-between", gap: "1rem", marginBottom: "2rem",
                }}>
                    <div>
                        <h1 style={{
                            fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.25rem",
                        }}>Dashboard</h1>
                        <p style={{
                            fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-secondary)",
                        }}>
                            Your scan history and certification results.
                        </p>
                    </div>
                    <Link
                        to="/scan"
                        className="hover-glow"
                        style={{
                            display: "inline-flex", alignItems: "center", gap: "0.375rem",
                            borderRadius: "0.5rem", padding: "0.625rem 1.25rem",
                            background: "linear-gradient(135deg, var(--color-cta-start), var(--color-cta-end))",
                            fontSize: "0.8rem", fontWeight: 700, color: "#fff",
                            textDecoration: "none",
                            boxShadow: "0 2px 12px var(--color-cta-glow)",
                        }}
                    >
                        + New Scan
                    </Link>
                </div>

                {/* Loading */}
                {loading && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 0",
                    }}>
                        <div style={{
                            width: "2rem", height: "2rem", borderRadius: "50%",
                            border: "2px solid var(--color-border)",
                            borderTopColor: "var(--color-cta-end)",
                            animation: "spin 1s linear infinite",
                        }} />
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                )}

                {/* Empty state */}
                {!loading && scans.length === 0 && (
                    <div style={{
                        borderRadius: "0.75rem", border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)", padding: "5rem 0",
                        textAlign: "center",
                    }}>
                        <p style={{
                            fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)",
                            marginBottom: "0.25rem",
                        }}>No scans yet</p>
                        <p style={{
                            fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-secondary)",
                        }}>Run your first security scan to get started.</p>
                        <Link to="/scan" className="hover-link" style={{
                            display: "inline-block", marginTop: "1rem", fontSize: "0.8rem",
                            fontWeight: 700, color: "var(--color-cta-end)", textDecoration: "none",
                        }}>
                            Start a scan →
                        </Link>
                    </div>
                )}

                {/* Scan table */}
                {!loading && scans.length > 0 && (
                    <div style={{
                        overflow: "hidden", borderRadius: "0.75rem",
                        border: "1px solid var(--color-border)",
                    }}>
                        <table style={{
                            width: "100%", textAlign: "left", fontSize: "0.8rem",
                            borderCollapse: "collapse",
                        }}>
                            <thead>
                                <tr style={{
                                    borderBottom: "1px solid var(--color-border)",
                                    backgroundColor: "var(--color-surface)",
                                }}>
                                    {["Repository", "Score", "Tier", "Date", "Status", ""].map((h) => (
                                        <th key={h} style={{
                                            padding: "0.75rem 1.25rem", fontWeight: 700,
                                            color: "var(--color-text-muted)", fontSize: "0.7rem",
                                            textTransform: "uppercase", letterSpacing: "0.04em",
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {scans.map((scan) => {
                                    const tier = TIER_STYLES[scan.tier] || TIER_STYLES.failed;
                                    const date = scan.startedAt?.toDate
                                        ? scan.startedAt.toDate().toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                        : "—";

                                    return (
                                        <tr
                                            key={scan.id}
                                            className="hover-row"
                                            style={{
                                                borderBottom: "1px solid var(--color-border)",
                                            }}
                                        >
                                            <td style={{ padding: "0.875rem 1.25rem" }}>
                                                <span style={{
                                                    fontWeight: 700, color: "var(--color-text-primary)",
                                                }}>
                                                    {scan.repoOwner}/{scan.repoName}
                                                </span>
                                            </td>
                                            <td style={{ padding: "0.875rem 1.25rem" }}>
                                                <span style={{
                                                    fontFamily: "var(--font-mono)", fontWeight: 800,
                                                    color: "var(--color-text-primary)",
                                                }}>
                                                    {scan.overallScore ?? "—"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "0.875rem 1.25rem" }}>
                                                <span style={{
                                                    borderRadius: "9999px", padding: "0.15rem 0.5rem",
                                                    fontSize: "0.6rem", fontWeight: 800,
                                                    textTransform: "uppercase", letterSpacing: "0.05em",
                                                    color: tier.color, backgroundColor: tier.bg,
                                                }}>
                                                    {tier.label}
                                                </span>
                                            </td>
                                            <td style={{
                                                padding: "0.875rem 1.25rem", fontWeight: 500,
                                                color: "var(--color-text-muted)",
                                            }}>{date}</td>
                                            <td style={{ padding: "0.875rem 1.25rem" }}>
                                                <span style={{
                                                    fontSize: "0.75rem", fontWeight: 700,
                                                    color: scan.status === "complete"
                                                        ? "var(--color-safe)"
                                                        : scan.status === "error"
                                                            ? "var(--color-danger)"
                                                            : "var(--color-warn)",
                                                }}>
                                                    {scan.status || "—"}
                                                </span>
                                            </td>
                                            <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                                                {scan.status === "complete" && (
                                                    <Link
                                                        to={`/report/${scan.id}`}
                                                        className="hover-link"
                                                        style={{
                                                            fontSize: "0.75rem", fontWeight: 700,
                                                            color: "var(--color-cta-end)",
                                                            textDecoration: "none",
                                                        }}
                                                    >
                                                        View Report →
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

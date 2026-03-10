import FindingRow from "./FindingRow";

const STATUS_STYLES = {
    CLEAN: { icon: "✅", color: "rgb(0,150,100)", bg: "rgba(0,150,100,0.06)", border: "rgba(0,150,100,0.15)" },
    WARNING: { icon: "⚠️", color: "rgb(230,170,30)", bg: "rgba(230,170,30,0.06)", border: "rgba(230,170,30,0.15)" },
    CRITICAL: { icon: "❌", color: "rgb(255,60,60)", bg: "rgba(255,60,60,0.06)", border: "rgba(255,60,60,0.15)" },
};

/**
 * Displays local config scan results: per-server cards + summary bar.
 */
export default function LocalScanResults({ results }) {
    const { servers, summary, parseWarnings } = results;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Parse warnings */}
            {parseWarnings.length > 0 && (
                <div style={{
                    borderRadius: "0.5rem", border: "1px solid rgba(230,170,30,0.2)",
                    backgroundColor: "rgba(230,170,30,0.04)", padding: "1rem",
                }}>
                    <div style={{
                        fontSize: "0.65rem", fontWeight: 800, color: "rgb(230,170,30)",
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem",
                    }}>
                        ⚠️ Warnings
                    </div>
                    {parseWarnings.map((w, i) => (
                        <p key={i} style={{
                            fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-secondary)",
                            margin: i < parseWarnings.length - 1 ? "0 0 0.375rem" : 0,
                        }}>
                            <span style={{
                                fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 600,
                                color: "var(--color-text-muted)",
                            }}>
                                {w.source}:
                            </span>{" "}
                            {w.message}
                        </p>
                    ))}
                </div>
            )}

            {/* Per-server cards */}
            {servers.map((server, idx) => {
                const style = STATUS_STYLES[server.status] || STATUS_STYLES.CLEAN;

                return (
                    <div key={`${server.name}-${server.source}-${idx}`} className="hover-card" style={{
                        borderRadius: "0.625rem", border: `1px solid ${style.border}`,
                        backgroundColor: "var(--color-surface)", overflow: "hidden",
                    }}>
                        {/* Server header */}
                        <div style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "1rem 1.25rem",
                            backgroundColor: style.bg,
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ fontSize: "1rem" }}>{style.icon}</span>
                                <div>
                                    <div style={{
                                        fontSize: "0.85rem", fontWeight: 700,
                                        color: "var(--color-text-primary)",
                                    }}>
                                        {server.name}
                                    </div>
                                    <div style={{
                                        fontSize: "0.65rem", fontWeight: 500,
                                        color: "var(--color-text-muted)", marginTop: "2px",
                                        fontFamily: "var(--font-mono)",
                                    }}>
                                        {server.source}
                                    </div>
                                </div>
                            </div>
                            <span style={{
                                fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.05em",
                                fontFamily: "var(--font-mono)",
                                color: style.color,
                                backgroundColor: "rgba(0,0,0,0.2)",
                                padding: "0.15rem 0.5rem", borderRadius: "0.25rem",
                            }}>
                                {server.status}
                            </span>
                        </div>

                        {/* Findings */}
                        {server.findings.length > 0 ? (
                            <div style={{
                                padding: "1rem 1.25rem",
                                display: "flex", flexDirection: "column", gap: "0.625rem",
                            }}>
                                {server.findings.map((f, i) => (
                                    <FindingRow key={i} finding={f} />
                                ))}
                            </div>
                        ) : (
                            <p style={{
                                padding: "1.25rem", textAlign: "center",
                                fontSize: "0.8rem", fontWeight: 600, color: "var(--color-safe)",
                                margin: 0,
                            }}>
                                No issues found — server looks clean
                            </p>
                        )}
                    </div>
                );
            })}

            {/* Summary bar */}
            {servers.length > 0 && (
                <div style={{
                    borderRadius: "0.625rem", border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)", padding: "1.25rem",
                }}>
                    <div style={{
                        fontSize: "0.6rem", fontWeight: 800, color: "var(--color-text-muted)",
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem",
                    }}>
                        Scan Summary
                    </div>

                    <div style={{
                        display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center",
                    }}>
                        <SummaryPill>
                            {summary.totalServers} server{summary.totalServers !== 1 ? "s" : ""} scanned
                        </SummaryPill>

                        {summary.critical > 0 && (
                            <SummaryPill color="rgb(255,60,60)">
                                ❌ {summary.critical} critical
                            </SummaryPill>
                        )}
                        {summary.high > 0 && (
                            <SummaryPill color="rgb(255,120,60)">
                                ❌ {summary.high} high
                            </SummaryPill>
                        )}
                        {summary.medium > 0 && (
                            <SummaryPill color="rgb(230,170,30)">
                                ⚠️ {summary.medium} medium
                            </SummaryPill>
                        )}
                        {summary.low > 0 && (
                            <SummaryPill color="rgb(0,160,220)">
                                ℹ️ {summary.low} low
                            </SummaryPill>
                        )}
                        {summary.critical === 0 && summary.high === 0 && summary.medium === 0 && (
                            <SummaryPill color="rgb(0,150,100)">
                                ✅ All clean
                            </SummaryPill>
                        )}

                        <span style={{
                            marginLeft: "auto",
                            fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 800,
                            color: summary.scoreDeduction === 0
                                ? "rgb(0,150,100)"
                                : summary.scoreDeduction >= -30
                                    ? "rgb(230,170,30)"
                                    : "rgb(255,60,60)",
                        }}>
                            Trust Score Impact: {summary.scoreDeduction}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryPill({ children, color }) {
    return (
        <span style={{
            borderRadius: "9999px", padding: "0.25rem 0.625rem",
            backgroundColor: color
                ? color.replace("rgb", "rgba").replace(")", ",0.08)")
                : "var(--color-surface)",
            border: `1px solid ${color
                ? color.replace("rgb", "rgba").replace(")", ",0.2)")
                : "var(--color-border)"}`,
            fontSize: "0.7rem", fontWeight: 600,
            color: color || "var(--color-text-secondary)",
        }}>
            {children}
        </span>
    );
}

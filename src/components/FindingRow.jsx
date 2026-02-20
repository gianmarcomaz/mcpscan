const SEVERITY_STYLES = {
    critical: {
        label: "CRITICAL", color: "rgb(255,60,60)",
        bg: "rgba(255,60,60,0.06)", border: "rgba(255,60,60,0.12)",
    },
    high: {
        label: "HIGH", color: "rgb(255,120,60)",
        bg: "rgba(255,120,60,0.06)", border: "rgba(255,120,60,0.12)",
    },
    medium: {
        label: "MEDIUM", color: "rgb(230,170,30)",
        bg: "rgba(230,170,30,0.06)", border: "rgba(230,170,30,0.12)",
    },
    low: {
        label: "LOW", color: "rgb(0,160,220)",
        bg: "rgba(0,160,220,0.06)", border: "rgba(0,160,220,0.12)",
    },
    info: {
        label: "INFO", color: "rgba(255,255,255,0.35)",
        bg: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.06)",
    },
};

/**
 * A single finding row with severity, file, line, snippet, message, and remediation.
 */
export default function FindingRow({ finding }) {
    const s = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.info;

    return (
        <div style={{
            overflow: "hidden", borderRadius: "0.5rem",
            backgroundColor: s.bg, border: `1px solid ${s.border}`,
        }}>
            {/* Header */}
            <div style={{
                display: "flex", flexWrap: "wrap", alignItems: "center",
                gap: "0.5rem", padding: "0.75rem 1rem 0.5rem",
            }}>
                {/* Severity badge */}
                <span style={{
                    display: "inline-flex", alignItems: "center", gap: "0.375rem",
                    borderRadius: "0.25rem", padding: "0.125rem 0.5rem",
                    fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.05em",
                    color: s.color, backgroundColor: "rgba(0,0,0,0.2)",
                    fontFamily: "var(--font-mono)",
                }}>
                    <span style={{
                        display: "inline-block", width: "4px", height: "4px",
                        borderRadius: "50%", backgroundColor: s.color,
                    }} />
                    {s.label}
                </span>
                {/* File path */}
                <span style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 500,
                    color: "var(--color-text-secondary)",
                }}>
                    {finding.file}
                    {finding.line != null && (
                        <span style={{ color: "var(--color-text-muted)" }}>:{finding.line}</span>
                    )}
                </span>
            </div>

            {/* Message */}
            <div style={{ padding: "0 1rem 0.75rem" }}>
                <p style={{
                    fontSize: "0.8rem", fontWeight: 500, lineHeight: 1.6,
                    color: "var(--color-text-secondary)", margin: 0,
                }}>
                    {finding.message}
                </p>
            </div>

            {/* Code snippet */}
            {finding.snippet && (
                <div style={{ margin: "0 0.75rem 0.75rem" }}>
                    <pre style={{
                        overflowX: "auto", borderRadius: "0.375rem",
                        backgroundColor: "rgba(0,0,0,0.3)", padding: "0.75rem",
                        fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 500,
                        lineHeight: 1.7, color: "var(--color-cta-end)",
                        margin: 0,
                    }}>
                        {finding.snippet}
                    </pre>
                </div>
            )}

            {/* Remediation */}
            {finding.remediation && (
                <div style={{
                    margin: "0 0.75rem 0.75rem", borderRadius: "0.375rem",
                    backgroundColor: "rgba(0,0,0,0.15)", padding: "0.75rem",
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "0.375rem",
                        marginBottom: "0.25rem",
                    }}>
                        <span style={{
                            fontSize: "0.55rem", fontWeight: 800,
                            textTransform: "uppercase", letterSpacing: "0.05em",
                            color: "var(--color-cta-end)",
                        }}>
                            How to fix
                        </span>
                    </div>
                    <p style={{
                        fontSize: "0.7rem", fontWeight: 500, lineHeight: 1.6,
                        color: "var(--color-text-secondary)", margin: 0,
                    }}>
                        {finding.remediation}
                    </p>
                </div>
            )}
        </div>
    );
}

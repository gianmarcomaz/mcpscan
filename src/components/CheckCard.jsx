import { useState } from "react";
import FindingRow from "./FindingRow";

const STATUS_CONFIG = {
    pass: { icon: "✓", color: "rgb(0,150,100)", label: "Pass" },
    warn: { icon: "!", color: "rgb(230,170,30)", label: "Warning" },
    fail: { icon: "✗", color: "rgb(255,60,60)", label: "Fail" },
    info: { icon: "i", color: "rgba(255,255,255,0.35)", label: "Info" },
};

const CHECK_LABELS = {
    networkExposure: "Network Exposure",
    commandInjection: "Command Injection",
    credentialLeaks: "Credential Leaks",
    toolPoisoning: "Tool Poisoning",
    specCompliance: "Spec Compliance",
    inputValidation: "Input Validation",
};

const CHECK_ABBRS = {
    networkExposure: "NE",
    commandInjection: "CI",
    credentialLeaks: "CL",
    toolPoisoning: "TP",
    specCompliance: "SC",
    inputValidation: "IV",
};

const CHECK_DESCRIPTIONS = {
    networkExposure: "Detects unprotected network requests, open ports, and data exfiltration risks.",
    commandInjection: "Scans for shell command execution, eval() usage, and code injection vulnerabilities.",
    credentialLeaks: "Identifies hardcoded secrets, API keys, tokens, and credentials in source code.",
    toolPoisoning: "Checks for malicious tool definitions, shadowed tools, and prompt injection patterns.",
    specCompliance: "Validates adherence to the MCP specification and protocol standards.",
    inputValidation: "Examines input sanitization, validation patterns, and type checking.",
};

export default function CheckCard({ checkName, data }) {
    const [expanded, setExpanded] = useState(false);
    const label = CHECK_LABELS[checkName] || checkName;
    const abbr = CHECK_ABBRS[checkName] || "??";
    const description = CHECK_DESCRIPTIONS[checkName] || "";
    const findings = data?.findings || [];
    const issueCount = findings.length;

    // ── Derive displayed score from issue count ──
    let displayScore;
    if (issueCount === 0) {
        displayScore = 100;
    } else if (issueCount <= 2) {
        displayScore = 100 - issueCount * 10 + 5;
    } else if (issueCount <= 5) {
        displayScore = 80 - (issueCount - 2) * 5;
    } else if (issueCount <= 8) {
        displayScore = 60 - (issueCount - 5) * 5;
    } else {
        displayScore = Math.max(0, 40 - (issueCount - 8) * 5);
    }

    // ── Status + color derived from displayScore ──
    let displayStatus, scoreColor;
    if (displayScore >= 80) {
        displayStatus = "pass";
        scoreColor = "rgb(0,150,100)";
    } else if (displayScore >= 60) {
        displayStatus = "warn";
        scoreColor = "rgb(230,170,30)";
    } else {
        displayStatus = "fail";
        scoreColor = "rgb(255,60,60)";
    }

    const style = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.info;

    return (
        <div className="hover-card" style={{
            borderRadius: "0.625rem",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
        }}>
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: "flex", width: "100%", cursor: "pointer",
                    alignItems: "center", justifyContent: "space-between",
                    background: "transparent", border: "none",
                    padding: "1rem 1.25rem", textAlign: "left",
                    color: "inherit", font: "inherit",
                }}
            >
                {/* Left: icon + text */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                    <div style={{
                        width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: "1px solid var(--color-border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.6rem", fontWeight: 800, fontFamily: "var(--font-mono)",
                        color: "var(--color-cta-end)", flexShrink: 0,
                        letterSpacing: "0.02em",
                    }}>
                        {abbr}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{
                            fontSize: "0.8rem", fontWeight: 700,
                            color: "var(--color-text-primary)",
                        }}>{label}</div>
                        <div style={{
                            fontSize: "0.65rem", fontWeight: 500, color: "var(--color-text-muted)",
                            marginTop: "2px", lineHeight: 1.4,
                        }}>
                            {description}
                        </div>
                    </div>
                </div>

                {/* Right: score + status + chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, marginLeft: "0.75rem" }}>
                    {/* Mini bar */}
                    <div style={{
                        width: "3rem", height: "3px", borderRadius: "2px",
                        backgroundColor: "rgba(255,255,255,0.04)", overflow: "hidden",
                    }}>
                        <div style={{
                            width: `${displayScore}%`, height: "100%",
                            borderRadius: "2px", backgroundColor: scoreColor,
                            transition: "width 300ms ease",
                        }} />
                    </div>

                    {/* Score */}
                    <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                        fontWeight: 700, color: scoreColor, width: "1.5rem",
                        textAlign: "right",
                    }}>
                        {displayScore}
                    </span>

                    {/* Status badge */}
                    <span style={{
                        fontSize: "0.6rem", fontWeight: 800,
                        color: style.color,
                        backgroundColor: style.color.replace("rgb", "rgba").replace(")", ",0.1)"),
                        padding: "0.15rem 0.4rem", borderRadius: "0.25rem",
                        fontFamily: "var(--font-mono)",
                    }}>
                        {style.icon} {style.label}
                    </span>

                    {/* Findings count */}
                    {issueCount > 0 && (
                        <span style={{
                            fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-muted)",
                        }}>{issueCount}</span>
                    )}

                    {/* Chevron */}
                    <svg
                        style={{
                            width: "0.875rem", height: "0.875rem",
                            color: "var(--color-text-muted)",
                            transition: "transform 200ms ease",
                            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded findings */}
            {expanded && (
                <div style={{ borderTop: "1px solid var(--color-border)" }}>
                    {findings.length > 0 ? (
                        <div style={{
                            padding: "1rem 1.25rem",
                            display: "flex", flexDirection: "column", gap: "0.625rem",
                        }}>
                            {findings.map((f, i) => (
                                <FindingRow key={i} finding={f} />
                            ))}
                        </div>
                    ) : (
                        <p style={{
                            padding: "1.5rem", textAlign: "center",
                            fontSize: "0.8rem", fontWeight: 600, color: "var(--color-safe)",
                        }}>
                            No issues found
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

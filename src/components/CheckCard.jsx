import { useState } from "react";
import FindingRow from "./FindingRow";

const STATUS_CONFIG = {
    pass: { icon: "✓", color: "#22c55e", label: "Pass" },
    warn: { icon: "⚠", color: "#eab308", label: "Warning" },
    fail: { icon: "✗", color: "#ef4444", label: "Fail" },
    info: { icon: "ℹ", color: "#3b82f6", label: "Info" },
};

const CHECK_LABELS = {
    networkExposure: "Network Exposure",
    commandInjection: "Command Injection",
    credentialLeaks: "Credential Leaks",
    toolPoisoning: "Tool Poisoning",
    specCompliance: "Spec Compliance",
    inputValidation: "Input Validation",
};

const CHECK_ICONS = {
    networkExposure: "🌐",
    commandInjection: "💉",
    credentialLeaks: "🔑",
    toolPoisoning: "☠️",
    specCompliance: "📋",
    inputValidation: "🛡️",
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
    const style = STATUS_CONFIG[data?.status] || STATUS_CONFIG.info;
    const label = CHECK_LABELS[checkName] || checkName;
    const icon = CHECK_ICONS[checkName] || "🔍";
    const description = CHECK_DESCRIPTIONS[checkName] || "";
    const findings = data?.findings || [];
    const score = data?.score ?? 0;
    const scoreColor = score >= 90 ? "#22c55e" : score >= 70 ? "#eab308" : "#ef4444";

    return (
        <div
            style={{
                borderRadius: "0.75rem",
                border: "1px solid #1e293b",
                backgroundColor: "#0f172a",
                transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#334155")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1e293b")}
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: "flex",
                    width: "100%",
                    cursor: "pointer",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    padding: "1.25rem",
                    textAlign: "left",
                    color: "inherit",
                    font: "inherit",
                }}
            >
                {/* Left: icon + text */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            width: "2.5rem",
                            height: "2.5rem",
                            borderRadius: "0.75rem",
                            backgroundColor: style.color + "15",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.1rem",
                            flexShrink: 0,
                        }}
                    >
                        {icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e2e8f0" }}>{label}</div>
                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "2px", lineHeight: 1.4 }}>
                            {description}
                        </div>
                    </div>
                </div>

                {/* Right: score + status + chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, marginLeft: "0.75rem" }}>
                    {/* Mini bar */}
                    <div style={{ width: "3.5rem", height: "5px", borderRadius: "3px", backgroundColor: "#1e293b", overflow: "hidden" }}>
                        <div style={{ width: `${score}%`, height: "100%", borderRadius: "3px", backgroundColor: scoreColor }} />
                    </div>

                    {/* Score */}
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 700, color: scoreColor, width: "1.75rem", textAlign: "right" }}>
                        {score}
                    </span>

                    {/* Status badge */}
                    <span
                        style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: style.color,
                            backgroundColor: style.color + "18",
                            padding: "0.15rem 0.4rem",
                            borderRadius: "0.25rem",
                        }}
                    >
                        {style.icon} {style.label}
                    </span>

                    {/* Findings count */}
                    {findings.length > 0 && (
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{findings.length}</span>
                    )}

                    {/* Chevron */}
                    <svg
                        style={{
                            width: "1rem",
                            height: "1rem",
                            color: "#475569",
                            transition: "transform 0.15s",
                            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded findings */}
            {expanded && (
                <div style={{ borderTop: "1px solid #1e293b" }}>
                    {findings.length > 0 ? (
                        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {findings.map((f, i) => (
                                <FindingRow key={i} finding={f} />
                            ))}
                        </div>
                    ) : (
                        <p style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "#64748b" }}>
                            No issues found 🎉
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}

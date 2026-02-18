import { Link } from "react-router-dom";
import { useAuth } from "../utils/auth";

const STEPS = [
    { icon: "📎", title: "Submit", desc: "Paste your GitHub repo URL — any MCP server repository." },
    { icon: "🔍", title: "Scan", desc: "We run 6 automated security checks using static analysis." },
    { icon: "🏆", title: "Certify", desc: "Get a score, report, and embeddable certification badge." },
];

const CHECKS = [
    { icon: "🌐", name: "Network Exposure", desc: "Detect servers binding to 0.0.0.0 instead of localhost." },
    { icon: "💉", name: "Command Injection", desc: "Find exec/eval/spawn calls that could enable RCE." },
    { icon: "🔑", name: "Credential Leaks", desc: "Spot hardcoded API keys, tokens, and passwords." },
    { icon: "☠️", name: "Tool Poisoning", desc: "Identify prompt injection in tool descriptions." },
    { icon: "📋", name: "Spec Compliance", desc: "Validate MCP protocol structure and best practices." },
    { icon: "🛡️", name: "Input Validation", desc: "Assess whether tool inputs are properly validated." },
];

export default function LandingPage() {
    const { user, signIn } = useAuth();

    return (
        <div style={{ minHeight: "100vh", paddingTop: "4rem" }}>

            {/* ─── HERO ─── */}
            <section style={{ position: "relative", overflow: "hidden" }}>
                {/* Background glow */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <div style={{
                        position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)",
                        width: "800px", height: "500px", borderRadius: "50%",
                        background: "radial-gradient(ellipse, rgba(34,197,94,0.06) 0%, transparent 70%)",
                    }} />
                </div>

                <div style={{ position: "relative", maxWidth: "64rem", margin: "0 auto", padding: "5rem 1.5rem 4rem", textAlign: "center" }}>
                    {/* Beta pill */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        borderRadius: "9999px", border: "1px solid rgba(34,197,94,0.2)",
                        backgroundColor: "rgba(34,197,94,0.05)", padding: "0.375rem 1rem",
                        fontSize: "0.75rem", fontWeight: 500, color: "#4ade80", marginBottom: "2rem",
                    }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#4ade80" }} />
                        Now in public beta
                    </div>

                    {/* Title */}
                    <h1 style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 800, color: "#fff", lineHeight: 1.1, marginBottom: "1.5rem" }}>
                        Trust Infrastructure for{" "}
                        <span style={{ background: "linear-gradient(135deg, #34d399, #22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            MCP Servers
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p style={{ fontSize: "1.1rem", color: "#94a3b8", lineHeight: 1.7, maxWidth: "36rem", margin: "0 auto 2.5rem" }}>
                        Automated security scanning and certification for the AI agent ecosystem.
                        Know what your MCP servers are doing — before your users do.
                    </p>

                    {/* Stats */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "3rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
                        {[
                            { value: "13,000+", label: "MCP servers" },
                            { value: "0", label: "certification standards" },
                            { value: "6", label: "vulnerability classes" },
                        ].map((s) => (
                            <div key={s.label} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>{s.value}</div>
                                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.25rem" }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.25rem", flexWrap: "wrap" }}>
                        {user ? (
                            <Link to="/scan" style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.875rem 2rem", borderRadius: "0.75rem",
                                background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                                fontWeight: 600, fontSize: "0.95rem", textDecoration: "none",
                                boxShadow: "0 4px 24px rgba(16,185,129,0.25)",
                                transition: "transform 0.15s, box-shadow 0.15s",
                            }}>
                                Scan Your Server — Free →
                            </Link>
                        ) : (
                            <button onClick={signIn} style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.875rem 2rem", borderRadius: "0.75rem", border: "none",
                                background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                                fontWeight: 600, fontSize: "0.95rem", cursor: "pointer",
                                boxShadow: "0 4px 24px rgba(16,185,129,0.25)",
                                transition: "transform 0.15s, box-shadow 0.15s",
                            }}>
                                Scan Your Server — Free →
                            </button>
                        )}
                        <a href="#how-it-works" style={{ fontSize: "0.875rem", color: "#94a3b8", textDecoration: "none" }}>
                            How it works →
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section id="how-it-works" style={{ borderTop: "1px solid #1e293b" }}>
                <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "5rem 1.5rem" }}>
                    <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "3rem" }}>
                        How It Works
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
                        {STEPS.map((step, i) => (
                            <div key={step.title} style={{
                                borderRadius: "1rem", border: "1px solid #1e293b",
                                backgroundColor: "rgba(15,23,42,0.6)", padding: "2rem 1.5rem",
                                textAlign: "center", transition: "border-color 0.15s",
                            }}>
                                <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>{step.icon}</div>
                                <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                                    Step {i + 1}
                                </div>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>{step.title}</h3>
                                <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.6 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SECURITY CHECKS ─── */}
            <section style={{ borderTop: "1px solid #1e293b" }}>
                <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "5rem 1.5rem" }}>
                    <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "3rem" }}>
                        6 Critical Security Checks
                    </h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                        {CHECKS.map((check) => (
                            <div key={check.name} style={{
                                borderRadius: "0.75rem", border: "1px solid #1e293b",
                                backgroundColor: "rgba(15,23,42,0.6)", padding: "1.5rem",
                                transition: "border-color 0.15s",
                            }}>
                                <span style={{ fontSize: "1.5rem" }}>{check.icon}</span>
                                <h4 style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e2e8f0", marginTop: "0.75rem" }}>
                                    {check.name}
                                </h4>
                                <p style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.6, marginTop: "0.375rem" }}>
                                    {check.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer style={{ borderTop: "1px solid #1e293b" }}>
                <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "2rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", color: "#64748b" }}>
                        <span>🛡️</span> MCP Certify
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.75rem" }}>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "none" }}>GitHub</a>
                        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" style={{ color: "#475569", textDecoration: "none" }}>MCP Spec</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

import { Link } from "react-router-dom";
import { useAuth } from "../utils/auth";

const STEPS = [
    { num: "01", title: "Submit", desc: "Paste your GitHub repo URL — any MCP server repository." },
    { num: "02", title: "Scan", desc: "We run 6 automated security checks using static analysis." },
    { num: "03", title: "Certify", desc: "Get a score, report, and embeddable certification badge." },
];

const CHECKS = [
    { abbr: "NE", name: "Network Exposure", desc: "Detect servers binding to 0.0.0.0 instead of localhost." },
    { abbr: "CI", name: "Command Injection", desc: "Find exec/eval/spawn calls that could enable RCE." },
    { abbr: "CL", name: "Credential Leaks", desc: "Spot hardcoded API keys, tokens, and passwords." },
    { abbr: "TP", name: "Tool Poisoning", desc: "Identify prompt injection in tool descriptions." },
    { abbr: "SC", name: "Spec Compliance", desc: "Validate MCP protocol structure and best practices." },
    { abbr: "IV", name: "Input Validation", desc: "Assess whether tool inputs are properly validated." },
];

export default function LandingPage() {
    const { user, signIn } = useAuth();

    return (
        <div style={{ minHeight: "100vh", paddingTop: "3.5rem" }}>

            {/* ─── HERO ─── */}
            <section style={{ position: "relative", overflow: "hidden" }}>
                {/* Background glow */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                    <div style={{
                        position: "absolute", left: "50%", top: "-10%", transform: "translateX(-50%)",
                        width: "700px", height: "500px", borderRadius: "50%",
                        background: "radial-gradient(ellipse, rgba(0,160,220,0.06) 0%, transparent 70%)",
                    }} />
                </div>

                <div style={{
                    position: "relative", maxWidth: "64rem", margin: "0 auto",
                    padding: "6rem 1.5rem 4rem", textAlign: "center",
                }}>
                    {/* Beta pill */}
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "0.5rem",
                        borderRadius: "9999px", border: "1px solid var(--color-border)",
                        backgroundColor: "var(--color-surface)", padding: "0.375rem 1rem",
                        fontSize: "0.7rem", fontWeight: 600, color: "var(--color-cta-end)",
                        marginBottom: "2rem",
                    }}>
                        <span style={{
                            width: "5px", height: "5px", borderRadius: "50%",
                            backgroundColor: "var(--color-cta-end)",
                        }} />
                        Now in public beta
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 800,
                        lineHeight: 1.1, marginBottom: "1.25rem", letterSpacing: "-0.03em",
                    }}>
                        Trust Infrastructure for{" "}
                        <span style={{
                            background: "linear-gradient(135deg, var(--color-cta-start), var(--color-cta-end))",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>
                            MCP Servers
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: "1rem", fontWeight: 500, color: "var(--color-text-secondary)",
                        lineHeight: 1.7, maxWidth: "34rem", margin: "0 auto 2.5rem",
                    }}>
                        Automated security scanning and certification for the AI agent ecosystem.
                        Know what your MCP servers are doing — before your users do.
                    </p>

                    {/* Stats */}
                    <div style={{
                        display: "flex", justifyContent: "center", gap: "3rem",
                        marginBottom: "2.5rem", flexWrap: "wrap",
                    }}>
                        {[
                            { value: "13,000+", label: "MCP servers" },
                            { value: "0", label: "certification standards" },
                            { value: "6", label: "vulnerability classes" },
                        ].map((s) => (
                            <div key={s.label} style={{ textAlign: "center" }}>
                                <div style={{
                                    fontSize: "1.5rem", fontWeight: 800,
                                    color: "var(--color-text-primary)",
                                }}>{s.value}</div>
                                <div style={{
                                    fontSize: "0.65rem", fontWeight: 600, color: "var(--color-text-muted)",
                                    marginTop: "0.125rem", textTransform: "uppercase",
                                    letterSpacing: "0.05em",
                                }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        gap: "1rem", flexWrap: "wrap",
                    }}>
                        {user ? (
                            <Link to="/scan" className="hover-glow" style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.75rem 1.75rem", borderRadius: "0.5rem",
                                background: "linear-gradient(135deg, var(--color-cta-start), var(--color-cta-end))",
                                color: "#fff", fontWeight: 700, fontSize: "0.875rem",
                                textDecoration: "none",
                                boxShadow: "0 4px 20px var(--color-cta-glow)",
                            }}>
                                Scan Your Server — Free
                            </Link>
                        ) : (
                            <button onClick={signIn} className="hover-glow" style={{
                                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.75rem 1.75rem", borderRadius: "0.5rem", border: "none",
                                background: "linear-gradient(135deg, var(--color-cta-start), var(--color-cta-end))",
                                color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
                                boxShadow: "0 4px 20px var(--color-cta-glow)",
                            }}>
                                Scan Your Server — Free
                            </button>
                        )}
                        <a href="#how-it-works" className="hover-link" style={{
                            fontSize: "0.8rem", fontWeight: 600, color: "var(--color-text-secondary)",
                            textDecoration: "none",
                        }}>
                            How it works →
                        </a>
                    </div>
                </div>
            </section>

            {/* ─── HOW IT WORKS ─── */}
            <section id="how-it-works" style={{ borderTop: "1px solid var(--color-border)" }}>
                <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "5rem 1.5rem" }}>
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                        <p style={{
                            fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
                            letterSpacing: "0.1em", color: "var(--color-cta-end)", marginBottom: "0.5rem",
                        }}>Process</p>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>How It Works</h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
                        {STEPS.map((step) => (
                            <div key={step.title} className="hover-card" style={{
                                borderRadius: "0.75rem", border: "1px solid var(--color-border)",
                                backgroundColor: "var(--color-surface)", padding: "2rem 1.5rem",
                            }}>
                                <div style={{
                                    fontSize: "0.65rem", fontWeight: 800, color: "var(--color-cta-end)",
                                    fontFamily: "var(--font-mono)", marginBottom: "1rem",
                                    letterSpacing: "0.05em",
                                }}>
                                    {step.num}
                                </div>
                                <h3 style={{
                                    fontSize: "1rem", fontWeight: 800,
                                    marginBottom: "0.5rem",
                                }}>{step.title}</h3>
                                <p style={{
                                    fontSize: "0.8rem", fontWeight: 500, color: "var(--color-text-secondary)",
                                    lineHeight: 1.6,
                                }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── SECURITY CHECKS ─── */}
            <section style={{ borderTop: "1px solid var(--color-border)" }}>
                <div style={{ maxWidth: "64rem", margin: "0 auto", padding: "5rem 1.5rem" }}>
                    <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                        <p style={{
                            fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase",
                            letterSpacing: "0.1em", color: "var(--color-cta-end)", marginBottom: "0.5rem",
                        }}>Coverage</p>
                        <h2 style={{ fontSize: "1.5rem", fontWeight: 800 }}>6 Critical Security Checks</h2>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                        {CHECKS.map((check) => (
                            <div key={check.name} className="hover-card" style={{
                                borderRadius: "0.75rem", border: "1px solid var(--color-border)",
                                backgroundColor: "var(--color-surface)", padding: "1.5rem",
                            }}>
                                <div style={{
                                    width: "2.25rem", height: "2.25rem", borderRadius: "0.5rem",
                                    backgroundColor: "rgba(0,160,220,0.08)",
                                    border: "1px solid rgba(0,160,220,0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "0.6rem", fontWeight: 800, color: "var(--color-cta-end)",
                                    fontFamily: "var(--font-mono)", letterSpacing: "0.02em",
                                }}>
                                    {check.abbr}
                                </div>
                                <h4 style={{
                                    fontSize: "0.85rem", fontWeight: 700, marginTop: "0.75rem",
                                }}>{check.name}</h4>
                                <p style={{
                                    fontSize: "0.75rem", fontWeight: 500, color: "var(--color-text-muted)",
                                    lineHeight: 1.6, marginTop: "0.375rem",
                                }}>{check.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ─── FOOTER ─── */}
            <footer style={{ borderTop: "1px solid var(--color-border)" }}>
                <div style={{
                    maxWidth: "64rem", margin: "0 auto", padding: "1.5rem",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "0.5rem",
                        fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-muted)",
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        MCP Certify
                    </div>
                    <div style={{ display: "flex", gap: "1.5rem", fontSize: "0.7rem" }}>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                            className="hover-link" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>GitHub</a>
                        <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer"
                            className="hover-link" style={{ color: "var(--color-text-muted)", textDecoration: "none" }}>MCP Spec</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

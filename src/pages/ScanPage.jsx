import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { httpsCallable, getFunctions } from "firebase/functions";
import { useAuth } from "../utils/auth";
import ScanProgress from "../components/ScanProgress";
import app from "../firebase";

const REPO_URL_REGEX = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

const EXAMPLES = [
    "https://github.com/modelcontextprotocol/servers",
    "https://github.com/anthropics/anthropic-cookbook",
];

export default function ScanPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [url, setUrl] = useState("");
    const [error, setError] = useState("");
    const [scanning, setScanning] = useState(false);
    const [scanId, setScanId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const trimmed = url.trim().replace(/\/+$/, "");
        if (!REPO_URL_REGEX.test(trimmed)) {
            setError("Please enter a valid GitHub repository URL (https://github.com/owner/repo)");
            return;
        }
        setScanning(true);
        try {
            const functions = getFunctions(app);
            const scanRepo = httpsCallable(functions, "scanRepo");
            const result = await scanRepo({ repoUrl: trimmed });
            setScanId(result.data.scanId);
        } catch (err) {
            setError(err.message || "Failed to start scan");
            setScanning(false);
        }
    };

    const handleComplete = useCallback(
        () => setTimeout(() => navigate(`/report/${scanId}`), 1500),
        [scanId, navigate]
    );

    return (
        <div style={{ minHeight: "100vh", paddingTop: "3.5rem" }}>
            <div style={{ maxWidth: "36rem", margin: "0 auto", padding: "5rem 1.5rem 4rem" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "3rem", height: "3rem", borderRadius: "0.75rem",
                        backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)",
                        marginBottom: "1.25rem",
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cta-end)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                        </svg>
                    </div>
                    <h1 style={{
                        fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem",
                    }}>
                        Scan Your MCP Server
                    </h1>
                    <p style={{
                        fontSize: "0.85rem", fontWeight: 500, color: "var(--color-text-secondary)",
                        lineHeight: 1.6,
                    }}>
                        Paste your GitHub repository URL to start a security scan.
                    </p>
                </div>

                {/* Form */}
                {!scanId && (
                    <form onSubmit={handleSubmit}>
                        <label
                            htmlFor="repo-url"
                            style={{
                                display: "block", fontSize: "0.75rem", fontWeight: 700,
                                color: "var(--color-text-secondary)", marginBottom: "0.5rem",
                            }}
                        >
                            Repository URL
                        </label>

                        {/* Input Row */}
                        <div style={{ display: "flex", gap: "0.625rem", marginBottom: "0.75rem" }}>
                            <input
                                id="repo-url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://github.com/owner/repo"
                                disabled={scanning}
                                style={{
                                    flex: 1, padding: "0.75rem 1rem", borderRadius: "0.5rem",
                                    border: "1px solid var(--color-border)",
                                    backgroundColor: "var(--color-surface)",
                                    fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 500,
                                    color: "var(--color-text-primary)", outline: "none",
                                    transition: "border-color 200ms ease",
                                    opacity: scanning ? 0.5 : 1,
                                }}
                                onFocus={(e) => e.target.style.borderColor = "var(--color-cta-start)"}
                                onBlur={(e) => e.target.style.borderColor = "var(--color-border)"}
                            />
                            <button
                                type="submit"
                                disabled={scanning || !url.trim()}
                                className="hover-glow"
                                style={{
                                    padding: "0.75rem 1.5rem", borderRadius: "0.5rem", border: "none",
                                    background: "linear-gradient(135deg, var(--color-cta-start), var(--color-cta-end))",
                                    color: "#fff", fontWeight: 700, fontSize: "0.8rem",
                                    cursor: scanning || !url.trim() ? "not-allowed" : "pointer",
                                    opacity: scanning || !url.trim() ? 0.5 : 1,
                                    boxShadow: "0 4px 16px var(--color-cta-glow)",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {scanning ? "Starting…" : "Start Scan"}
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <p style={{
                                fontSize: "0.75rem", fontWeight: 600, color: "var(--color-danger)",
                                marginBottom: "1rem",
                            }}>{error}</p>
                        )}

                        {/* Examples */}
                        <div style={{
                            borderRadius: "0.5rem", border: "1px solid var(--color-border)",
                            backgroundColor: "var(--color-surface)", padding: "1.25rem",
                            marginTop: "1.5rem",
                        }}>
                            <p style={{
                                fontSize: "0.65rem", fontWeight: 800, color: "var(--color-text-muted)",
                                marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em",
                            }}>
                                Try an example
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {EXAMPLES.map((example) => (
                                    <button
                                        key={example}
                                        type="button"
                                        onClick={() => setUrl(example)}
                                        className="hover-ghost"
                                        style={{
                                            padding: "0.375rem 0.75rem", borderRadius: "0.375rem",
                                            border: "1px solid var(--color-border)",
                                            backgroundColor: "transparent",
                                            fontFamily: "var(--font-mono)", fontSize: "0.7rem", fontWeight: 500,
                                            color: "var(--color-text-secondary)", cursor: "pointer",
                                        }}
                                    >
                                        {example.replace("https://github.com/", "")}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </form>
                )}

                {/* Progress */}
                {scanId && (
                    <div>
                        <ScanProgress scanId={scanId} onComplete={handleComplete} />
                    </div>
                )}
            </div>
        </div>
    );
}

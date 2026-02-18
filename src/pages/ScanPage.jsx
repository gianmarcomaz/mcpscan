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
        <div style={{ minHeight: "100vh", paddingTop: "4rem" }}>
            <div style={{ maxWidth: "40rem", margin: "0 auto", padding: "5rem 1.5rem 4rem" }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                    <span style={{ fontSize: "2.5rem", display: "block", marginBottom: "1rem" }}>🔍</span>
                    <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
                        Scan Your MCP Server
                    </h1>
                    <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: 1.6 }}>
                        Paste your GitHub repository URL to start a security scan.
                    </p>
                </div>

                {/* Form */}
                {!scanId && (
                    <form onSubmit={handleSubmit}>
                        {/* Label */}
                        <label htmlFor="repo-url" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#cbd5e1", marginBottom: "0.5rem" }}>
                            Repository URL
                        </label>

                        {/* Input Row */}
                        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
                            <input
                                id="repo-url"
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://github.com/owner/repo"
                                disabled={scanning}
                                style={{
                                    flex: 1, padding: "0.875rem 1rem", borderRadius: "0.75rem",
                                    border: "1px solid #334155", backgroundColor: "#0f172a",
                                    fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "#fff",
                                    outline: "none", transition: "border-color 0.15s",
                                    opacity: scanning ? 0.5 : 1,
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "#10b981")}
                                onBlur={(e) => (e.target.style.borderColor = "#334155")}
                            />
                            <button
                                type="submit"
                                disabled={scanning || !url.trim()}
                                style={{
                                    padding: "0.875rem 1.5rem", borderRadius: "0.75rem", border: "none",
                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                    color: "#fff", fontWeight: 600, fontSize: "0.85rem",
                                    cursor: scanning || !url.trim() ? "not-allowed" : "pointer",
                                    opacity: scanning || !url.trim() ? 0.5 : 1,
                                    boxShadow: "0 4px 16px rgba(16,185,129,0.2)",
                                    whiteSpace: "nowrap", transition: "opacity 0.15s",
                                }}
                            >
                                {scanning ? "Starting…" : "Start Scan"}
                            </button>
                        </div>

                        {/* Error */}
                        {error && (
                            <p style={{ fontSize: "0.8rem", color: "#f87171", marginBottom: "1rem" }}>{error}</p>
                        )}

                        {/* Examples */}
                        <div style={{
                            borderRadius: "0.75rem", border: "1px solid #1e293b",
                            backgroundColor: "rgba(15,23,42,0.6)", padding: "1.25rem",
                            marginTop: "1.5rem",
                        }}>
                            <p style={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b", marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                Try an example
                            </p>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                                {EXAMPLES.map((example) => (
                                    <button
                                        key={example}
                                        type="button"
                                        onClick={() => setUrl(example)}
                                        style={{
                                            padding: "0.4rem 0.75rem", borderRadius: "0.5rem",
                                            border: "1px solid #334155", backgroundColor: "#1e293b",
                                            fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "#94a3b8",
                                            cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
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

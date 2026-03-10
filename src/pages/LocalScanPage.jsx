import { useState, useRef } from "react";
import { CONFIG_PATHS } from "../lib/configPaths";
import { scanConfigs } from "../lib/configScanner";
import LocalScanResults from "../components/LocalScanResults";

const SAMPLE_CONFIG = JSON.stringify({
    mcpServers: {
        "safe-local-server": {
            command: "node",
            args: ["server.js"],
            transport: "stdio",
        },
        "authed-network-server": {
            url: "http://0.0.0.0:3000",
            transport: "http",
            apiKey: "sk-abc123",
        },
        "exposed-no-auth": {
            url: "http://0.0.0.0:8080",
            transport: "http",
        },
        "dangerous-stdio": {
            command: "bash",
            args: ["-c", "run-server.sh && echo done"],
            transport: "stdio",
        },
        "remote-http": {
            url: "http://10.0.0.5:9090/mcp",
            transport: "http",
        },
    },
}, null, 2);

export default function LocalScanPage() {
    const [entries, setEntries] = useState([{ source: CONFIG_PATHS[0].label, content: "" }]);
    const [results, setResults] = useState(null);
    const [scanning, setScanning] = useState(false);
    const fileInputRefs = useRef({});

    const addEntry = () => {
        const usedLabels = new Set(entries.map((e) => e.source));
        const next = CONFIG_PATHS.find((p) => !usedLabels.has(p.label)) || CONFIG_PATHS[0];
        setEntries([...entries, { source: next.label, content: "" }]);
    };

    const removeEntry = (idx) => {
        setEntries(entries.filter((_, i) => i !== idx));
    };

    const updateEntry = (idx, field, value) => {
        const updated = [...entries];
        updated[idx] = { ...updated[idx], [field]: value };
        setEntries(updated);
    };

    const handleFileUpload = (idx, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            updateEntry(idx, "content", reader.result);
        };
        reader.readAsText(file);
    };

    const handleScan = () => {
        setScanning(true);
        // Run synchronously but give UI a tick to show state
        setTimeout(() => {
            const validEntries = entries.filter((e) => e.content.trim());
            const result = scanConfigs(validEntries);
            setResults(result);
            setScanning(false);
        }, 100);
    };

    const loadSample = () => {
        setEntries([{ source: "Sample Config", content: SAMPLE_CONFIG }]);
        setResults(null);
    };

    const hasContent = entries.some((e) => e.content.trim());

    return (
        <div style={{ minHeight: "100vh", paddingTop: "3.5rem" }}>
            <div style={{ maxWidth: "52rem", margin: "0 auto", padding: "5rem 1.5rem 4rem" }}>

                {/* ══════ Header ══════ */}
                <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: "3rem", height: "3rem", borderRadius: "0.75rem",
                        backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)",
                        marginBottom: "1.25rem",
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                            stroke="var(--color-cta-end)" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"
                        >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                            <polyline points="14 2 14 8 20 8" />
                            <path d="m10 13-2 2 2 2" /><path d="m14 17 2-2-2-2" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
                        Local Config Scanner
                    </h1>
                    <p style={{
                        fontSize: "0.85rem", fontWeight: 500,
                        color: "var(--color-text-secondary)", lineHeight: 1.6,
                        maxWidth: "32rem", margin: "0 auto",
                    }}>
                        Paste your MCP config file contents below to check for security issues.
                        Everything runs in your browser — nothing leaves your machine.
                    </p>
                </div>

                {/* ══════ Config file paths reference ══════ */}
                <div style={{
                    borderRadius: "0.5rem", border: "1px solid var(--color-border)",
                    backgroundColor: "var(--color-surface)", padding: "1.25rem",
                    marginBottom: "1.5rem",
                }}>
                    <p style={{
                        fontSize: "0.65rem", fontWeight: 800, color: "var(--color-text-muted)",
                        textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.75rem",
                    }}>
                        Where to find your MCP configs
                    </p>
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0.375rem",
                    }}>
                        {CONFIG_PATHS.map((cp) => (
                            <div key={cp.path} style={{
                                display: "flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.375rem 0.5rem", borderRadius: "0.375rem",
                                backgroundColor: "rgba(255,255,255,0.02)",
                            }}>
                                <span style={{
                                    fontSize: "0.65rem", fontWeight: 700, color: "var(--color-cta-end)",
                                    minWidth: "5rem",
                                }}>
                                    {cp.label}
                                </span>
                                <code style={{
                                    fontFamily: "var(--font-mono)", fontSize: "0.65rem", fontWeight: 500,
                                    color: "var(--color-text-muted)",
                                }}>
                                    {cp.path}
                                </code>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ══════ Config entries ══════ */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1rem" }}>
                    {entries.map((entry, idx) => (
                        <div key={idx} style={{
                            borderRadius: "0.625rem", border: "1px solid var(--color-border)",
                            backgroundColor: "var(--color-surface)", padding: "1.25rem",
                        }}>
                            {/* Entry header */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                marginBottom: "0.75rem",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <label style={{
                                        fontSize: "0.65rem", fontWeight: 800, color: "var(--color-text-muted)",
                                        textTransform: "uppercase", letterSpacing: "0.06em",
                                    }}>
                                        Config Source
                                    </label>
                                    <select
                                        value={entry.source}
                                        onChange={(e) => updateEntry(idx, "source", e.target.value)}
                                        style={{
                                            padding: "0.25rem 0.5rem", borderRadius: "0.375rem",
                                            border: "1px solid var(--color-border)",
                                            backgroundColor: "var(--color-surface)",
                                            fontSize: "0.75rem", fontWeight: 600,
                                            color: "var(--color-text-primary)",
                                            fontFamily: "var(--font-mono)",
                                        }}
                                    >
                                        {CONFIG_PATHS.map((cp) => (
                                            <option key={cp.label} value={cp.label}>{cp.label} — {cp.path}</option>
                                        ))}
                                        <option value="Custom">Custom</option>
                                        <option value="Sample Config">Sample Config</option>
                                    </select>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!fileInputRefs.current[idx]) return;
                                            fileInputRefs.current[idx].click();
                                        }}
                                        className="hover-ghost"
                                        style={{
                                            padding: "0.25rem 0.625rem", borderRadius: "0.375rem",
                                            border: "1px solid var(--color-border)",
                                            backgroundColor: "transparent",
                                            fontSize: "0.65rem", fontWeight: 700,
                                            color: "var(--color-text-secondary)", cursor: "pointer",
                                        }}
                                    >
                                        Upload .json
                                    </button>
                                    <input
                                        ref={(el) => (fileInputRefs.current[idx] = el)}
                                        type="file"
                                        accept=".json,application/json"
                                        onChange={(e) => handleFileUpload(idx, e)}
                                        style={{ display: "none" }}
                                    />
                                    {entries.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeEntry(idx)}
                                            className="hover-ghost"
                                            style={{
                                                padding: "0.25rem 0.5rem", borderRadius: "0.375rem",
                                                border: "1px solid var(--color-border)",
                                                backgroundColor: "transparent",
                                                fontSize: "0.65rem", fontWeight: 700,
                                                color: "var(--color-danger)", cursor: "pointer",
                                            }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Textarea */}
                            <textarea
                                value={entry.content}
                                onChange={(e) => updateEntry(idx, "content", e.target.value)}
                                placeholder={'Paste your MCP config JSON here…\n\n{\n  "mcpServers": {\n    "server-name": {\n      "command": "node",\n      "args": ["server.js"]\n    }\n  }\n}'}
                                spellCheck={false}
                                style={{
                                    width: "100%", minHeight: "10rem", padding: "0.75rem 1rem",
                                    borderRadius: "0.5rem", border: "1px solid var(--color-border)",
                                    backgroundColor: "rgba(0,0,0,0.2)",
                                    fontFamily: "var(--font-mono)", fontSize: "0.75rem",
                                    fontWeight: 500, color: "var(--color-text-primary)",
                                    lineHeight: 1.6, resize: "vertical", outline: "none",
                                    transition: "border-color 200ms ease",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) => (e.target.style.borderColor = "var(--color-cta-start)")}
                                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
                            />
                        </div>
                    ))}
                </div>

                {/* ══════ Action buttons ══════ */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "0.625rem",
                    marginBottom: "2rem",
                }}>
                    <button
                        type="button"
                        onClick={addEntry}
                        className="hover-ghost"
                        style={{
                            padding: "0.5rem 1rem", borderRadius: "0.5rem",
                            border: "1px solid var(--color-border)",
                            backgroundColor: "transparent",
                            fontSize: "0.75rem", fontWeight: 700,
                            color: "var(--color-text-secondary)", cursor: "pointer",
                        }}
                    >
                        + Add Another Config
                    </button>
                    <button
                        type="button"
                        onClick={loadSample}
                        className="hover-ghost"
                        style={{
                            padding: "0.5rem 1rem", borderRadius: "0.5rem",
                            border: "1px solid var(--color-border)",
                            backgroundColor: "transparent",
                            fontSize: "0.75rem", fontWeight: 700,
                            color: "var(--color-text-muted)", cursor: "pointer",
                        }}
                    >
                        Load Sample
                    </button>
                    <div style={{ flex: 1 }} />
                    <button
                        type="button"
                        onClick={handleScan}
                        disabled={scanning || !hasContent}
                        className="hover-glow"
                        style={{
                            padding: "0.75rem 2rem", borderRadius: "0.5rem", border: "none",
                            background: "linear-gradient(135deg, var(--color-cta-start), var(--color-cta-end))",
                            color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                            cursor: scanning || !hasContent ? "not-allowed" : "pointer",
                            opacity: scanning || !hasContent ? 0.5 : 1,
                            boxShadow: "0 4px 16px var(--color-cta-glow)",
                        }}
                    >
                        {scanning ? "Scanning…" : "🛡️ Scan Configs"}
                    </button>
                </div>

                {/* ══════ Results ══════ */}
                {results && (
                    <>
                        <div style={{
                            height: "1px", backgroundColor: "var(--color-border)",
                            marginBottom: "1.5rem",
                        }} />
                        <h2 style={{
                            fontSize: "0.7rem", fontWeight: 800, color: "var(--color-text-muted)",
                            textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "1rem",
                        }}>
                            Scan Results
                        </h2>
                        <LocalScanResults results={results} />
                    </>
                )}
            </div>
        </div>
    );
}

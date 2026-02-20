import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const STEP_LABELS = [
    { key: "pending", label: "Preparing scan…" },
    { key: "fetching", label: "Fetching repository files…" },
    { key: "networkExposure", label: "Running network exposure check…" },
    { key: "commandInjection", label: "Running injection detection…" },
    { key: "credentialLeaks", label: "Scanning for credential leaks…" },
    { key: "toolPoisoning", label: "Checking for tool poisoning…" },
    { key: "specCompliance", label: "Validating spec compliance…" },
    { key: "inputValidation", label: "Assessing input validation…" },
    { key: "scoring", label: "Calculating score…" },
    { key: "complete", label: "Scan complete" },
];

export default function ScanProgress({ scanId, onComplete }) {
    const [scanData, setScanData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!scanId) return;

        const unsub = onSnapshot(
            doc(db, "scans", scanId),
            (snap) => {
                if (snap.exists()) {
                    const data = snap.data();
                    setScanData(data);
                    if (data.status === "complete" && onComplete) {
                        onComplete(data);
                    }
                    if (data.status === "error") {
                        setError(data.errorMessage || "Scan failed");
                    }
                }
            },
            (err) => setError(err.message)
        );

        return unsub;
    }, [scanId, onComplete]);

    const currentStep = scanData?.currentStep || "pending";
    const currentIndex = STEP_LABELS.findIndex((s) => s.key === currentStep);

    if (error) {
        return (
            <div style={{
                borderRadius: "0.5rem", border: "1px solid rgba(255,60,60,0.2)",
                backgroundColor: "rgba(255,60,60,0.04)", padding: "1.5rem",
                textAlign: "center",
            }}>
                <p style={{
                    fontSize: "0.8rem", fontWeight: 600, color: "var(--color-danger)",
                }}>{error}</p>
            </div>
        );
    }

    return (
        <div style={{
            borderRadius: "0.75rem", border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)", padding: "1.5rem",
        }}>
            <h3 style={{
                fontSize: "0.8rem", fontWeight: 700,
                color: "var(--color-text-primary)", marginBottom: "1.25rem",
            }}>
                Scan Progress
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {STEP_LABELS.map((step, i) => {
                    const isDone = i < currentIndex;
                    const isCurrent = i === currentIndex;

                    return (
                        <div key={step.key} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            {/* Status indicator */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                width: "1.25rem", height: "1.25rem", flexShrink: 0,
                            }}>
                                {isDone && (
                                    <span style={{
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        width: "1.25rem", height: "1.25rem", borderRadius: "50%",
                                        backgroundColor: "rgba(0,150,100,0.12)",
                                        fontSize: "0.6rem", fontWeight: 800, color: "var(--color-safe)",
                                    }}>
                                        ✓
                                    </span>
                                )}
                                {isCurrent && (
                                    <span style={{ position: "relative", display: "flex", width: "0.5rem", height: "0.5rem" }}>
                                        <span style={{
                                            position: "absolute", inset: 0,
                                            borderRadius: "50%", backgroundColor: "var(--color-cta-end)",
                                            animation: "pulse-dot 1.5s ease-in-out infinite",
                                        }} />
                                        <span style={{
                                            position: "relative", width: "0.5rem", height: "0.5rem",
                                            borderRadius: "50%", backgroundColor: "var(--color-cta-end)",
                                        }} />
                                    </span>
                                )}
                                {!isDone && !isCurrent && (
                                    <span style={{
                                        width: "0.35rem", height: "0.35rem", borderRadius: "50%",
                                        backgroundColor: "rgba(255,255,255,0.1)",
                                    }} />
                                )}
                            </div>

                            {/* Label */}
                            <span style={{
                                fontSize: "0.8rem", fontWeight: isCurrent ? 600 : 500,
                                color: isDone
                                    ? "var(--color-text-muted)"
                                    : isCurrent
                                        ? "var(--color-text-primary)"
                                        : "rgba(255,255,255,0.15)",
                                transition: "color 300ms ease",
                            }}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar */}
            <div style={{
                marginTop: "1.25rem", height: "3px", borderRadius: "2px",
                backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden",
            }}>
                <div style={{
                    height: "100%", borderRadius: "2px",
                    background: "linear-gradient(90deg, var(--color-cta-start), var(--color-cta-end))",
                    transition: "width 700ms cubic-bezier(0.4, 0, 0.2, 1)",
                    width: `${((currentIndex + 1) / STEP_LABELS.length) * 100}%`,
                }} />
            </div>
        </div>
    );
}

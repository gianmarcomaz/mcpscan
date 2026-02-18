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
    { key: "complete", label: "Scan complete!" },
];

/**
 * Real-time scan progress display.
 * Listens to a Firestore scan document and shows step-by-step progress.
 * Props: scanId (string), onComplete (function called when scan finishes)
 */
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
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
                <span className="text-3xl">❌</span>
                <p className="mt-2 text-sm font-medium text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <h3 className="mb-5 text-sm font-semibold text-white">
                Scan Progress
            </h3>

            <div className="space-y-3">
                {STEP_LABELS.map((step, i) => {
                    const isDone = i < currentIndex;
                    const isCurrent = i === currentIndex;
                    const isPending = i > currentIndex;

                    return (
                        <div key={step.key} className="flex items-center gap-3">
                            {/* Status indicator */}
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                                {isDone && (
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-xs text-emerald-400">
                                        ✓
                                    </span>
                                )}
                                {isCurrent && (
                                    <span className="relative flex h-3 w-3">
                                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                                    </span>
                                )}
                                {isPending && (
                                    <span className="h-2 w-2 rounded-full bg-slate-700" />
                                )}
                            </div>

                            {/* Label */}
                            <span
                                className={`text-sm ${isDone
                                        ? "text-slate-500"
                                        : isCurrent
                                            ? "font-medium text-white"
                                            : "text-slate-600"
                                    }`}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Progress bar */}
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700"
                    style={{
                        width: `${((currentIndex + 1) / STEP_LABELS.length) * 100}%`,
                    }}
                />
            </div>
        </div>
    );
}

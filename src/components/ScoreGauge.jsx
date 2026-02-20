import { useEffect, useState } from "react";

/**
 * Animated circular SVG gauge displaying 0–100 score.
 * Uses safe/warn/danger colors from enterprise palette.
 */
export default function ScoreGauge({ score = 0, size = 160 }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    const tier =
        score >= 90
            ? { label: "Certified", color: "rgb(0,150,100)" }
            : score >= 70
                ? { label: "Reviewed", color: "rgb(230,170,30)" }
                : { label: "Failed", color: "rgb(255,60,60)" };

    useEffect(() => {
        const duration = 1200;
        const startTime = performance.now();
        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setAnimatedScore(Math.round(eased * score));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [score]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.625rem" }}>
            <div style={{ position: "relative", width: size, height: size }}>
                <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
                    {/* Track */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth}
                    />
                    {/* Score arc */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke={tier.color}
                        strokeWidth={strokeWidth} strokeLinecap="round"
                        strokeDasharray={circumference} strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
                    />
                </svg>
                {/* Center label */}
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                }}>
                    <span style={{
                        fontSize: "2.25rem", fontWeight: 800,
                        fontVariantNumeric: "tabular-nums",
                        color: tier.color,
                    }}>
                        {animatedScore}
                    </span>
                    <span style={{
                        fontSize: "0.65rem", color: "var(--color-text-muted)",
                    }}>/ 100</span>
                </div>
            </div>
            <span style={{
                borderRadius: "9999px", padding: "0.25rem 0.75rem",
                fontSize: "0.6rem", fontWeight: 700,
                textTransform: "uppercase", letterSpacing: "0.08em",
                color: tier.color,
                backgroundColor: tier.color.replace("rgb", "rgba").replace(")", ",0.1)"),
            }}>
                {tier.label}
            </span>
        </div>
    );
}

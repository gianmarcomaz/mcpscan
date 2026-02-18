import { useEffect, useState } from "react";

/**
 * Animated circular SVG gauge displaying 0–100 score.
 * Clean, minimal design — no filters or effects that cause clipping.
 */
export default function ScoreGauge({ score = 0, size = 160 }) {
    const [animatedScore, setAnimatedScore] = useState(0);
    const strokeWidth = 10;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    const tier =
        score >= 90
            ? { label: "Certified", color: "#22c55e" }
            : score >= 70
                ? { label: "Reviewed", color: "#eab308" }
                : { label: "Failed", color: "#ef4444" };

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
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {/* Track */}
                    <circle
                        cx={size / 2} cy={size / 2} r={radius}
                        fill="none" stroke="#1e293b" strokeWidth={strokeWidth}
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
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black tabular-nums" style={{ color: tier.color }}>
                        {animatedScore}
                    </span>
                    <span className="text-[11px] text-slate-500">/ 100</span>
                </div>
            </div>
            <span
                className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                style={{
                    color: tier.color,
                    backgroundColor: tier.color + "18",
                }}
            >
                {tier.label}
            </span>
        </div>
    );
}

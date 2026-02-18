import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../utils/auth";

const TIER_STYLES = {
    certified: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Certified" },
    reviewed: { color: "#eab308", bg: "rgba(234,179,8,0.1)", label: "Reviewed" },
    failed: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Failed" },
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [scans, setScans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchScans() {
            try {
                const q = query(
                    collection(db, "scans"),
                    where("userId", "==", user.uid),
                    orderBy("startedAt", "desc")
                );
                const snap = await getDocs(q);
                setScans(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            } catch (err) {
                console.error("Failed to fetch scans:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchScans();
    }, [user]);

    return (
        <div className="min-h-screen pt-16">
            <div className="px-6 py-12" style={{ maxWidth: "64rem", margin: "0 auto" }}>
                {/* Header */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Your scan history and certification results.
                        </p>
                    </div>
                    <Link
                        to="/scan"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 no-underline transition-all hover:shadow-emerald-500/30 hover:brightness-110"
                    >
                        + New Scan
                    </Link>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
                    </div>
                )}

                {/* Empty state */}
                {!loading && scans.length === 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/50 py-20 text-center">
                        <span className="text-4xl">📭</span>
                        <p className="mt-3 text-slate-400">No scans yet.</p>
                        <Link
                            to="/scan"
                            className="mt-4 inline-block text-sm font-medium text-emerald-400 no-underline hover:underline"
                        >
                            Run your first scan →
                        </Link>
                    </div>
                )}

                {/* Scan table */}
                {!loading && scans.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-slate-800">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/50">
                                    <th className="px-5 py-3 font-medium text-slate-400">Repository</th>
                                    <th className="px-5 py-3 font-medium text-slate-400">Score</th>
                                    <th className="px-5 py-3 font-medium text-slate-400">Tier</th>
                                    <th className="px-5 py-3 font-medium text-slate-400">Date</th>
                                    <th className="px-5 py-3 font-medium text-slate-400">Status</th>
                                    <th className="px-5 py-3" />
                                </tr>
                            </thead>
                            <tbody>
                                {scans.map((scan) => {
                                    const tier = TIER_STYLES[scan.tier] || TIER_STYLES.failed;
                                    const date = scan.startedAt?.toDate
                                        ? scan.startedAt.toDate().toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                        : "—";

                                    return (
                                        <tr
                                            key={scan.id}
                                            className="border-b border-slate-800/50 transition-colors hover:bg-slate-900/50"
                                        >
                                            <td className="px-5 py-4">
                                                <span className="font-medium text-white">
                                                    {scan.repoOwner}/{scan.repoName}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="font-mono font-bold text-white">
                                                    {scan.overallScore ?? "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider"
                                                    style={{ color: tier.color, backgroundColor: tier.bg }}
                                                >
                                                    {tier.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">{date}</td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`text-xs font-medium ${scan.status === "complete"
                                                        ? "text-emerald-400"
                                                        : scan.status === "error"
                                                            ? "text-red-400"
                                                            : "text-amber-400"
                                                        }`}
                                                >
                                                    {scan.status || "—"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {scan.status === "complete" && (
                                                    <Link
                                                        to={`/report/${scan.id}`}
                                                        className="text-sm font-medium text-emerald-400 no-underline hover:underline"
                                                    >
                                                        View Report →
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

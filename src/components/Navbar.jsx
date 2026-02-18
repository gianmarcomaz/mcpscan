import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../utils/auth";

const NAV_LINKS = [
    { to: "/", label: "Home" },
    { to: "/scan", label: "Scan", auth: true },
    { to: "/dashboard", label: "Dashboard", auth: true },
];

export default function Navbar() {
    const { user, loading, signIn, signOut } = useAuth();
    const location = useLocation();

    return (
        <nav style={{
            position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
            borderBottom: "1px solid #1e293b",
            backgroundColor: "rgba(2,6,23,0.85)", backdropFilter: "blur(16px)",
        }}>
            <div style={{ maxWidth: "80rem", margin: "0 auto", height: "4rem", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 1.5rem" }}>

                {/* Logo */}
                <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.625rem", textDecoration: "none" }}>
                    <span style={{ fontSize: "1.5rem" }}>🛡️</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em", color: "#fff" }}>
                        MCP <span style={{ color: "#4ade80" }}>Certify</span>
                    </span>
                </Link>

                {/* Nav Links */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    {NAV_LINKS.map((link) => {
                        if (link.auth && !user) return null;
                        const active = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                style={{
                                    padding: "0.5rem 1rem", borderRadius: "0.5rem",
                                    fontSize: "0.8rem", fontWeight: 500, textDecoration: "none",
                                    color: active ? "#fff" : "#94a3b8",
                                    backgroundColor: active ? "#1e293b" : "transparent",
                                    transition: "color 0.15s, background-color 0.15s",
                                }}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Auth */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {loading ? (
                        <div style={{ width: "6rem", height: "2rem", borderRadius: "0.5rem", backgroundColor: "#1e293b" }} />
                    ) : user ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <img
                                src={user.photoURL}
                                alt="avatar"
                                style={{ width: "2rem", height: "2rem", borderRadius: "50%", border: "2px solid #334155" }}
                            />
                            <button
                                onClick={signOut}
                                style={{
                                    padding: "0.45rem 1rem", borderRadius: "0.5rem",
                                    border: "1px solid #334155", backgroundColor: "transparent",
                                    fontSize: "0.8rem", fontWeight: 500, color: "#cbd5e1",
                                    cursor: "pointer", transition: "border-color 0.15s, color 0.15s",
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={signIn}
                            style={{
                                display: "flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none",
                                backgroundColor: "#fff", fontSize: "0.8rem", fontWeight: 600,
                                color: "#0f172a", cursor: "pointer", transition: "opacity 0.15s",
                            }}
                        >
                            <svg style={{ width: "1rem", height: "1rem" }} viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                            Sign in with GitHub
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}

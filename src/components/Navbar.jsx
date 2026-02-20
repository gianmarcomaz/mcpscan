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
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "rgba(15,15,30,0.8)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        }}>
            <div style={{
                maxWidth: "64rem", margin: "0 auto", height: "3.5rem",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 1.5rem",
            }}>

                {/* Logo */}
                <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-cta-end)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span style={{
                        fontSize: "0.95rem", fontWeight: 800, letterSpacing: "-0.02em",
                    }}>
                        <span style={{ color: "var(--color-cta-end)" }}>MCP</span>
                        {" "}
                        <span style={{ color: "var(--color-text-primary)" }}>Certify</span>
                    </span>
                </Link>

                {/* Nav Links */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.125rem" }}>
                    {NAV_LINKS.map((link) => {
                        if (link.auth && !user) return null;
                        const active = location.pathname === link.to;
                        return (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={active ? "" : "hover-ghost"}
                                style={{
                                    padding: "0.4rem 0.875rem", borderRadius: "0.375rem",
                                    fontSize: "0.8rem", fontWeight: 600, textDecoration: "none",
                                    color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                                    backgroundColor: active ? "var(--color-surface)" : "transparent",
                                    border: active ? "1px solid var(--color-border)" : "1px solid transparent",
                                }}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Auth */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                    {loading ? (
                        <div style={{
                            width: "5.5rem", height: "2rem", borderRadius: "0.375rem",
                            background: "var(--color-surface)",
                        }} className="shimmer" />
                    ) : user ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                            <img
                                src={user.photoURL}
                                alt="avatar"
                                style={{
                                    width: "1.75rem", height: "1.75rem", borderRadius: "50%",
                                    border: "1px solid var(--color-border)",
                                }}
                            />
                            <button
                                onClick={signOut}
                                className="hover-ghost"
                                style={{
                                    padding: "0.375rem 0.875rem", borderRadius: "0.375rem",
                                    border: "1px solid var(--color-border)",
                                    backgroundColor: "transparent",
                                    fontSize: "0.75rem", fontWeight: 600,
                                    color: "var(--color-text-secondary)",
                                    cursor: "pointer",
                                }}
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={signIn}
                            className="hover-glow"
                            style={{
                                display: "flex", alignItems: "center", gap: "0.5rem",
                                padding: "0.4rem 1rem", borderRadius: "0.375rem", border: "none",
                                background: "linear-gradient(135deg, var(--color-cta-start), var(--color-cta-end))",
                                fontSize: "0.8rem", fontWeight: 700,
                                color: "#fff", cursor: "pointer",
                                boxShadow: "0 2px 12px var(--color-cta-glow)",
                            }}
                        >
                            <svg style={{ width: "0.9rem", height: "0.9rem" }} viewBox="0 0 24 24" fill="currentColor">
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

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./utils/auth";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import ScanPage from "./pages/ScanPage";
import ReportPage from "./pages/ReportPage";
import DashboardPage from "./pages/DashboardPage";
import DemoHeroPage from "./pages/DemoHeroPage";

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-emerald-400" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return children;
}

function AppLayout() {
    const location = useLocation();
    const hideNavbar = location.pathname === "/demo";

    return (
        <>
            {!hideNavbar && <Navbar />}
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route
                    path="/scan"
                    element={
                        <ProtectedRoute>
                            <ScanPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/report/:scanId" element={<ReportPage />} />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="/demo" element={<DemoHeroPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AppLayout />
        </BrowserRouter>
    );
}

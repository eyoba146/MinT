import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Award,
  Building2,
  Network,
  Briefcase,
} from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setMobileOpen(false);
  };

  const dashboardLink = () => {
    if (!user) return "/";
    if (user.role === "founder") return "/founder";
    if (user.role === "investor") return "/investor";
    if (user.role === "admin") return "/admin/analytics";
    if (user.role === "reviewer") return "/reviewer";
    if (user.role === "moderator") return "/moderator";
    if (user.role === "citizen") return "/citizen";
    if (user.role === "ecosystem_builder") return "/builder";
    return "/";
  };

  const navLink = (to, label, icon = null) => {
    const active =
      location.pathname === to || (to !== "/" && location.pathname.startsWith(to + "/"));
    const Icon = icon;
    return (
      <Link
        to={to}
        onClick={() => setMobileOpen(false)}
        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
          active
            ? "bg-teal-50 text-teal-900 font-bold shadow-sm ring-1 ring-teal-200/80"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/90"
        }`}
      >
        {Icon && <Icon className="w-4 h-4 opacity-70" />}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-16 h-12 sm:w-20 sm:h-14 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/logo.png"
                alt="MinT Digital Hub logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight block">
                MinT Digital Hub
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Ministry of Innovation & Technology
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/70">
            {navLink("/", "Home")}
            {navLink("/directory", "Startups", Building2)}
            {navLink("/builders", "Ecosystem Hubs", Network)}
            {isAuthenticated && navLink("/opportunities", "Opportunities", Briefcase)}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={dashboardLink()}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center text-sm font-bold">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-900 truncate max-w-[120px]">
                      {user?.fullName || "User"}
                    </div>
                    <div className="text-xs text-teal-800 capitalize font-semibold">
                      {user?.role?.replace("_", " ")} workspace
                    </div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-teal-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 rounded-xl shadow-md shadow-teal-800/30 hover:scale-[1.02] transition-all flex items-center gap-1.5"
                >
                  <Award className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2 shadow-xl">
          {navLink("/", "Home")}
          {navLink("/directory", "Startups", Building2)}
          {navLink("/builders", "Ecosystem Hubs", Network)}
          {isAuthenticated && navLink("/opportunities", "Opportunities", Briefcase)}

          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                to={dashboardLink()}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-teal-900 bg-teal-50 rounded-xl"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Go to workspace</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-rose-600 w-full"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-bold text-center border border-slate-200 rounded-xl text-slate-700"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="px-4 py-2.5 text-sm font-bold text-center bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-xl shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

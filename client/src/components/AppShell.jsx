import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  Briefcase,
  LogOut,
  User,
  Inbox,
  Award,
  Menu,
  X,
  ClipboardList,
  Megaphone,
  Network,
  BarChart3,
  ExternalLink,
  Shield,
} from "lucide-react";
import { useState } from "react";

const NAV = {
  admin: [
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3, end: true },
    // end: true — only active on exact /admin (not /admin/builders etc.)
    { to: "/admin", label: "Designation cases", icon: Building2, end: true },
    { to: "/admin/builders", label: "Ecosystem builders", icon: Network },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/opportunities", label: "Opportunities", icon: Briefcase },
  ],
  reviewer: [
    { to: "/reviewer", label: "Startup reviews", icon: ClipboardList, end: true },
    { to: "/reviewer/builders", label: "Builder reviews", icon: Building2 },
    { to: "/reviewer/opportunities", label: "Opportunities", icon: Megaphone },
  ],
  moderator: [
    { to: "/moderator", label: "Opportunity posts", icon: Megaphone, end: true },
    { to: "/moderator/startups", label: "Startups", icon: Building2 },
    { to: "/moderator/builders", label: "Builders", icon: Network },
    { to: "/moderator/browse", label: "Public feed", icon: Briefcase },
  ],
  founder: [
    { to: "/founder", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/founder/create", label: "Application", icon: FileText },
    { to: "/founder/data-room", label: "Data room", icon: Inbox },
    { to: "/founder/certificate", label: "Certificate", icon: Award },
    { to: "/founder/opportunities", label: "Opportunities", icon: Megaphone },
  ],
  investor: [
    { to: "/investor", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/investor/directory", label: "Designated startups", icon: Building2 },
    { to: "/investor/builders", label: "Ecosystem builders", icon: Network },
    { to: "/investor/opportunities", label: "Post opportunity", icon: Briefcase },
    { to: "/investor/browse-opportunities", label: "All opportunities", icon: Shield },
  ],
  citizen: [
    { to: "/citizen", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/citizen/directory", label: "Startups", icon: Building2 },
    { to: "/citizen/builders", label: "Builders", icon: Network },
    { to: "/citizen/opportunities", label: "Opportunities", icon: Briefcase },
  ],
  ecosystem_builder: [
    { to: "/builder", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/builder/apply", label: "Application", icon: FileText },
    { to: "/builder/opportunities", label: "Opportunities", icon: Megaphone },
  ],
};

export default function AppShell({ title, subtitle, children, actions }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const currentRole = user?.role || "founder";
  const items = NAV[currentRole] || NAV.founder;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `group flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-colors ${
      isActive
        ? "bg-teal-700 text-white shadow-sm"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="px-5 py-5 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <div className="w-16 h-14 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="MinT Digital Portal logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-900 leading-tight">
              MinT Digital Portal
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Ministry of Innovation and Technology
            </div>
          </div>
        </Link>
      </div>

      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/80">
        <div className="text-xs font-medium text-slate-500">Signed in as</div>
        <div className="text-sm font-semibold text-slate-900 capitalize mt-0.5">
          {(currentRole || "").replace(/_/g, " ")}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end === true}
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <item.icon className="w-5 h-5 shrink-0" strokeWidth={2} />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-4 mt-3 border-t border-slate-100 space-y-1">
          <NavLink to="/profile" className={linkClass} onClick={() => setOpen(false)}>
            <User className="w-5 h-5 shrink-0" strokeWidth={2} />
            <span>Profile</span>
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-3 px-2 py-2 mb-3 rounded-xl bg-white border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-teal-700 text-white flex items-center justify-center font-semibold text-sm shrink-0">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-900 truncate">
              {user?.fullName || "User"}
            </div>
            <div className="text-xs text-slate-500 truncate">{user?.email || ""}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 z-30">
        {SidebarContent}
      </aside>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative flex flex-col w-full max-w-xs bg-white shadow-2xl z-10">
            <button
              type="button"
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-500 hover:bg-slate-100 z-20"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            {SidebarContent}
          </div>
        </div>
      )}

      <div className="flex-1 lg:pl-72 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
          <div className="px-4 sm:px-6 lg:px-8 h-[4.25rem] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                className="lg:hidden p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700"
                onClick={() => setOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate tracking-tight">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-slate-500 truncate hidden sm:block mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                to="/"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-700"
              >
                Public site
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              {actions && <div className="flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

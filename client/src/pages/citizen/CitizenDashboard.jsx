import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AppShell from "../../components/AppShell";
import {
  Building2,
  ArrowRight,
  Megaphone,
  Network,
  ShieldCheck,
  Award,
  Sparkles,
  BookOpen,
  Zap,
} from "lucide-react";

export default function CitizenDashboard() {
  const { user } = useAuth();

  const features = [
    {
      title: "Designated Startups",
      description: "Explore tech companies officially designated by MinT across Ethiopia with statutory benefits.",
      icon: Building2,
      to: "/citizen/directory",
      gradient: "from-teal-500 to-emerald-600",
      badge: "National Registry",
      color: "bg-teal-50 text-teal-700 border-teal-200",
    },
    {
      title: "Ecosystem Builders & Hubs",
      description: "Discover MinT-accredited incubators, accelerators, tech zones, and university research labs.",
      icon: Network,
      to: "/citizen/builders",
      gradient: "from-purple-500 to-indigo-600",
      badge: "Accredited Hubs",
      color: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      title: "Opportunities & Grants",
      description: "Apply for public tech jobs, international scholarships, youth hackathons, and innovation calls.",
      icon: Megaphone,
      to: "/citizen/opportunities",
      gradient: "from-amber-500 to-orange-600",
      badge: "Live Calls",
      color: "bg-amber-50 text-amber-700 border-amber-200",
    },
  ];

  return (
    <AppShell
      title="Public Innovation Portal"
      subtitle={`Welcome, ${user?.fullName?.split(" ")[0] || "Citizen"} · Ethiopian Sovereign Innovation Ecosystem`}
    >
      <div className="space-y-8">
        {/* Sovereign Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-teal-900/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Digital Innovation Hub for MinT</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Explore Ethiopia&apos;s Sovereign Tech Landscape
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Direct public transparency into designated innovative enterprises, verified accelerators, and national grants enacted under Proclamation No. 1396/2025.
            </p>
          </div>
        </div>

        {/* Dynamic Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => (
            <Link
              key={item.title}
              to={item.to}
              className="group bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:border-teal-400/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Accent Top Gradient */}
              <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${item.gradient}`} />

              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border group-hover:scale-105 transition-transform ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    {item.badge}
                  </span>
                </div>

                <h2 className="text-base font-extrabold text-slate-900 group-hover:text-teal-800 transition-colors mb-2">
                  {item.title}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-800 group-hover:text-teal-900">
                <span>Explore Directory</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

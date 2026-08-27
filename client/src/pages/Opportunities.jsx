import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../utils/api";
import AppShell from "../components/AppShell";
import {
  Loader2,
  Megaphone,
  ExternalLink,
  Calendar,
  MapPin,
  Search,
  Sparkles,
  Award,
  Briefcase,
  GraduationCap,
  Trophy,
  Bell,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle,
} from "lucide-react";

const TYPE_CONFIG = {
  all: {
    label: "All Opportunities",
    color: "bg-slate-900 text-white border-slate-900",
    icon: Megaphone,
  },
  scholarship: {
    label: "Scholarships",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    activeColor: "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25",
    gradient: "from-purple-500 to-indigo-600",
    icon: GraduationCap,
  },
  internship: {
    label: "Internships",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    activeColor: "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/25",
    gradient: "from-emerald-500 to-teal-600",
    icon: Briefcase,
  },
  job: {
    label: "Tech Jobs",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
    activeColor: "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/25",
    gradient: "from-blue-500 to-cyan-600",
    icon: Briefcase,
  },
  training: {
    label: "Training & Bootcamps",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
    activeColor: "bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/25",
    gradient: "from-amber-500 to-orange-600",
    icon: Sparkles,
  },
  competition: {
    label: "Hackathons & Grants",
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200",
    activeColor: "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/25",
    gradient: "from-rose-500 to-pink-600",
    icon: Trophy,
  },
  announcement: {
    label: "MinT Announcements",
    badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
    activeColor: "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/25",
    gradient: "from-teal-600 to-teal-800",
    icon: Bell,
  },
  other: {
    label: "Other Programs",
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200",
    activeColor: "bg-slate-700 text-white border-slate-700",
    gradient: "from-slate-600 to-slate-800",
    icon: Megaphone,
  },
};

export default function Opportunities({ embedded = false }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const fetchData = async (selectedType = type) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (selectedType && selectedType !== "all") {
        params.set("type", selectedType);
      }
      const res = await apiRequest(`/opportunities?${params.toString()}`);
      setItems(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load opportunities");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) fetchData(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const filteredItems = items.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      item.title?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.location?.toLowerCase().includes(q) ||
      item.organization?.toLowerCase().includes(q)
    );
  });

  const body = (
    <div className="space-y-8">
      {/* Sovereign Hero Header Banner */}
      {!embedded && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 p-8 text-white shadow-xl border border-teal-900/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
              <Megaphone className="w-3.5 h-3.5" />
              <span>National Innovation & Capacity Exchange</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Sovereign Tech Opportunities & Grants
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Official federal calls, international tech scholarships, accelerator cohorts, venture competitions, and MinT statutory announcements.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search opportunities by title, field, host organization, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Vibrant Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setType("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
              type === "all"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
          >
            All Categories ({items.length})
          </button>

          {Object.entries(TYPE_CONFIG)
            .filter(([key]) => key !== "all")
            .map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = type === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all shrink-0 ${
                    isSelected
                      ? config.activeColor
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{config.label}</span>
                </button>
              );
            })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* Grid Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs text-slate-500 font-medium">Fetching verified opportunities...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Megaphone className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No opportunities found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no active postings in this category. Check back soon for upcoming innovation challenges, scholarships, and hiring calls.
          </p>
          {type !== "all" && (
            <button
              onClick={() => setType("all")}
              className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-teal-700 transition-colors mt-2"
            >
              Show All Categories
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredItems.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
            const Icon = config.icon;
            const gradient = config.gradient || "from-teal-600 to-teal-800";

            return (
              <article
                key={item._id}
                className="group bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:border-teal-400/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Vibrant Top Accent Stripe */}
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${gradient}`} />

                <div>
                  {/* Category Pill and Date Meta */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border ${config.badgeColor}`}
                    >
                      {Icon && <Icon className="w-3.5 h-3.5" />}
                      <span>{config.label}</span>
                    </span>

                    <span className="text-[11px] font-semibold text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Active"}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-base font-extrabold text-slate-900 group-hover:text-teal-800 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h2>

                  {/* Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 mt-2.5 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Meta Chips (Deadline, Location) */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
                    {item.deadline && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Deadline: {new Date(item.deadline).toLocaleDateString()}</span>
                      </span>
                    )}
                    {item.location && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Verified Call</span>
                  </span>

                  {item.link ? (
                    <a
                      href={item.link.startsWith("http") ? item.link : `https://${item.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs hover:scale-[1.02] transition-all"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs font-bold text-teal-800">
                      Open to Public
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <AppShell
        title="Opportunities & Public Calls"
        subtitle="Scholarships, tech jobs, accelerator cohorts and MinT statutory announcements"
      >
        {body}
      </AppShell>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {body}
    </div>
  );
}

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
  Briefcase,
  GraduationCap,
  Trophy,
  Bell,
  Clock,
  CheckCircle,
  Landmark,
  DollarSign,
  Filter,
  Sparkles,
} from "lucide-react";

const TYPE_CONFIG = {
  all: {
    label: "All Opportunities",
    icon: Megaphone,
  },
  scholarship: {
    label: "Scholarships",
    icon: GraduationCap,
  },
  internship: {
    label: "Internships",
    icon: Briefcase,
  },
  job: {
    label: "Tech Jobs",
    icon: Briefcase,
  },
  training: {
    label: "Training & Bootcamps",
    icon: Sparkles,
  },
  competition: {
    label: "Hackathons & Grants",
    icon: Trophy,
  },
  announcement: {
    label: "MinT Announcements",
    icon: Bell,
  },
  grant: {
    label: "Grants",
    icon: DollarSign,
  },
  credit_guarantee: {
    label: "Credit Guarantee",
    icon: Landmark,
  },
  other: {
    label: "Other Programs",
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
      item.organization?.toLowerCase().includes(q) ||
      item.programDetails?.toLowerCase().includes(q)
    );
  });

  const body = (
    <div className="space-y-6">
      {/* Page Header */}
      {!embedded && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Opportunities & Public Calls
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Official federal programs, scholarships, grants, and
                announcements for the Ethiopian innovation ecosystem.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, organization, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter:
          </span>
          {Object.entries(TYPE_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            const isSelected = type === key;
            return (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all shrink-0 ${
                  isSelected
                    ? "bg-teal-700 text-white border-teal-700"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Opportunity Cards Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-sm text-slate-500">
            Loading opportunities...
          </span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">
            No opportunities found
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            There are no active postings matching your criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredItems.map((item) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.other;
            const Icon = config.icon;

            return (
              <article
                key={item._id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col hover:border-teal-400 hover:shadow-md transition-all"
              >
                {/* Top Row: Type Icon and Date */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
                    <Icon className="w-3.5 h-3.5" />
                    <span className="capitalize">{config.label}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString()
                      : "Active"}
                  </span>
                </div>

                {/* Title */}
                <h2 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {item.title}
                </h2>

                {/* Description */}
                <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                {/* Extra program details / funding */}
                {item.programDetails && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {item.programDetails}
                  </p>
                )}
                {item.fundingAmount != null && (
                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-teal-800">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {Number(item.fundingAmount).toLocaleString()}{" "}
                      {item.currency}
                    </span>
                  </div>
                )}

                {/* Meta Info */}
                <div className="mt-auto pt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  {item.deadline && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(item.deadline).toLocaleDateString()}
                    </span>
                  )}
                  {item.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.location}
                    </span>
                  )}
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Verified
                  </span>
                  {item.link ? (
                    <a
                      href={
                        item.link.startsWith("http")
                          ? item.link
                          : `https://${item.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
                    >
                      <span>Apply</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
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
      <AppShell title="Opportunities" subtitle="Public calls and programs">
        {body}
      </AppShell>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">{body}</div>
  );
}

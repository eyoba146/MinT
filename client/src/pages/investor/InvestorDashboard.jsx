import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StartupCard from "../../components/StartupCard";
import {
  Search,
  Send,
  CheckCircle,
  Clock,
  Loader2,
  Inbox,
  Briefcase,
  Building2,
  Sparkles,
  ShieldCheck,
  Award,
  ArrowRight,
  TrendingUp,
  Lock,
} from "lucide-react";

export default function InvestorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsRes, startupsRes] = await Promise.all([
          apiRequest("/access-requests/my"),
          apiRequest("/startups"),
        ]);
        setRequests(requestsRes.data || []);
        setRecommended((startupsRes.data || []).slice(0, 6));
      } catch (err) {
        console.error(err);
        toast(err.message || "Failed to load investor hub", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  if (loading) {
    return (
      <AppShell title="Investor Deal Pipeline">
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-xs font-semibold text-slate-500">Loading investor deal pipeline…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Investor Deal Pipeline"
      subtitle={`Welcome, ${user?.fullName || "Accredited Investor"} · Sovereign Deal Rooms & Portfolios`}
      actions={
        <Link
          to="/investor/directory"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all"
        >
          <Search size={14} />
          <span>Browse Registry</span>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Sovereign Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accredited Sovereign Deal Flow</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Ethiopian Venture Pipeline
              </h1>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Connect directly with officially designated startups, request secure data room access for financial audits, and deploy capital under statutory protections.
              </p>
            </div>

            <Link
              to="/investor/directory"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-900/40 shrink-0 transition-transform hover:scale-105"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore Startups</span>
            </Link>
          </div>
        </div>

        {/* Colorful Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 via-white to-blue-50 rounded-3xl border border-blue-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Total Sent</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{requests.length}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Data Room Requests</div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50 rounded-3xl border border-emerald-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Unlocked</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{approvedCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Approved Access Rooms</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50 rounded-3xl border border-amber-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Awaiting</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{pendingCount}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Pending Founder Approvals</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-white to-purple-50 rounded-3xl border border-purple-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">Criteria</span>
            </div>
            <div className="text-2xl font-black text-slate-900">{user?.focus?.length || 0}</div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">Target Focus Sectors</div>
          </div>
        </div>

        {/* Requests & Recommended Startups */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">My Data Room Requests</h2>
                <p className="text-xs text-slate-500">Real-time status of requested startup confidential data rooms</p>
              </div>
              <Link
                to="/investor/directory"
                className="text-xs font-bold text-teal-800 hover:underline"
              >
                Browse Startups →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {requests.length === 0 ? (
                <div className="py-12 text-center">
                  <Inbox className="mx-auto text-slate-300 mb-3" size={32} />
                  <p className="text-sm font-bold text-slate-700">No active access requests</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Visit the designated startup directory and click &ldquo;Request Data Room Access&rdquo; on any venture profile.
                  </p>
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req._id} className="py-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {req.startup?.companyName || req.startup?.legalName || "Ethiopian Venture"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>Requested {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "—"}</span>
                        {req.startup?._id && (
                          <Link
                            to={`/investor/directory/${req.startup._id}`}
                            className="text-teal-800 font-bold hover:underline"
                          >
                            {req.status === "approved" ? "Open Data Room →" : "View Startup"}
                          </Link>
                        )}
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full capitalize shrink-0 ${
                        req.status === "approved"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : req.status === "pending"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Profile & Navigation Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Investor Profile
              </h3>
              <div className="text-xs space-y-2 text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p>
                  <span className="text-slate-400 font-bold">Organization:</span>{" "}
                  <strong>{user?.organization || "Not Specified"}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-bold">Ticket Range:</span>{" "}
                  <strong>{user?.investmentRange || "Not Specified"}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-bold">Focus:</span>{" "}
                  <strong>{user?.focus?.length ? user.focus.join(", ") : "All Sectors"}</strong>
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs font-bold">
                <Link
                  to="/investor/opportunities"
                  className="flex items-center justify-between p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-colors"
                >
                  <span>Post Call / Investment Mandate</span>
                  <Briefcase className="w-4 h-4 text-teal-600" />
                </Link>
                <Link
                  to="/investor/browse-opportunities"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors"
                >
                  <span>Browse National Calls</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Designated Startups Section */}
        {recommended.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Featured Designated Startups</h2>
                <p className="text-xs text-slate-500">Statutorily audited entities eligible for investment incentives</p>
              </div>
              <Link
                to="/investor/directory"
                className="text-xs font-bold text-teal-800 hover:underline"
              >
                View Full Registry ({recommended.length}+) →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommended.map((s) => (
                <StartupCard
                  key={s._id || s.id}
                  startup={s}
                  to={`/investor/directory/${s._id || s.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StartupCard from "../../components/StartupCard";
import StatusBadge from "../../components/StatusBadge";
import {
  Search,
  Send,
  CheckCircle,
  Clock,
  Loader2,
  Inbox,
  Briefcase,
  Building2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Heart,
  X,
  ChevronRight,
  FileText,
  MessageSquare,
  Calendar,
  Scale,
  Handshake,
  Landmark,
  Ban,
} from "lucide-react";

// Pipeline stage definitions (aligned with investorConnectionSchema enum)
const PIPELINE_STAGES = [
  {
    key: "interest_expressed",
    label: "Interest",
    icon: Heart,
    color: "text-slate-600",
  },
  {
    key: "data_room_accessed",
    label: "Data Room",
    icon: FileText,
    color: "text-blue-600",
  },
  {
    key: "meeting_scheduled",
    label: "Meeting",
    icon: Calendar,
    color: "text-purple-600",
  },
  {
    key: "due_diligence",
    label: "Due Diligence",
    icon: Scale,
    color: "text-amber-600",
  },
  {
    key: "term_sheet",
    label: "Term Sheet",
    icon: MessageSquare,
    color: "text-indigo-600",
  },
  {
    key: "investment_executed",
    label: "Invested",
    icon: Handshake,
    color: "text-teal-600",
  },
  {
    key: "grant_disbursed",
    label: "Grant",
    icon: Landmark,
    color: "text-emerald-600",
  },
  {
    key: "guarantee_issued",
    label: "Guarantee",
    icon: ShieldCheck,
    color: "text-cyan-600",
  },
  { key: "closed", label: "Closed", icon: Ban, color: "text-slate-400" },
];

// Map AccessRequest status to pipeline stage for v1
function mapRequestToStage(request) {
  if (request.status === "denied") return "closed";
  if (request.status === "approved") return "data_room_accessed";
  return "interest_expressed";
}

export default function InvestorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [connections, setConnections] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expressModal, setExpressModal] = useState(null);
  const [expressLoading, setExpressLoading] = useState(false);
  const [expressMessage, setExpressMessage] = useState("");
  const [expressTicketSize, setExpressTicketSize] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsRes, startupsRes] = await Promise.all([
          apiRequest("/access-requests/my"),
          apiRequest("/startups"),
        ]);
        setRequests(requestsRes.data || []);
        setRecommended((startupsRes.data || []).slice(0, 6));

        // TODO: When investorConnections backend is ready, switch to:
        // const connRes = await apiRequest("/investor/connections");
        // setConnections(connRes.data || []);
        // For now, derive pipeline from access requests
        const derived = (requestsRes.data || []).map((r) => ({
          _id: r._id,
          startup: r.startup,
          stage: mapRequestToStage(r),
          status: r.status,
          createdAt: r.createdAt,
          ticketSize: r.ticketSize,
          // Placeholder fields for when investorConnections is live
          investmentType: "none_yet",
          amount: null,
          lastActivityAt: r.createdAt,
        }));
        setConnections(derived);
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

  const handleExpressInterest = async () => {
    if (!expressModal) return;
    const startupId = expressModal._id || expressModal.id;
    if (!startupId) {
      toast("Invalid startup", "error");
      return;
    }
    setExpressLoading(true);
    try {
      // v1: Reuse the existing access-request endpoint as the interest expression mechanism
      // TODO: When /startups/:id/express-interest is live, switch to that
      await apiRequest("/access-requests", {
        method: "POST",
        body: {
          startupId,
          message:
            expressMessage.trim() ||
            "Interested in exploring investment opportunity",
          investmentRange: expressTicketSize.trim() || user?.investmentRange,
        },
      });
      toast("Interest expressed. Founder will be notified.", "success");
      setExpressModal(null);
      setExpressMessage("");
      setExpressTicketSize("");
      // Refresh data
      const requestsRes = await apiRequest("/access-requests/my");
      setRequests(requestsRes.data || []);
      const derived = (requestsRes.data || []).map((r) => ({
        _id: r._id,
        startup: r.startup,
        stage: mapRequestToStage(r),
        status: r.status,
        createdAt: r.createdAt,
        ticketSize: r.ticketSize,
        investmentType: "none_yet",
        amount: null,
        lastActivityAt: r.createdAt,
      }));
      setConnections(derived);
    } catch (err) {
      toast(err.message || "Failed to express interest", "error");
    } finally {
      setExpressLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;
  const approvedCount = requests.filter((r) => r.status === "approved").length;

  // Group connections by stage for the pipeline view
  const stageGroups = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    items: connections.filter((c) => c.stage === stage.key),
  })).filter((g) => g.items.length > 0);

  if (loading) {
    return (
      <AppShell title="Investor Deal Pipeline">
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-xs font-semibold text-slate-500">
            Loading investor deal pipeline…
          </p>
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
                Connect directly with officially designated startups, request
                secure data room access for financial audits, and deploy capital
                under statutory protections.
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Total Sent
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {requests.length}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Data Room Requests
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50 rounded-3xl border border-emerald-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Unlocked
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {approvedCount}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Approved Access Rooms
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50 rounded-3xl border border-amber-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Awaiting
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {pendingCount}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Pending Founder Approvals
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-white to-purple-50 rounded-3xl border border-purple-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Criteria
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {user?.focus?.length || 0}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Target Focus Sectors
            </div>
          </div>
        </div>

        {/* ── INVESTMENT PIPELINE ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                My Investment Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Structured deal flow from interest expression to capital
                deployment
              </p>
            </div>
            <Link
              to="/investor/directory"
              className="text-xs font-bold text-teal-800 hover:underline"
            >
              Browse Startups →
            </Link>
          </div>

          {connections.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-sm font-bold text-slate-700">
                No active pipeline engagements
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Browse the designated startup registry and express interest to
                begin your deal flow.
              </p>
              <Link
                to="/investor/directory"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700"
              >
                <Search className="w-3.5 h-3.5" /> Explore Registry
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {stageGroups.map((group) => {
                const StageIcon = group.icon;
                return (
                  <div key={group.key}>
                    <div className="flex items-center gap-2 mb-3">
                      <StageIcon className={`w-4 h-4 ${group.color}`} />
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {group.label}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {group.items.length}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.items.map((conn) => (
                        <div
                          key={conn._id}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link
                                to={`/investor/directory/${conn.startup?._id || conn.startup?.id}`}
                                className="text-sm font-bold text-slate-900 hover:text-teal-800 truncate block"
                              >
                                {conn.startup?.companyName || "Startup"}
                              </Link>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {conn.startup?.sector || "—"} ·{" "}
                                {conn.createdAt
                                  ? new Date(
                                      conn.createdAt,
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            </div>
                            <StatusBadge
                              status={
                                conn.status === "approved"
                                  ? "designated"
                                  : conn.status === "pending"
                                    ? "submitted"
                                    : "rejected"
                              }
                              size="sm"
                            />
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-[11px]">
                            {conn.ticketSize && (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                {conn.ticketSize}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-semibold border border-teal-100">
                              {conn.investmentType === "none_yet"
                                ? "Type TBD"
                                : conn.investmentType}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <Link
                              to={`/investor/directory/${conn.startup?._id || conn.startup?.id}`}
                              className="text-[11px] font-bold text-teal-800 hover:underline flex items-center gap-1"
                            >
                              View startup <ChevronRight className="w-3 h-3" />
                            </Link>
                            {conn.status === "approved" && (
                              <Link
                                to={`/investor/directory/${conn.startup?._id || conn.startup?.id}`}
                                className="text-[11px] font-bold text-blue-800 hover:underline flex items-center gap-1 ml-auto"
                              >
                                <FileText className="w-3 h-3" /> Data room
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Requests & Quick Profile */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  My Data Room Requests
                </h2>
                <p className="text-xs text-slate-500">
                  Real-time status of requested startup confidential data rooms
                </p>
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
                  <p className="text-sm font-bold text-slate-700">
                    No active access requests
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Visit the designated startup directory and click “Request
                    Data Room Access” on any venture profile.
                  </p>
                </div>
              ) : (
                requests.map((req) => (
                  <div
                    key={req._id}
                    className="py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {req.startup?.companyName ||
                          req.startup?.legalName ||
                          "Ethiopian Venture"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>
                          Requested{" "}
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleDateString()
                            : "—"}
                        </span>
                        {req.startup?._id && (
                          <Link
                            to={`/investor/directory/${req.startup._id}`}
                            className="text-teal-800 font-bold hover:underline"
                          >
                            {req.status === "approved"
                              ? "Open Data Room →"
                              : "View Startup"}
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
                  <span className="text-slate-400 font-bold">
                    Organization:
                  </span>{" "}
                  <strong>{user?.organization || "Not Specified"}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-bold">
                    Ticket Range:
                  </span>{" "}
                  <strong>{user?.investmentRange || "Not Specified"}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-bold">Focus:</span>{" "}
                  <strong>
                    {user?.focus?.length
                      ? user.focus.join(", ")
                      : "All Sectors"}
                  </strong>
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
                <h2 className="text-lg font-black text-slate-900">
                  Featured Designated Startups
                </h2>
                <p className="text-xs text-slate-500">
                  Statutorily audited entities eligible for investment
                  incentives
                </p>
              </div>
              <Link
                to="/investor/directory"
                className="text-xs font-bold text-teal-800 hover:underline"
              >
                View Full Registry →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommended.map((s) => (
                <StartupCard
                  key={s._id || s.id}
                  startup={s}
                  to={`/investor/directory/${s._id || s.id}`}
                  onExpressInterest={setExpressModal}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── EXPRESS INTEREST MODAL ── */}
      {expressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Express Interest
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {expressModal.companyName || "Startup"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpressModal(null);
                  setExpressMessage("");
                  setExpressTicketSize("");
                }}
                disabled={expressLoading}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message to founder
                </label>
                <textarea
                  value={expressMessage}
                  onChange={(e) => setExpressMessage(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe your investment thesis and why this startup aligns with your mandate..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Proposed ticket size
                </label>
                <input
                  type="text"
                  value={expressTicketSize}
                  onChange={(e) => setExpressTicketSize(e.target.value)}
                  placeholder="e.g., $50K – $200K"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>Note:</strong> This expresses your interest and creates
                a data-room access request. The founder will review your profile
                before approving access.
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setExpressModal(null);
                  setExpressMessage("");
                  setExpressTicketSize("");
                }}
                disabled={expressLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExpressInterest}
                disabled={expressLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60"
              >
                {expressLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5" />
                    Express Interest
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

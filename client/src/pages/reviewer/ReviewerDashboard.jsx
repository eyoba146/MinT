import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import {
  Building2,
  Loader2,
  Search,
  Inbox,
  AlertTriangle,
  ExternalLink,
  ClipboardList,
  HelpCircle,
  FileCheck,
  CheckCircle2,
  XCircle,
  Shield,
} from "lucide-react";

const TABS = [
  { key: "queue", label: "Queue" },
  { key: "under_review", label: "Under review" },
  { key: "clarification_needed", label: "Clarification" },
  { key: "designated", label: "Designated" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
  { key: "all", label: "All" },
];

export default function ReviewerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("queue");
  const [annualReports, setAnnualReports] = useState([]);
  const [annualLoading, setAnnualLoading] = useState(true);
  const [reportNotes, setReportNotes] = useState({});
  const [reviewingReport, setReviewingReport] = useState(null);
  const [pendingVerifications, setPendingVerifications] = useState(0);

  const fetchStats = async () => {
    try {
      const res = await apiRequest("/startups/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStartups = async (status = tab, q = search) => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (q) params.set("search", q);
      const res = await apiRequest(`/startups/admin?${params.toString()}`);
      setStartups(res.data || []);
    } catch (err) {
      toast(err.message || "Failed to load list", "error");
      setStartups([]);
    } finally {
      setListLoading(false);
    }
  };

  const fetchAnnualReports = async () => {
    setAnnualLoading(true);
    try {
      const res = await apiRequest("/startups/annual-reports?status=pending");
      setAnnualReports(res.data || []);
    } catch (err) {
      toast(err.message || "Failed to load annual reports", "error");
    } finally {
      setAnnualLoading(false);
    }
  };

  const fetchVerificationCount = async () => {
    try {
      const res = await apiRequest("/auth/admin/verifications");
      setPendingVerifications(res.count || res.data?.length || 0);
    } catch (err) {
      console.error("Failed to load pending verifications count", err);
    }
  };

  const handleAnnualReportReview = async (report, status) => {
    setReviewingReport(report._id);
    try {
      await apiRequest(
        `/startups/${report.startupId}/annual-reports/${report._id}`,
        {
          method: "PATCH",
          body: { status, notes: reportNotes[report._id] || "" },
        },
      );
      toast(`Annual report marked ${status}`, "success");
      setAnnualReports((prev) =>
        prev.filter((item) => item._id !== report._id),
      );
      setReportNotes((prev) => ({ ...prev, [report._id]: "" }));
    } catch (err) {
      toast(err.message || "Failed to review annual report", "error");
    } finally {
      setReviewingReport(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchStartups("queue", ""),
        fetchAnnualReports(),
        fetchVerificationCount(),
      ]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) fetchStartups(tab, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const isOverdue = (s) => {
    if (!s.reviewDueAt) return false;
    if (
      !["submitted", "under_review", "clarification_needed"].includes(s.status)
    )
      return false;
    return new Date(s.reviewDueAt) < new Date();
  };

  if (loading) {
    return (
      <AppShell title="Review queue">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Review workspace"
      subtitle={`Staff reviewer · ${user?.fullName || ""}`}
    >
      <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
        <strong>Your role:</strong> evaluate startups against Proclamation
        1396/2025 criteria. You can start review, score, designate, request
        clarification, or reject. Final suspend/revoke is{" "}
        <strong>Admin only</strong>.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="In queue"
          value={stats?.submitted ?? 0}
          icon={Inbox}
          color="amber"
        />
        <StatCard
          label="Under review"
          value={stats?.underReview ?? 0}
          icon={ClipboardList}
          color="blue"
        />
        <StatCard
          label="Clarification"
          value={stats?.clarificationNeeded ?? 0}
          icon={HelpCircle}
          color="orange"
        />
        <StatCard
          label="Designated"
          value={stats?.designated ?? 0}
          icon={Building2}
          color="teal"
        />
        <StatCard
          label="Pending Verifications"
          value={pendingVerifications}
          icon={Shield}
          color="purple"
        />
      </div>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" /> Annual report
              compliance
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Review reports submitted by designated founders.
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            {annualReports.length} pending
          </span>
        </div>

        {annualLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
        ) : annualReports.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            No annual reports awaiting review.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {annualReports.map((report) => (
              <div key={report._id} className="px-4 sm:px-6 py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900">
                      {report.companyName} · FY {report.year}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {report.founder?.fullName || "Founder"} · submitted{" "}
                      {report.submittedAt
                        ? new Date(report.submittedAt).toLocaleDateString()
                        : "—"}
                    </div>
                  </div>
                  {report.reportUrl && (
                    <a
                      href={report.reportUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 shrink-0"
                    >
                      <ExternalLink size={12} /> Open report
                    </a>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={reportNotes[report._id] || ""}
                    onChange={(e) =>
                      setReportNotes((prev) => ({
                        ...prev,
                        [report._id]: e.target.value,
                      }))
                    }
                    placeholder="Review note (optional)"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAnnualReportReview(report, "flagged")}
                    disabled={reviewingReport === report._id}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-bold hover:bg-red-100 disabled:opacity-60"
                  >
                    <XCircle size={13} /> Flag
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnnualReportReview(report, "reviewed")}
                    disabled={reviewingReport === report._id}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={13} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg ${
                tab === t.key
                  ? "text-teal-800 border-b-2 border-teal-600 bg-teal-50/60"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchStartups(tab, search);
          }}
          className="px-4 sm:px-6 py-4 border-b border-slate-100 flex gap-3"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl"
          >
            Search
          </button>
        </form>

        {listLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
          </div>
        ) : startups.length === 0 ? (
          <div className="py-16 text-center">
            <ClipboardList className="mx-auto text-slate-300 mb-3" size={28} />
            <p className="text-sm font-medium text-slate-700">
              No startups in this filter
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-semibold">Startup</th>
                  <th className="px-4 py-3 font-semibold">Sector</th>
                  <th className="px-4 py-3 font-semibold">Due</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {startups.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="font-semibold text-slate-900">
                        {item.companyName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.founder?.fullName || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.sector}</td>
                    <td className="px-4 py-4">
                      {item.reviewDueAt ? (
                        <span
                          className={`text-xs font-medium ${
                            isOverdue(item) ? "text-red-600" : "text-slate-600"
                          }`}
                        >
                          {new Date(item.reviewDueAt).toLocaleDateString()}
                          {isOverdue(item) ? " · overdue" : ""}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <Link
                        to={`/reviewer/cases/${item._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700"
                      >
                        Open case <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

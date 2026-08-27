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
} from "lucide-react";

const TABS = [
  { key: "pending", label: "Queue" },
  { key: "under_review", label: "Under review" },
  { key: "verified", label: "Designated" },
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
  const [tab, setTab] = useState("pending");

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

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchStartups("pending", "")]);
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
    if (!["pending", "submitted", "under_review"].includes(s.status)) return false;
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
        <strong>Your role:</strong> review and comment on applications. You can see all
        startups and builders. Final designate / reject / suspend is{" "}
        <strong>Admin only</strong>.
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="In queue" value={stats?.pending ?? 0} icon={Inbox} color="amber" />
        <StatCard label="Overdue" value={stats?.overdue ?? 0} icon={AlertTriangle} color="red" />
        <StatCard
          label="Designated"
          value={stats?.verified ?? 0}
          icon={Building2}
          color="teal"
        />
      </div>

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
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
            <p className="text-sm font-medium text-slate-700">No startups in this filter</p>
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
                  <th className="px-4 sm:px-6 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {startups.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.companyName}</div>
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
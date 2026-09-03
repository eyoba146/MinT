import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StatCard from "../../components/StatCard";
import StatusBadge from "../../components/StatusBadge";
import { SECTORS } from "../../data/constants";
import {
  Building2,
  CheckCircle,
  Users,
  Loader2,
  Search,
  Inbox,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

const TABS = [
  { key: "pending", label: "Queue" },
  { key: "under_review", label: "Under Review" },
  { key: "clarification_needed", label: "Clarification" },
  { key: "designated", label: "Designated" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
  { key: "revoked", label: "Revoked" },
  { key: "expired", label: "Expired" },
  { key: "all", label: "All" },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [tab, setTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");

  const fetchStats = async () => {
    try {
      const res = await apiRequest("/startups/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStartups = async (status = tab, q = search, sec = sector) => {
    setListLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      if (q) params.set("search", q);
      if (sec) params.set("sector", sec);
      const res = await apiRequest(`/startups/admin?${params.toString()}`);
      setStartups(res.data || []);
    } catch (err) {
      toast(err.message || "Failed to load startups", "error");
      setStartups([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchStartups("pending", "", "")]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) fetchStartups(tab, search, sector);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStartups(tab, search, sector);
  };

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
      <AppShell title="Startups" subtitle="Loading…">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Startups"
      subtitle={`Designation cases · ${user?.fullName || "Admin"}`}
      actions={
        <div className="flex gap-2">
          <Link
            to="/admin/opportunities"
            className="hidden sm:inline-flex px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            Opportunities
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex px-3 py-2 text-sm font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            Users
          </Link>
        </div>
      }
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
        <StatCard
          label="Submitted"
          value={stats?.submitted ?? 0}
          icon={Inbox}
          color="amber"
        />
        <StatCard
          label="Under Review"
          value={stats?.underReview ?? 0}
          icon={Search}
          color="blue"
        />
        <StatCard
          label="Clarification"
          value={stats?.clarificationNeeded ?? 0}
          icon={HelpCircle}
          color="amber"
        />
        <StatCard
          label="Overdue"
          value={stats?.overdue ?? 0}
          icon={AlertTriangle}
          color="red"
        />
        <StatCard
          label="Designated"
          value={stats?.designated ?? 0}
          icon={CheckCircle}
          color="teal"
        />
        <StatCard
          label="Investors"
          value={stats?.totalInvestors ?? 0}
          icon={Users}
          color="purple"
        />
        <StatCard
          label="Total Startups"
          value={stats?.totalStartups ?? 0}
          icon={Building2}
          color="blue"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-100 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
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
          onSubmit={handleSearch}
          className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or description…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">All sectors</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl"
          >
            Filter
          </button>
        </form>

        {listLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
          </div>
        ) : startups.length === 0 ? (
          <div className="py-16 text-center">
            <Inbox className="mx-auto text-slate-300 mb-3" size={28} />
            <p className="text-sm font-medium text-slate-700">
              No applications found
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-semibold">Startup</th>
                  <th className="px-4 py-3 font-semibold">Sector</th>
                  <th className="px-4 py-3 font-semibold">Country</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
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
                        {item.founder?.email ? ` · ${item.founder.email}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{item.sector}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {item.country || "—"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {new Date(
                        item.submittedAt || item.createdAt,
                      ).toLocaleDateString()}
                    </td>
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
                        to={`/admin/cases/${item._id}`}
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

import { useEffect, useState } from "react";
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
  Users,
  CheckCircle,
  Inbox,
} from "lucide-react";

const TABS = [
  { key: "all", label: "All" },
  { key: "verified", label: "Designated" },
  { key: "pending", label: "In queue" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
];

export default function ModeratorStartups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listLoading, setListLoading] = useState(false);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

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
      toast(err.message || "Failed to load startups", "error");
      setStartups([]);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchStartups("all", "")]);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading) fetchStartups(tab, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  if (loading) {
    return (
      <AppShell title="Startups">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Startup directory"
      subtitle={`Read-only · ${user?.fullName || "Moderator"}`}
    >
      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        You can <strong>view</strong> startups only. Designation decisions stay with Admin / Reviewer.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total startups" value={stats?.totalStartups ?? 0} icon={Building2} color="blue" />
        <StatCard label="Designated" value={stats?.verified ?? 0} icon={CheckCircle} color="teal" />
        <StatCard label="In queue" value={stats?.pending ?? 0} icon={Inbox} color="amber" />
        <StatCard label="Investors" value={stats?.totalInvestors ?? 0} icon={Users} color="purple" />
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
            className="px-4 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl"
          >
            Search
          </button>
        </form>

        {listLoading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
          </div>
        ) : startups.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">No startups found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Startup</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Founder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {startups.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80">
                    <td className="px-4 sm:px-6 py-4 font-semibold text-slate-900">
                      {s.companyName}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{s.sector}</td>
                    <td className="px-4 py-4 text-slate-600">{s.country || "—"}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-500">
                      {s.founder?.fullName || "—"}
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
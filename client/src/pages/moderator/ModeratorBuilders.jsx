import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StatusBadge from "../../components/StatusBadge";
import { Loader2, Search, Network, Building2 } from "lucide-react";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "designated", label: "Designated" },
  { key: "rejected", label: "Rejected" },
];

export default function ModeratorBuilders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const fetchList = async (status = tab) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status && status !== "all") params.set("status", status);
      const res = await apiRequest(`/ecosystem-builders/admin?${params.toString()}`);
      let data = res.data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        data = data.filter(
          (b) =>
            (b.organizationName || "").toLowerCase().includes(q) ||
            (b.country || "").toLowerCase().includes(q)
        );
      }
      setList(data);
    } catch (err) {
      toast(err.message || "Failed to load builders", "error");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList("all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchList(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <AppShell
      title="Ecosystem builders"
      subtitle={`Read-only · ${user?.fullName || "Moderator"}`}
    >
      <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
        View only. Designation of builders is done by Admin.
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
            fetchList(tab);
          }}
          className="px-4 sm:px-6 py-4 border-b border-slate-100 flex gap-3"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search organization or country…"
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

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-500">
            <Network className="mx-auto mb-2 text-slate-300" size={28} />
            No builders found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 sm:px-6 py-3">Organization</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Country</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-50/80">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-base">
                          <Building2 className="w-4 h-4 text-teal-700" />
                        </div>
                        <span className="font-semibold text-slate-900">
                          {b.organizationName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600 capitalize">
                      {(b.builderType || "—").replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{b.country || "—"}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={b.status} />
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

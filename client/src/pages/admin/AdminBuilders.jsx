import { useEffect, useState } from "react";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/ui/Modal";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Building2,
  Ban,
  Search,
} from "lucide-react";

const FILTERS = [
  { key: "pending", label: "Queue" },
  { key: "under_review", label: "Under review" },
  { key: "designated", label: "Designated" },
  { key: "rejected", label: "Rejected" },
  { key: "suspended", label: "Suspended" },
  { key: "all", label: "All" },
];

export default function AdminBuilders() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await apiRequest(`/ecosystem-builders/admin${params}`);
      setItems(res.data || []);
    } catch (err) {
      toast(err.message || "Failed to load", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const submit = async () => {
    if (!modal) return;
    if (
      (modal.action === "reject" || modal.action === "suspend") &&
      !reason.trim()
    ) {
      toast("Reason is required", "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/ecosystem-builders/${modal.id}/${modal.action}`, {
        method: "PATCH",
        body: { reason: reason.trim(), notes: notes.trim() },
      });
      const msg =
        modal.action === "approve"
          ? "Builder designated"
          : modal.action === "reject"
            ? "Application rejected"
            : "Builder suspended";
      toast(msg, "success");
      setModal(null);
      setReason("");
      setNotes("");
      await load();
    } catch (err) {
      toast(err.message || "Action failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const filtered = items.filter((b) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      b.organizationName?.toLowerCase().includes(q) ||
      b.ownerUser?.email?.toLowerCase().includes(q) ||
      b.ownerUser?.fullName?.toLowerCase().includes(q) ||
      b.country?.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell
      title="Ecosystem builders"
      subtitle="Review and designation decisions"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Prefer deciding on cases that are <strong>under review</strong>.
          Reviewer notes appear in the table when available.
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 pt-3 border-b border-slate-100 flex flex-wrap gap-1">
            {FILTERS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`px-4 py-3 text-sm font-semibold rounded-t-lg transition-colors ${
                  filter === t.key
                    ? "text-teal-900 border-b-2 border-teal-700 bg-teal-50/70"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-4 sm:p-5 border-b border-slate-100">
            <div className="relative max-w-md">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search organization, owner, country…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Building2 className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-sm font-semibold text-slate-800">
                No applications
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Organization
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Country
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/90">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-900 text-sm">
                          {b.organizationName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {b.ownerUser?.fullName || "—"}
                          {b.ownerUser?.email ? ` · ${b.ownerUser.email}` : ""}
                        </div>
                        {b.adminNotes && (
                          <p className="text-xs text-blue-800 mt-2 bg-blue-50 rounded-lg px-2 py-1.5 border border-blue-100 line-clamp-2">
                            <strong>Notes:</strong> {b.adminNotes}
                          </p>
                        )}
                        {b.rejectionReason && (
                          <p className="text-xs text-red-700 mt-1">
                            Reject: {b.rejectionReason}
                          </p>
                        )}
                        {b.suspensionReason && (
                          <p className="text-xs text-amber-800 mt-1">
                            Suspend: {b.suspensionReason}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 capitalize">
                        {(b.builderType || "—").replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {b.country || "—"}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-2">
                          {["pending", "submitted", "under_review"].includes(
                            b.status
                          ) && (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  setModal({ id: b._id, action: "approve" })
                                }
                                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800"
                              >
                                <CheckCircle size={13} /> Designate
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setModal({ id: b._id, action: "reject" })
                                }
                                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl"
                              >
                                <XCircle size={13} /> Reject
                              </button>
                            </>
                          )}
                          {b.status === "designated" && (
                            <button
                              type="button"
                              onClick={() =>
                                setModal({ id: b._id, action: "suspend" })
                              }
                              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-100 rounded-xl"
                            >
                              <Ban size={13} /> Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!modal}
        onClose={() => !saving && setModal(null)}
        title={
          modal?.action === "approve"
            ? "Designate ecosystem builder"
            : modal?.action === "reject"
              ? "Reject application"
              : "Suspend designation"
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={saving}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-50 ${
                modal?.action === "approve"
                  ? "bg-teal-700 hover:bg-teal-800"
                  : modal?.action === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {saving ? "Saving…" : "Confirm"}
            </button>
          </>
        }
      >
        {(modal?.action === "reject" || modal?.action === "suspend") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Reason *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Internal notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
            placeholder="Optional"
          />
        </div>
      </Modal>
    </AppShell>
  );
}
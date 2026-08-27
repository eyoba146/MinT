import { useEffect, useState } from "react";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/ui/Modal";
import { Loader2, Building2, ClipboardList } from "lucide-react";

export default function ReviewerBuilders() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [modal, setModal] = useState(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const res = await apiRequest(`/ecosystem-builders/admin${params}`);
      setItems(res.data || []);
    } catch (err) {
      toast(err.message || "Failed to load builders", "error");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const submitReview = async () => {
    if (!modal) return;
    if (!notes.trim() || notes.trim().length < 10) {
      toast("Notes required (at least 10 characters) for admin audit", "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/ecosystem-builders/${modal.id}/start-review`, {
        method: "PATCH",
        body: { notes: notes.trim() },
      });
      toast("Marked under review", "success");
      setModal(null);
      setNotes("");
      await load();
    } catch (err) {
      toast(err.message || "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Ecosystem builders"
      subtitle="Review queue · mark under review (Admin does final designation)"
    >
      <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-900">
        Your job: evaluate and mark <strong>Under review</strong> with notes.
        Admin designates, rejects, or suspends.
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["pending", "under_review", "designated", "rejected", "suspended", "all"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border capitalize ${
              filter === f
                ? "bg-teal-50 border-teal-500 text-teal-800"
                : "bg-white border-slate-200 text-slate-600"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="mx-auto text-slate-300 mb-3" size={28} />
          <p className="text-sm font-medium text-slate-700">No applications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-lg">{b.logo || "🏢"}</span>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {b.organizationName}
                  </h3>
                  <StatusBadge status={b.status} />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                    {(b.builderType || "").replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{b.description}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {b.country || "—"} · {b.ownerUser?.fullName} · {b.ownerUser?.email}
                </p>
                {b.adminNotes && (
                  <p className="text-xs text-teal-800 mt-2 bg-teal-50 rounded-lg px-2 py-1">
                    Notes: {b.adminNotes}
                  </p>
                )}
              </div>
              {["pending", "submitted"].includes(b.status) && (
                <button
                  type="button"
                  onClick={() => setModal({ id: b._id, name: b.organizationName })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg shrink-0"
                >
                  <ClipboardList size={13} /> Under review
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title="Mark under review"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="px-4 py-2 text-sm rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitReview}
              disabled={saving}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-amber-600"
            >
              {saving ? "Saving…" : "Confirm"}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          {modal?.name} — write notes for the admin audit trail (min 10 characters).
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          placeholder="What you checked, concerns, recommendation…"
        />
      </Modal>
    </AppShell>
  );
}
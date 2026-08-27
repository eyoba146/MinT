import { useEffect, useState } from "react";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import Modal from "../../components/ui/Modal";
import {
  Loader2,
  Plus,
  Trash2,
  Megaphone,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Sparkles,
  Trophy,
  Bell,
} from "lucide-react";

const TYPE_META = {
  scholarship: {
    label: "Scholarship",
    icon: GraduationCap,
    badge: "bg-purple-50 text-purple-800 border-purple-200",
    accent: "from-purple-500 to-indigo-600",
  },
  internship: {
    label: "Internship",
    icon: Briefcase,
    badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
    accent: "from-emerald-500 to-teal-600",
  },
  job: {
    label: "Job",
    icon: Briefcase,
    badge: "bg-blue-50 text-blue-800 border-blue-200",
    accent: "from-blue-500 to-cyan-600",
  },
  training: {
    label: "Training",
    icon: Sparkles,
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    accent: "from-amber-500 to-orange-600",
  },
  competition: {
    label: "Competition",
    icon: Trophy,
    badge: "bg-rose-50 text-rose-800 border-rose-200",
    accent: "from-rose-500 to-pink-600",
  },
  announcement: {
    label: "Announcement",
    icon: Bell,
    badge: "bg-teal-50 text-teal-800 border-teal-200",
    accent: "from-teal-600 to-teal-800",
  },
  other: {
    label: "Other",
    icon: Megaphone,
    badge: "bg-slate-50 text-slate-700 border-slate-200",
    accent: "from-slate-600 to-slate-800",
  },
};

const TYPES = Object.keys(TYPE_META);

const emptyForm = {
  title: "",
  description: "",
  type: "announcement",
  deadline: "",
  link: "",
  location: "",
};

const STATUS_BADGE = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  approved: "bg-teal-50 text-teal-800 border-teal-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

export default function AdminOpportunities() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchData = async (status = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ all: "true" });
      if (status && status !== "all") params.set("status", status);
      const res = await apiRequest(`/opportunities?${params.toString()}`);
      setItems(res.data || []);
    } catch (err) {
      toast(err.message || "Failed to load", "error");
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
    if (!loading) fetchData(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest("/opportunities", {
        method: "POST",
        body: { ...form, deadline: form.deadline || undefined },
      });
      toast("Opportunity published", "success");
      setForm(emptyForm);
      setShowForm(false);
      await fetchData(statusFilter);
    } catch (err) {
      toast(err.message || "Failed to create", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await apiRequest(`/opportunities/${id}/approve`, { method: "PATCH" });
      toast("Approved", "success");
      await fetchData(statusFilter);
    } catch (err) {
      toast(err.message || "Approve failed", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setActionId(rejectId);
    try {
      await apiRequest(`/opportunities/${rejectId}/reject`, {
        method: "PATCH",
        body: { reason: rejectReason },
      });
      toast("Rejected", "success");
      setRejectId(null);
      setRejectReason("");
      await fetchData(statusFilter);
    } catch (err) {
      toast(err.message || "Reject failed", "error");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionId(deleteId);
    try {
      await apiRequest(`/opportunities/${deleteId}`, { method: "DELETE" });
      toast("Deleted", "success");
      setDeleteId(null);
      await fetchData(statusFilter);
    } catch (err) {
      toast(err.message || "Delete failed", "error");
    } finally {
      setActionId(null);
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <AppShell
      title="Opportunities"
      subtitle="Publish announcements and moderate posts"
      actions={
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl"
        >
          <Plus size={16} /> New post
        </button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "approved", label: "Approved" },
            { key: "rejected", label: "Rejected" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatusFilter(t.key)}
              className={`px-3.5 py-2 text-sm font-semibold rounded-full border transition-colors ${
                statusFilter === t.key
                  ? "bg-teal-50 border-teal-600 text-teal-900"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
              {t.key === "pending" && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 max-w-2xl"
          >
            <h2 className="font-semibold text-slate-900 text-base">Create opportunity</h2>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Title"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
            />
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_META[t].label}
                </option>
              ))}
            </select>
            <textarea
              required
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
              <input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <input
              type="url"
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://…"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
            >
              {saving ? "Publishing…" : "Publish"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
            <Megaphone className="mx-auto text-slate-300 mb-3" size={32} />
            <p className="text-sm font-semibold text-slate-800">No posts yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {items.map((item) => {
              const meta = TYPE_META[item.type] || TYPE_META.other;
              const Icon = meta.icon;
              return (
                <article
                  key={item._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-teal-200 transition-colors"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${meta.accent}`} />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${meta.badge}`}
                      >
                        <Icon size={12} /> {meta.label}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${
                          STATUS_BADGE[item.status] || STATUS_BADGE.pending
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 line-clamp-3 flex-1">
                      {item.description}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                      {item.deadline && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} />{" "}
                          {new Date(item.deadline).toLocaleDateString()}
                        </div>
                      )}
                      {item.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} /> {item.location}
                        </div>
                      )}
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-teal-800 font-semibold hover:underline"
                        >
                          <ExternalLink size={13} /> Open link
                        </a>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {item.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(item._id)}
                            disabled={actionId === item._id}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-white bg-teal-700 rounded-xl hover:bg-teal-800 disabled:opacity-50"
                          >
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setRejectId(item._id)}
                            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl"
                          >
                            <XCircle size={13} /> Reject
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteId(item._id)}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-xl"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        title="Reject opportunity"
        footer={
          <>
            <button
              type="button"
              onClick={() => setRejectId(null)}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-red-600"
            >
              Reject
            </button>
          </>
        }
      >
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={3}
          placeholder="Reason (optional)"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
        />
      </Modal>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete opportunity?"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteId(null)}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-red-600"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600">This cannot be undone.</p>
      </Modal>
    </AppShell>
  );
}
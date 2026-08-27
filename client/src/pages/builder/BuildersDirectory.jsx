import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import EmptyState from "../../components/EmptyState";
import ErrorState from "../../components/ErrorState";
import Modal from "../../components/ui/Modal";
import {
  Loader2,
  Building2,
  MapPin,
  Globe,
  Search,
  Send,
} from "lucide-react";

const TYPE_LABELS = {
  incubator: "Incubator",
  accelerator: "Accelerator",
  coworking: "Coworking / hub",
  angel_network: "Angel network",
  university: "University",
  research: "Research",
  ngo: "NGO",
  other: "Other",
};

export default function BuildersDirectory({ embedded = false }) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [error, setError] = useState("");
  const [interestTarget, setInterestTarget] = useState(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest("/ecosystem-builders/public");
      setItems(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load builders");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((b) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      b.organizationName?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q) ||
      b.location?.toLowerCase().includes(q) ||
      b.country?.toLowerCase().includes(q);
    const matchType = !type || b.builderType === type;
    return matchQ && matchType;
  });

  const canExpressInterest =
    isAuthenticated &&
    (user?.role === "investor" ||
      user?.role === "founder" ||
      user?.role === "citizen" ||
      user?.role === "admin");

  const sendInterest = async () => {
    if (!interestTarget) return;
    setSending(true);
    try {
      await apiRequest(`/ecosystem-builders/${interestTarget._id}/interest`, {
        method: "POST",
        body: { message: message.trim() },
      });
      toast("Interest sent to the organization", "success");
      setInterestTarget(null);
      setMessage("");
    } catch (err) {
      toast(
        err.message ||
          "Could not send interest. Use the organization website if available.",
        "error"
      );
    } finally {
      setSending(false);
    }
  };

  const body = (
    <div className="space-y-6">
      {!embedded && (
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Ecosystem builders
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Designated incubators, accelerators, and innovation hubs.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row gap-3 shadow-sm">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
          />
        </div>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full sm:w-48 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/30"
        >
          <option value="">All types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No builders found"
          description="Try a different search or filter."
        />
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <article
              key={b._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col shadow-sm hover:border-teal-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-900 text-base leading-snug">
                  {b.organizationName}
                </h3>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 capitalize shrink-0 font-medium">
                  {TYPE_LABELS[b.builderType] ||
                    (b.builderType || "").replace(/_/g, " ")}
                </span>
              </div>
              <p className="text-sm text-slate-600 line-clamp-3 flex-1">
                {b.description || "No description provided."}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-sm text-slate-500">
                {(b.location || b.country) && (
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span>
                      {[b.location, b.country].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                {b.website && (
                  <a
                    href={
                      b.website.startsWith("http")
                        ? b.website
                        : `https://${b.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-teal-800 hover:underline"
                  >
                    <Globe size={14} /> Website
                  </a>
                )}
              </div>
              {canExpressInterest && (
                <button
                  type="button"
                  onClick={() => {
                    setInterestTarget(b);
                    setMessage("");
                  }}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl bg-teal-700 text-white hover:bg-teal-800"
                >
                  <Send size={14} /> Express interest
                </button>
              )}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="mt-4 text-center text-sm font-semibold text-teal-800 hover:underline"
                >
                  Sign in to contact
                </Link>
              )}
            </article>
          ))}
        </div>
      )}

      <Modal
        open={!!interestTarget}
        onClose={() => !sending && setInterestTarget(null)}
        title="Express interest"
        footer={
          <>
            <button
              type="button"
              onClick={() => setInterestTarget(null)}
              disabled={sending}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 bg-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={sendInterest}
              disabled={sending}
              className="px-4 py-2.5 text-sm font-semibold rounded-xl text-white bg-teal-700 disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          Message to <strong>{interestTarget?.organizationName}</strong>
        </p>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Introduce yourself and why you are reaching out…"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600/30"
        />
      </Modal>
    </div>
  );

  if (embedded) {
    return (
      <AppShell title="Ecosystem builders" subtitle="Designated organizations">
        {body}
      </AppShell>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
      {body}
    </div>
  );
}
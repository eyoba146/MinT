import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import { apiRequest } from "../../utils/api";
import {
  CheckCircle,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";

export default function VerificationQueue() {
  const { toast } = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState({});
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadPending = async () => {
    try {
      const data = await apiRequest("/auth/admin/verifications");
      if (data.success) setPending(data.data || []);
    } catch (err) {
      toast(err.message || "Failed to load pending verifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const refreshQueue = async () => {
    setRefreshing(true);
    await loadPending();
    setRefreshing(false);
  };

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReview = async (userId, reviewStatus) => {
    setAction({ userId, type: reviewStatus });
    try {
      const data = await apiRequest(`/auth/admin/verifications/${userId}`, {
        method: "PATCH",
        body: { status: reviewStatus, notes: notes[userId] || "" },
      });
      if (data.success) {
        toast(`Verification ${reviewStatus}`, "success");
        await loadPending();
      } else {
        toast(data.message || "Action failed", "error");
      }
    } catch (err) {
      toast(err.message || "Action failed", "error");
    } finally {
      setAction(null);
    }
  };

  const filtered = pending.filter((user) => {
    const query = search.toLowerCase();
    return (
      !query ||
      user.fullName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    );
  });

  const documentCount = pending.reduce(
    (total, user) => total + (user.verificationDocuments?.length || 0),
    0,
  );

  const roleLabel = (role) =>
    role === "ecosystem_builder"
      ? "Ecosystem builder"
      : role?.charAt(0).toUpperCase() + role?.slice(1);

  const statTone = {
    amber: "bg-amber-50 text-amber-700",
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <AppShell
      title="Verification queue"
      subtitle="Review identity documents submitted by portal users"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-8">
          <div className="absolute -right-10 -top-16 h-52 w-52 rounded-full bg-teal-400/10 blur-2xl" />
          <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-teal-100">
                <ShieldCheck size={14} /> Staff review workspace
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Keep every account moving forward.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                Review submitted documents, leave context for the applicant, and
                approve or reject each verification with confidence.
              </p>
            </div>
            <div className="flex h-24 w-24 shrink-0 flex-col justify-center rounded-2xl border border-white/10 bg-white/10 px-4 backdrop-blur-sm sm:h-28 sm:w-28">
              <span className="text-3xl font-extrabold tracking-tight">
                {pending.length}
              </span>
              <span className="text-xs font-semibold text-teal-100">
                awaiting review
              </span>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Pending", value: pending.length, icon: Clock3, tone: "amber" },
            { label: "Applicants", value: pending.length, icon: Users, tone: "teal" },
            { label: "Documents", value: documentCount, icon: FileText, tone: "blue" },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${statTone[tone]}`}>
                <Icon size={21} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className="mt-0.5 text-xl font-extrabold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <button
            type="button"
            onClick={refreshQueue}
            disabled={refreshing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh queue
          </button>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-600" />
            <p className="mt-3 text-sm font-medium text-slate-500">Loading verification queue...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
              <ShieldCheck size={28} />
            </div>
            <h3 className="mt-4 text-base font-bold text-slate-900">
              {search ? "No matching applicants" : "Queue is all clear"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
              {search
                ? "Try a different name, email, or role."
                : "There are no pending verification submissions right now."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {filtered.map((user) => {
              const isApproving = action?.userId === user._id && action?.type === "approved";
              const isRejecting = action?.userId === user._id && action?.type === "rejected";
              const isBusy = isApproving || isRejecting;

              return (
                <article key={user._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md">
                  <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-sm font-extrabold text-white shadow-sm">
                          {user.fullName?.charAt(0)?.toUpperCase() || <UserRound size={18} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-bold text-slate-900">{user.fullName}</h3>
                          <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800">Pending</span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{roleLabel(user.role)}</span>
                      {user.createdAt && <span>Submitted {new Date(user.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  <div className="px-5 py-5 sm:px-6">
                    <div className="mb-3">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Submitted documents</p>
                      <p className="mt-1 text-xs text-slate-400">{user.verificationDocuments?.length || 0} file(s) attached</p>
                    </div>
                    <div className="space-y-2">
                      {user.verificationDocuments?.map((doc) => (
                        <div key={doc._id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-slate-700">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-teal-700 shadow-sm"><FileText size={15} /></span>
                            <span className="truncate">{doc.originalName || doc.documentType}</span>
                          </span>
                          <a href={doc.cloudinaryUrl} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline">
                            View <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5">
                      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500" htmlFor={`notes-${user._id}`}>
                        Reviewer note <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
                      </label>
                      <textarea
                        id={`notes-${user._id}`}
                        value={notes[user._id] || ""}
                        onChange={(event) => setNotes({ ...notes, [user._id]: event.target.value })}
                        placeholder="Add context for the applicant..."
                        className="w-full resize-y rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2.5 text-sm transition focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        rows={2}
                      />
                    </div>

                    <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button type="button" onClick={() => handleReview(user._id, "rejected")} disabled={isBusy} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60">
                        {isRejecting ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />} Reject
                      </button>
                      <button type="button" onClick={() => handleReview(user._id, "approved")} disabled={isBusy} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60">
                        {isApproving ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Approve verification
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

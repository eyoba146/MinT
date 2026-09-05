import { useEffect, useState } from "react";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import { Loader2, CheckCircle, XCircle, FileText, Search } from "lucide-react";

export default function VerificationQueue() {
  const { toast } = useToast();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState(null); // { userId, type }
  const [notes, setNotes] = useState({});
  const [search, setSearch] = useState("");

  const loadPending = async () => {
    try {
      const res = await fetch(
        "http://localhost:5000/api/auth/admin/verifications",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("dih_token")}`,
          },
        },
      );
      const data = await res.json();
      if (data.success) setPending(data.data || []);
    } catch (err) {
      toast(err.message || "Failed to load pending verifications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReview = async (userId, reviewStatus) => {
    setAction({ userId, type: reviewStatus });
    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/admin/verifications/${userId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("dih_token")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: reviewStatus,
            notes: notes[userId] || "",
          }),
        },
      );
      const data = await res.json();
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

  const filtered = pending.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <AppShell title="Verification Queue" subtitle="Review onboarding documents">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
          <div className="relative max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            No pending verifications.
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((u) => {
              const isApproving =
                action?.userId === u._id && action?.type === "approved";
              const isRejecting =
                action?.userId === u._id && action?.type === "rejected";
              const isBusy = isApproving || isRejecting;

              return (
                <div
                  key={u._id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{u.fullName}</h3>
                      <p className="text-sm text-slate-500">
                        {u.email} · <span className="capitalize">{u.role}</span>
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                      Pending
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    {u.verificationDocuments?.map((doc) => (
                      <div
                        key={doc._id}
                        className="flex items-center justify-between text-sm bg-slate-50 p-2.5 rounded-lg"
                      >
                        <span className="flex items-center gap-2">
                          <FileText size={16} className="text-slate-400" />
                          {doc.originalName || doc.documentType}
                        </span>
                        <a
                          href={doc.cloudinaryUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <textarea
                      value={notes[u._id] || ""}
                      onChange={(e) =>
                        setNotes({ ...notes, [u._id]: e.target.value })
                      }
                      placeholder="Notes (optional for approval)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      rows={2}
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleReview(u._id, "approved")}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold disabled:opacity-60"
                    >
                      {isApproving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => handleReview(u._id, "rejected")}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold disabled:opacity-60"
                    >
                      {isRejecting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <XCircle size={14} />
                      )}
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}

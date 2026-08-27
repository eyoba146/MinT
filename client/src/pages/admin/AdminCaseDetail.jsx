import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import AppShell from "../../components/AppShell";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/ui/Modal";
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  ShieldOff,
  RefreshCw,
  FileBadge2,
  ClipboardList,
} from "lucide-react";

const DECISIONS = {
  approve: {
    title: "Designate startup",
    label: "Designate",
    color: "bg-teal-600 hover:bg-teal-700",
    icon: CheckCircle,
    needsReason: false,
  },
  reject: {
    title: "Reject application",
    label: "Reject",
    color: "bg-red-600 hover:bg-red-700",
    icon: XCircle,
    needsReason: true,
  },
  suspend: {
    title: "Suspend designation",
    label: "Suspend",
    color: "bg-amber-600 hover:bg-amber-700",
    icon: Ban,
    needsReason: true,
  },
  revoke: {
    title: "Revoke designation",
    label: "Revoke",
    color: "bg-rose-700 hover:bg-rose-800",
    icon: ShieldOff,
    needsReason: true,
  },
  "approve-renewal": {
    title: "Approve renewal",
    label: "Approve renewal",
    color: "bg-teal-600 hover:bg-teal-700",
    icon: RefreshCw,
    needsReason: false,
  },
};

function Info({ label, value }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-medium text-slate-800 break-words">{value}</div>
    </div>
  );
}

function Block({ title, body }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
        {title}
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{body || "—"}</p>
    </div>
  );
}

function DecisionBtn({ type, onClick }) {
  const cfg = DECISIONS[type];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white rounded-xl ${cfg.color}`}
    >
      <Icon size={16} /> {cfg.label}
    </button>
  );
}

function actionLabel(action) {
  if (action === "start_review") return "Under review (staff notes)";
  return (action || "").replace(/_/g, " ");
}

export default function AdminCaseDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queuePath = isAdmin ? "/admin" : "/reviewer";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [modal, setModal] = useState(null);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [startingReview, setStartingReview] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/startups/${id}/case`);
      setData(res.data);
    } catch (err) {
      toast(err.message || "Failed to load case", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitDecision = async () => {
    const cfg = DECISIONS[modal];
    if (!cfg) return;
    if (cfg.needsReason && !reason.trim()) {
      toast("Reason is required", "error");
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/startups/${id}/${modal}`, {
        method: "PATCH",
        body: { reason: reason.trim(), notes: notes.trim() },
      });
      toast(`${cfg.label} completed`, "success");
      setModal(null);
      setReason("");
      setNotes("");
      await load();
    } catch (err) {
      toast(err.message || "Decision failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleStartReview = async () => {
    const text = reviewNotes.trim();
    if (text.length < 10) {
      toast("Write clear review notes (at least 10 characters) for the admin", "error");
      return;
    }
    setStartingReview(true);
    try {
      await apiRequest(`/startups/${id}/start-review`, {
        method: "PATCH",
        body: { notes: text },
      });
      toast("Marked under review — notes saved in audit trail", "success");
      setReviewNotes("");
      await load();
    } catch (err) {
      toast(err.message || "Failed to start review", "error");
    } finally {
      setStartingReview(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Case detail">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  if (!data?.startup) {
    return (
      <AppShell title="Case not found">
        <Link to={queuePath} className="text-teal-700 text-sm font-medium">
          ← Back to queue
        </Link>
      </AppShell>
    );
  }

  const { startup, certificate, auditTrail, eligibility, meta } = data;
  const status = startup.status;

  const latestReviewNote = (auditTrail || []).find(
    (log) => log.action === "start_review" && log.notes
  );

  return (
    <AppShell
      title={startup.companyName}
      subtitle="Designation case file"
      actions={
        <Link
          to={queuePath}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Queue
        </Link>
      }
    >
      {latestReviewNote && isAdmin && (
        <div className="mb-6 p-4 rounded-2xl border border-blue-200 bg-blue-50">
          <div className="text-xs font-semibold uppercase tracking-wide text-blue-800 mb-1">
            Staff reviewer recommendation (read before decide)
          </div>
          <p className="text-sm text-blue-950 whitespace-pre-wrap">{latestReviewNote.notes}</p>
          <p className="text-xs text-blue-700 mt-2">
            By {latestReviewNote.actor?.fullName || "Reviewer"}
            {latestReviewNote.actor?.role ? ` (${latestReviewNote.actor.role})` : ""} ·{" "}
            {new Date(latestReviewNote.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="text-2xl">{startup.logo || "🚀"}</span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{startup.companyName}</h2>
                <p className="text-sm text-slate-500">{startup.oneLineDescription}</p>
              </div>
              <StatusBadge status={status} className="ml-auto" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info label="Sector" value={startup.sector} />
              <Info label="Stage" value={startup.fundingStage} />
              <Info label="Location" value={startup.location} />
              <Info label="Team size" value={startup.teamSize} />
              <Info
                label="Founder"
                value={`${startup.founder?.fullName || "—"} (${startup.founder?.email || "—"})`}
              />
              <Info
                label="Submitted"
                value={
                  startup.submittedAt
                    ? new Date(startup.submittedAt).toLocaleString()
                    : "—"
                }
              />
              <Info
                label="Review due"
                value={
                  startup.reviewDueAt
                    ? `${new Date(startup.reviewDueAt).toLocaleDateString()}${
                        meta?.isOverdue ? " · OVERDUE" : ""
                      }`
                    : "—"
                }
              />
              <Info label="Certificate" value={startup.certificateNumber || "—"} />
            </div>

            <div className="mt-6 space-y-4">
              <Block title="Problem" body={startup.problemStatement} />
              <Block title="Solution" body={startup.solutionStatement} />
              {startup.innovationDescription && (
                <Block title="Innovation" body={startup.innovationDescription} />
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Legal eligibility</h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info
                label="Founder ownership %"
                value={
                  startup.founderOwnershipPercent != null
                    ? `${startup.founderOwnershipPercent}%`
                    : "—"
                }
              />
              <Info label="Public company" value={startup.isPublicCompany ? "Yes" : "No"} />
              <Info
                label="Business license"
                value={startup.hasBusinessLicense ? "Yes" : "No"}
              />
              <Info
                label="Date established"
                value={
                  startup.dateEstablished
                    ? new Date(startup.dateEstablished).toLocaleDateString()
                    : "—"
                }
              />
              <Info
                label="Product ownership declared"
                value={startup.productOwnershipDeclaration ? "Yes" : "No"}
              />
              <Info label="Legal structure" value={startup.legalStructure || "—"} />
            </div>

            {eligibility && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                Server checks:{" "}
                {eligibility.ok ? (
                  <span className="text-teal-700 font-semibold">Eligible</span>
                ) : (
                  <span className="text-red-700 font-semibold">Issues found</span>
                )}
                {eligibility.errors?.length > 0 && (
                  <ul className="mt-2 list-disc pl-4 space-y-1">
                    {eligibility.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Audit trail</h3>
            {!auditTrail?.length ? (
              <p className="text-sm text-slate-500">No decisions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {auditTrail.map((log) => (
                  <div
                    key={log._id}
                    className={`flex gap-3 text-sm border-b border-slate-100 pb-3 last:border-0 ${
                      log.action === "start_review" ? "bg-blue-50/60 -mx-2 px-2 rounded-lg" : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        log.action === "start_review" ? "bg-blue-500" : "bg-teal-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900 capitalize">
                        {actionLabel(log.action)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.actor?.fullName || "System"}
                        {log.actor?.role ? ` (${log.actor.role})` : ""} ·{" "}
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      {log.reason && (
                        <div className="text-xs text-slate-600 mt-1">{log.reason}</div>
                      )}
                      {log.notes && (
                        <div className="mt-2 p-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
                          <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
                            Notes for decision
                          </span>
                          {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-3">
              {isAdmin ? "Decision panel" : "Reviewer actions"}
            </h3>

            {!isAdmin && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Write clear notes for the admin (required). Final designate / reject is
                  Admin only.
                </p>
                {["pending", "submitted", "under_review"].includes(status) && (
                  <>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={5}
                      placeholder="Required: summary of eligibility, risks, recommendation…"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                    />
                    <p className="text-[11px] text-slate-400">
                      {reviewNotes.trim().length}/10 characters minimum
                    </p>
                    <button
                      type="button"
                      disabled={startingReview}
                      onClick={handleStartReview}
                      className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-60"
                    >
                      <ClipboardList size={16} />
                      {startingReview ? "Saving…" : "Mark under review"}
                    </button>
                  </>
                )}
              </div>
            )}

            {isAdmin && (
              <div className="space-y-2">
                {["pending", "submitted", "under_review", "rejected"].includes(status) && (
                  <>
                    <DecisionBtn type="approve" onClick={() => setModal("approve")} />
                    <DecisionBtn type="reject" onClick={() => setModal("reject")} />
                  </>
                )}
                {["verified", "designated"].includes(status) && (
                  <>
                    <DecisionBtn type="suspend" onClick={() => setModal("suspend")} />
                    <DecisionBtn type="revoke" onClick={() => setModal("revoke")} />
                  </>
                )}
                {status === "renewal_due" && (
                  <DecisionBtn
                    type="approve-renewal"
                    onClick={() => setModal("approve-renewal")}
                  />
                )}
                {status === "suspended" && (
                  <DecisionBtn type="revoke" onClick={() => setModal("revoke")} />
                )}
              </div>
            )}
          </div>

          {certificate && (
            <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5">
              <div className="flex items-center gap-2 mb-2 text-teal-900 font-semibold">
                <FileBadge2 size={18} /> Certificate
              </div>
              <div className="text-sm text-teal-900 space-y-1">
                <div>
                  <span className="text-teal-700">No:</span> {certificate.certificateNumber}
                </div>
                <div>
                  <span className="text-teal-700">Issued:</span>{" "}
                  {new Date(certificate.issuedAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="text-teal-700">Expires:</span>{" "}
                  {new Date(certificate.expiresAt).toLocaleDateString()}
                </div>
                <div className="capitalize">
                  <span className="text-teal-700">Status:</span> {certificate.status}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!modal}
        onClose={() => !saving && setModal(null)}
        title={modal ? DECISIONS[modal].title : ""}
        footer={
          <>
            <button
              onClick={() => setModal(null)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={submitDecision}
              disabled={saving}
              className={`px-4 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-60 ${
                modal ? DECISIONS[modal].color : "bg-slate-700"
              }`}
            >
              {saving ? "Saving…" : modal ? DECISIONS[modal].label : "Confirm"}
            </button>
          </>
        }
      >
        {modal && DECISIONS[modal].needsReason && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-slate-600 mb-1">Reason *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </div>
      </Modal>
    </AppShell>
  );
}
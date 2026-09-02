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
  HelpCircle,
  Ban,
  ShieldOff,
  ClipboardList,
  FileText,
  ExternalLink,
  Star,
} from "lucide-react";

const SCORE_LABELS = {
  innovation: "Innovation",
  scalability: "Scalability",
  technology: "Technology Enablement",
  marketImpact: "Market Impact",
  economicValue: "Economic Value",
  overall: "Overall Rating",
};

const SCORE_DESCRIPTIONS = {
  1: "Poor",
  2: "Below Average",
  3: "Average",
  4: "Good",
  5: "Excellent",
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
      <p className="text-sm text-slate-700 whitespace-pre-wrap">
        {body || "—"}
      </p>
    </div>
  );
}

function ScoreInput({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-700">{label}</label>
        <span className="text-xs font-bold text-teal-700">
          {value || "—"} {value ? SCORE_DESCRIPTIONS[value] : ""}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value || 3}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-teal-600"
      />
      <div className="flex justify-between text-[10px] text-slate-400">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
      </div>
    </div>
  );
}

function actionLabel(action) {
  const map = {
    start_review: "Review started",
    request_clarification: "Clarification requested",
    clarification_response: "Founder responded",
    review_needs_clarification: "Reviewer requested clarification",
    designate: "Designated",
    reject: "Rejected",
    suspend: "Suspended",
    revoke: "Revoked",
    create: "Profile created",
    submit: "Submitted for review",
    renew: "Renewal processed",
  };
  return map[action] || (action || "").replace(/_/g, " ");
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
  const [saving, setSaving] = useState(false);

  // Review form state
  const [scores, setScores] = useState({
    innovation: 3,
    scalability: 3,
    technology: 3,
    marketImpact: 3,
    economicValue: 3,
    overall: 3,
  });
  const [rating, setRating] = useState(3);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewOutcome, setReviewOutcome] = useState(null); // 'approved' | 'needs_clarification' | 'rejected'

  // Clarification modal state
  const [clarificationQuestion, setClarificationQuestion] = useState("");
  const [sendingClarification, setSendingClarification] = useState(false);

  // Start review state
  const [startReviewNotes, setStartReviewNotes] = useState("");
  const [startingReview, setStartingReview] = useState(false);

  // Admin action modals (suspend/revoke)
  const [adminReason, setAdminReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

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

  const handleStartReview = async () => {
    const text = startReviewNotes.trim();
    if (text.length < 10) {
      toast("Write clear review notes (at least 10 characters)", "error");
      return;
    }
    setStartingReview(true);
    try {
      await apiRequest(`/startups/${id}/start-review`, {
        method: "PATCH",
        body: { notes: text },
      });
      toast("Marked under review", "success");
      setStartReviewNotes("");
      await load();
    } catch (err) {
      toast(err.message || "Failed to start review", "error");
    } finally {
      setStartingReview(false);
    }
  };

  const handleRequestClarification = async () => {
    const q = clarificationQuestion.trim();
    if (q.length < 10) {
      toast("Question must be at least 10 characters", "error");
      return;
    }
    setSendingClarification(true);
    try {
      await apiRequest(`/startups/${id}/request-clarification`, {
        method: "PATCH",
        body: { question: q },
      });
      toast("Clarification request sent to founder", "success");
      setClarificationQuestion("");
      setModal(null);
      await load();
    } catch (err) {
      toast(err.message || "Failed to send clarification", "error");
    } finally {
      setSendingClarification(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewOutcome) {
      toast(
        "Select an outcome: Designate, Needs Clarification, or Reject",
        "error",
      );
      return;
    }
    if (!reviewNotes.trim()) {
      toast("Review notes are required", "error");
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/startups/${id}/review`, {
        method: "PATCH",
        body: {
          outcome: reviewOutcome,
          rating,
          scores,
          notes: reviewNotes.trim(),
        },
      });
      toast(
        reviewOutcome === "approved"
          ? "Startup designated"
          : reviewOutcome === "needs_clarification"
            ? "Clarification requested"
            : "Startup rejected",
        "success",
      );
      setReviewOutcome(null);
      setReviewNotes("");
      await load();
    } catch (err) {
      toast(err.message || "Review submission failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const submitAdminAction = async (action) => {
    const reason = adminReason.trim();
    if (!reason) {
      toast("Reason is required", "error");
      return;
    }
    setSaving(true);
    try {
      await apiRequest(`/startups/${id}/${action}`, {
        method: "PATCH",
        body: { reason, notes: adminNotes.trim() },
      });
      toast(`${action} completed`, "success");
      setModal(null);
      setAdminReason("");
      setAdminNotes("");
      await load();
    } catch (err) {
      toast(err.message || "Action failed", "error");
    } finally {
      setSaving(false);
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
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN: Case details ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {startup.logo ? (
                <img
                  src={startup.logo}
                  alt="Logo"
                  className="h-12 w-12 object-contain rounded-lg border border-slate-200"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                  No logo
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {startup.companyName}
                </h2>
                <p className="text-sm text-slate-500">{startup.description}</p>
              </div>
              <StatusBadge status={status} className="ml-auto" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <Info
                label="Product/Service/Process"
                value={startup.productServiceType || "—"}
              />
              <Info label="Sector" value={startup.sector} />
              <Info label="Stage" value={startup.fundingStage} />
              <Info
                label="Location"
                value={`${startup.location}, ${startup.country}`}
              />
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
              <Info
                label="Designation ID"
                value={startup.designationId || "—"}
              />
              <Info
                label="Certificate"
                value={startup.certificateNumber || "—"}
              />
            </div>
          </div>

          {/* Article 7: Innovation & Technology */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardList size={16} /> Innovation & Technology (Art. 7)
            </h3>
            <div className="space-y-4">
              <Block title="Problem" body={startup.problemStatement} />
              <Block title="Solution" body={startup.solutionStatement} />
              <Block title="Innovation" body={startup.innovationDescription} />
              <Block
                title="Technology-Enabled"
                body={startup.techEnabledDescription}
              />
              <Block
                title="Scalability"
                body={startup.scalabilityDescription}
              />
              <Block
                title="Market-Changing Nature"
                body={startup.marketChangingDescription}
              />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Economic Value Factors
                </div>
                <div className="flex flex-wrap gap-2">
                  {(startup.economicValueFactors || []).length === 0 ? (
                    <span className="text-sm text-slate-500">—</span>
                  ) : (
                    (startup.economicValueFactors || []).map((f) => (
                      <span
                        key={f}
                        className="px-2 py-1 rounded-lg bg-teal-50 text-teal-800 text-xs font-medium border border-teal-100"
                      >
                        {f.replace(/_/g, " ")}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Legal eligibility */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={16} /> Legal Eligibility (Art. 7)
            </h3>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <Info
                label="Founder ownership %"
                value={
                  startup.founderOwnershipPercent != null
                    ? `${startup.founderOwnershipPercent}%`
                    : "—"
                }
              />
              <Info
                label="Public company"
                value={startup.isPublicCompany ? "Yes" : "No"}
              />
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
                label="Ownership declared"
                value={startup.productOwnershipDeclaration ? "Yes" : "No"}
              />
              <Info
                label="Legal structure"
                value={startup.legalStructure || "—"}
              />
              <Info
                label="Affidavit"
                value={
                  startup.affidavitUrl ? (
                    <a
                      href={startup.affidavitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 hover:underline inline-flex items-center gap-1"
                    >
                      View document <ExternalLink size={12} />
                    </a>
                  ) : (
                    "Not uploaded"
                  )
                }
              />
            </div>

            {eligibility && (
              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                Server checks:{" "}
                {eligibility.ok ? (
                  <span className="text-teal-700 font-semibold">Eligible</span>
                ) : (
                  <span className="text-red-700 font-semibold">
                    Issues found
                  </span>
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

          {/* Audit trail */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900 mb-4">Audit trail</h3>
            {!auditTrail?.length ? (
              <p className="text-sm text-slate-500">
                No decisions recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {auditTrail.map((log) => (
                  <div
                    key={log._id}
                    className={`flex gap-3 text-sm border-b border-slate-100 pb-3 last:border-0 ${
                      log.action === "start_review" ||
                      log.action === "review_needs_clarification"
                        ? "bg-blue-50/60 -mx-2 px-2 rounded-lg"
                        : ""
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                        log.action === "start_review" ||
                        log.action === "review_needs_clarification"
                          ? "bg-blue-500"
                          : log.action === "designate"
                            ? "bg-teal-500"
                            : log.action === "reject"
                              ? "bg-red-500"
                              : "bg-slate-400"
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
                        <div className="text-xs text-slate-600 mt-1">
                          {log.reason}
                        </div>
                      )}
                      {log.notes && (
                        <div className="mt-2 p-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
                          <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
                            Notes
                          </span>
                          {log.notes}
                        </div>
                      )}
                      {log.meta?.scores && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(log.meta.scores).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs"
                            >
                              {SCORE_LABELS[k] || k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Actions ── */}
        <div className="space-y-4">
          {/* Start Review */}
          {["submitted", "clarification_needed"].includes(status) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h3 className="font-semibold text-slate-900 mb-3">
                Begin review
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                Mark this case under review and add initial notes.
              </p>
              <textarea
                value={startReviewNotes}
                onChange={(e) => setStartReviewNotes(e.target.value)}
                rows={4}
                placeholder="Initial observations, eligibility concerns, etc."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm mb-3"
              />
              <button
                type="button"
                disabled={startingReview}
                onClick={handleStartReview}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white rounded-xl bg-slate-800 hover:bg-slate-900 disabled:opacity-60"
              >
                <ClipboardList size={16} />
                {startingReview ? "Saving…" : "Mark under review"}
              </button>
            </div>
          )}

          {/* Evaluation Panel */}
          {status === "under_review" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Star size={16} /> Evaluation & Decision
              </h3>
              <p className="text-xs text-slate-500">
                Score each criterion 1–5. All fields are required before
                submitting a decision.
              </p>

              <div className="space-y-4">
                <ScoreInput
                  label="Innovation"
                  value={scores.innovation}
                  onChange={(v) => setScores((s) => ({ ...s, innovation: v }))}
                />
                <ScoreInput
                  label="Scalability"
                  value={scores.scalability}
                  onChange={(v) => setScores((s) => ({ ...s, scalability: v }))}
                />
                <ScoreInput
                  label="Technology Enablement"
                  value={scores.technology}
                  onChange={(v) => setScores((s) => ({ ...s, technology: v }))}
                />
                <ScoreInput
                  label="Market Impact"
                  value={scores.marketImpact}
                  onChange={(v) =>
                    setScores((s) => ({ ...s, marketImpact: v }))
                  }
                />
                <ScoreInput
                  label="Economic Value"
                  value={scores.economicValue}
                  onChange={(v) =>
                    setScores((s) => ({ ...s, economicValue: v }))
                  }
                />
                <div className="pt-2 border-t border-slate-100">
                  <ScoreInput
                    label="Overall Rating"
                    value={scores.overall}
                    onChange={(v) => setScores((s) => ({ ...s, overall: v }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">
                  Reviewer Rating (1–5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`h-8 w-8 rounded-lg text-sm font-bold ${
                        rating === n
                          ? "bg-teal-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700">
                  Review notes *
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Justification for your decision"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm mt-1"
                />
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setReviewOutcome("approved")}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white rounded-xl ${
                    reviewOutcome === "approved"
                      ? "bg-teal-700 ring-2 ring-teal-300"
                      : "bg-teal-600 hover:bg-teal-700"
                  }`}
                >
                  <CheckCircle size={16} /> Designate startup
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setReviewOutcome("needs_clarification")}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold rounded-xl ${
                    reviewOutcome === "needs_clarification"
                      ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300 border border-amber-300"
                      : "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <HelpCircle size={16} /> Needs clarification
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setReviewOutcome("rejected")}
                  className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white rounded-xl ${
                    reviewOutcome === "rejected"
                      ? "bg-red-700 ring-2 ring-red-300"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  <XCircle size={16} /> Reject application
                </button>
              </div>

              {reviewOutcome && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSubmitReview}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : null}
                    Confirm{" "}
                    {reviewOutcome === "approved"
                      ? "Designation"
                      : reviewOutcome === "needs_clarification"
                        ? "Clarification Request"
                        : "Rejection"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clarification pending */}
          {status === "clarification_needed" && (
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-5">
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <HelpCircle size={16} /> Awaiting Founder Response
              </h3>
              <p className="text-sm text-amber-800">
                A clarification request has been sent. The founder must respond
                before review can continue.
              </p>
              {startup.clarificationRequests?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {startup.clarificationRequests.map((req, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white rounded-xl border border-amber-200 text-sm"
                    >
                      <div className="font-medium text-slate-800">
                        Q: {req.question}
                      </div>
                      {req.response && (
                        <div className="mt-2 text-slate-600">
                          A: {req.response}
                        </div>
                      )}
                      {!req.response && (
                        <div className="mt-1 text-xs text-amber-700">
                          Pending response
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Admin-only: suspend / revoke */}
          {isAdmin && ["designated"].includes(status) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <h3 className="font-semibold text-slate-900 mb-2">
                Admin actions
              </h3>
              <button
                type="button"
                onClick={() => setModal("suspend")}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white rounded-xl bg-amber-600 hover:bg-amber-700"
              >
                <Ban size={16} /> Suspend designation
              </button>
              <button
                type="button"
                onClick={() => setModal("revoke")}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-white rounded-xl bg-rose-700 hover:bg-rose-800"
              >
                <ShieldOff size={16} /> Revoke designation
              </button>
            </div>
          )}

          {/* Certificate */}
          {certificate && (
            <div className="bg-teal-50 rounded-2xl border border-teal-100 p-5">
              <h3 className="font-semibold text-teal-900 mb-2">Certificate</h3>
              <div className="text-sm text-teal-900 space-y-1">
                <div>
                  <span className="text-teal-700">No:</span>{" "}
                  {certificate.certificateNumber}
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
                  <span className="text-teal-700">Status:</span>{" "}
                  {certificate.status}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MODALS ── */}

      {/* Clarification question modal */}
      <Modal
        open={modal === "clarification"}
        onClose={() => !sendingClarification && setModal(null)}
        title="Request clarification from founder"
        footer={
          <>
            <button
              onClick={() => setModal(null)}
              disabled={sendingClarification}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestClarification}
              disabled={sendingClarification}
              className="px-4 py-2 text-sm font-semibold rounded-xl text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60"
            >
              {sendingClarification ? "Sending…" : "Send question"}
            </button>
          </>
        }
      >
        <p className="text-sm text-slate-600 mb-3">
          Ask the founder a specific question. Their response will be recorded
          in the audit trail.
        </p>
        <textarea
          value={clarificationQuestion}
          onChange={(e) => setClarificationQuestion(e.target.value)}
          rows={4}
          placeholder="e.g., Please provide more detail on your technology stack and how it enables scalability..."
          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
        />
      </Modal>

      {/* Admin suspend/revoke modal */}
      <Modal
        open={modal === "suspend" || modal === "revoke"}
        onClose={() => !saving && setModal(null)}
        title={
          modal === "suspend" ? "Suspend designation" : "Revoke designation"
        }
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
              onClick={() => submitAdminAction(modal)}
              disabled={saving}
              className={`px-4 py-2 text-sm font-semibold rounded-xl text-white disabled:opacity-60 ${
                modal === "suspend"
                  ? "bg-amber-600 hover:bg-amber-700"
                  : "bg-rose-700 hover:bg-rose-800"
              }`}
            >
              {saving ? "Saving…" : "Confirm"}
            </button>
          </>
        }
      >
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Reason *
          </label>
          <textarea
            value={adminReason}
            onChange={(e) => setAdminReason(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Notes
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
          />
        </div>
      </Modal>
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StatusBadge from "../../components/StatusBadge";
import { isDesignated } from "../../utils/status";
import {
  FileText,
  Inbox,
  Eye,
  BadgeCheck,
  PlusCircle,
  Loader2,
  AlertCircle,
  Check,
  X,
  Award,
  ArrowRight,
  HelpCircle,
  MessageSquare,
  Clock,
} from "lucide-react";

export default function FounderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startup, setStartup] = useState(null);
  const [requests, setRequests] = useState([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [clarificationResponses, setClarificationResponses] = useState({});
  const [submittingClarification, setSubmittingClarification] = useState(null);

  const fetchData = async () => {
    try {
      const startupRes = await apiRequest("/startups/my");
      setStartup(startupRes.data);

      try {
        const [reqRes, docsRes] = await Promise.all([
          apiRequest("/access-requests/incoming"),
          apiRequest("/documents/my"),
        ]);
        setRequests(reqRes.data || []);
        setDocCount(docsRes.count || docsRes.data?.length || 0);
      } catch {
        setRequests([]);
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes("no startup")) {
        setStartup(null);
      } else {
        toast(err.message || "Failed to load dashboard", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = async (id, action) => {
    setActionLoading(id);
    try {
      await apiRequest(`/access-requests/${id}/${action}`, { method: "PATCH" });
      setRequests((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: action === "approve" ? "approved" : "denied" }
            : r,
        ),
      );
      toast(
        action === "approve" ? "Access approved" : "Access denied",
        "success",
      );
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRenew = async () => {
    try {
      await apiRequest("/startups/my/renew", { method: "POST", body: {} });
      toast("Renewal request submitted", "success");
      await fetchData();
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const handleClarificationResponse = async (clarificationId) => {
    const response = (clarificationResponses[clarificationId] || "").trim();
    if (!response || response.length < 5) {
      toast("Response must be at least 5 characters", "error");
      return;
    }
    setSubmittingClarification(clarificationId);
    try {
      await apiRequest("/startups/my/clarification-response", {
        method: "POST",
        body: { clarificationId, response },
      });
      toast("Response submitted. Case returned to review.", "success");
      setClarificationResponses((prev) => ({ ...prev, [clarificationId]: "" }));
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to submit response", "error");
    } finally {
      setSubmittingClarification(null);
    }
  };

  if (loading) {
    return (
      <AppShell title="Founder workspace">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  if (!startup) {
    return (
      <AppShell
        title="Founder workspace"
        subtitle={`Welcome, ${user?.fullName || "Founder"}`}
      >
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <PlusCircle className="mx-auto text-teal-600 mb-4" size={36} />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Apply for MinT designation
          </h2>
          <p className="text-sm text-slate-600 mb-6">
            Submit your startup under Proclamation No. 1396/2025. After review,
            you receive an official certificate and can manage a secure data
            room for investors.
          </p>
          <Link
            to="/founder/create"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl"
          >
            <PlusCircle size={16} /> Start application
          </Link>
        </div>
      </AppShell>
    );
  }

  const pending = requests.filter((r) => r.status === "pending");
  const unresolvedClarifications =
    startup.clarificationRequests?.filter((c) => !c.resolved) || [];
  const resolvedClarifications =
    startup.clarificationRequests?.filter((c) => c.resolved) || [];

  // Official decision feedback (reasons only — never internal admin notes)
  let decisionBanner = null;
  if (startup.status === "rejected") {
    decisionBanner = {
      title: "Application not approved",
      reason:
        startup.rejectionReason ||
        "Your application did not meet the designation criteria at this time. You may update and resubmit if eligibility allows.",
      className: "bg-red-50 border-red-200 text-red-900",
    };
  } else if (startup.status === "suspended") {
    decisionBanner = {
      title: "Designation suspended",
      reason:
        startup.suspensionReason ||
        "Your designation has been suspended pending further review by MinT.",
      className: "bg-amber-50 border-amber-200 text-amber-900",
    };
  } else if (startup.status === "revoked") {
    decisionBanner = {
      title: "Designation revoked",
      reason:
        startup.revocationReason ||
        "Your designation has been revoked. Contact MinT for further guidance.",
      className: "bg-red-50 border-red-200 text-red-900",
    };
  }

  return (
    <AppShell
      title={startup.companyName || "Founder workspace"}
      subtitle="Designation application and data room"
      actions={
        <Link
          to="/founder/create"
          className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:border-teal-300"
        >
          Edit application
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Decision banners (rejected / suspended / revoked) */}
        {decisionBanner && (
          <div
            className={`p-4 rounded-2xl border flex gap-3 ${decisionBanner.className}`}
            role="alert"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">
                {decisionBanner.title}
              </div>
              <p className="text-sm mt-1 leading-relaxed">
                {decisionBanner.reason}
              </p>
            </div>
          </div>
        )}

        {/* ── CLARIFICATION NEEDED: active requests ── */}
        {startup.status === "clarification_needed" &&
          unresolvedClarifications.length > 0 && (
            <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <HelpCircle
                  className="shrink-0 text-orange-600 mt-0.5"
                  size={22}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-orange-900 text-sm">
                    Clarification required from MinT reviewer
                  </h3>
                  <p className="text-xs text-orange-800 mt-1">
                    Your application is on hold until you respond to the
                    question(s) below. After submission, your case will return
                    to the review queue.
                  </p>

                  <div className="mt-4 space-y-4">
                    {unresolvedClarifications.map((req) => (
                      <div
                        key={req._id}
                        className="bg-white rounded-xl border border-orange-200 p-4"
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare
                            size={14}
                            className="shrink-0 text-orange-500 mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="text-xs text-slate-500 mb-1">
                              Asked{" "}
                              {req.requestedAt
                                ? new Date(req.requestedAt).toLocaleDateString()
                                : "—"}
                            </div>
                            <p className="text-sm text-slate-800 font-medium">
                              {req.question}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Your response *
                          </label>
                          <textarea
                            value={clarificationResponses[req._id] || ""}
                            onChange={(e) =>
                              setClarificationResponses((prev) => ({
                                ...prev,
                                [req._id]: e.target.value,
                              }))
                            }
                            rows={4}
                            placeholder="Provide a clear, detailed answer to the reviewer’s question..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                          />
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400">
                              Min. 5 characters
                            </span>
                            <button
                              type="button"
                              disabled={submittingClarification === req._id}
                              onClick={() =>
                                handleClarificationResponse(req._id)
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-60"
                            >
                              {submittingClarification === req._id ? (
                                <>
                                  <Loader2 size={14} className="animate-spin" />
                                  Submitting…
                                </>
                              ) : (
                                <>
                                  <Check size={14} /> Submit response
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* ── CLARIFICATION NEEDED: fallback when array is empty (backend bug safety) ── */}
        {startup.status === "clarification_needed" &&
          unresolvedClarifications.length === 0 && (
            <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <HelpCircle
                  className="shrink-0 text-orange-600 mt-0.5"
                  size={22}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 text-sm">
                    Clarification required from MinT reviewer
                  </h3>
                  <p className="text-xs text-orange-800 mt-1">
                    Your application is on hold pending additional information.
                    The reviewer’s specific question will appear here once it is
                    recorded.
                  </p>
                  {startup.reviewerNotes && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-orange-200 text-sm text-slate-700">
                      <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-1">
                        Reviewer notes
                      </span>
                      {startup.reviewerNotes}
                    </div>
                  )}
                  <p className="text-xs text-orange-700 mt-3">
                    If you believe this is an error, please contact MinT
                    support.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Main startup info card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-lg font-bold text-slate-900">
                  {startup.companyName}
                </h1>
                <StatusBadge status={startup.status} />
              </div>
              <p className="text-sm text-slate-600 max-w-2xl">
                {startup.oneLineDescription ||
                  startup.description ||
                  "No short description provided."}
              </p>
              {isDesignated(startup.status) && startup.certificateNumber && (
                <p className="text-xs text-teal-800 mt-2 font-medium">
                  Certificate: {startup.certificateNumber}
                  {startup.designationExpiresAt &&
                    ` · Valid until ${new Date(
                      startup.designationExpiresAt,
                    ).toLocaleDateString()}`}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Link
                to="/founder/certificate"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold"
              >
                <Award size={14} /> Certificate
              </Link>
              <Link
                to="/founder/data-room"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold"
              >
                <Inbox size={14} /> Data room
              </Link>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <BadgeCheck size={14} /> Status
            </div>
            <div className="font-semibold text-slate-900 capitalize text-sm">
              {(startup.status || "pending").replace(/_/g, " ")}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <FileText size={14} /> Documents
            </div>
            <div className="font-semibold text-slate-900 text-sm">
              {docCount}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Inbox size={14} /> Pending requests
            </div>
            <div className="font-semibold text-slate-900 text-sm">
              {pending.length}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Eye size={14} /> Total requests
            </div>
            <div className="font-semibold text-slate-900 text-sm">
              {requests.length}
            </div>
          </div>
        </div>

        {/* Designated status banner */}
        {isDesignated(startup.status) && (
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-teal-900">
              Your startup is designated. Investors can request data-room access
              from your public profile.
            </div>
            <button
              type="button"
              onClick={handleRenew}
              className="text-xs font-semibold text-teal-800 underline shrink-0"
            >
              Request renewal
            </button>
          </div>
        )}

        {/* Clarification history (resolved) */}
        {resolvedClarifications.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" /> Clarification
              history
            </h3>
            <div className="space-y-3">
              {resolvedClarifications.map((req) => (
                <div
                  key={req._id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm"
                >
                  <div className="text-xs text-slate-500 mb-1">
                    Asked {new Date(req.requestedAt).toLocaleDateString()} ·
                    Responded{" "}
                    {req.respondedAt
                      ? new Date(req.respondedAt).toLocaleDateString()
                      : "—"}
                  </div>
                  <p className="text-slate-800 font-medium">
                    Q: {req.question}
                  </p>
                  <p className="text-slate-600 mt-1">A: {req.response}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data-room requests + Quick links */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-900 text-sm">
                  Incoming data-room requests
                </h2>
                <p className="text-xs text-slate-500">
                  Approve or deny investor access to your documents
                </p>
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                {pending.length} pending
              </span>
            </div>

            {requests.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="mx-auto text-slate-300 mb-3" size={28} />
                <p className="text-sm font-medium text-slate-700">
                  No access requests yet
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  When investors request access, they will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {requests.map((req) => (
                  <div
                    key={req._id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">
                        {req.investor?.fullName || "Investor"}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {req.investor?.organization || "—"}
                        {req.createdAt &&
                          ` · ${new Date(req.createdAt).toLocaleDateString()}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {req.status === "pending" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAction(req._id, "approve")}
                            disabled={actionLoading === req._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 rounded-lg disabled:opacity-60"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(req._id, "deny")}
                            disabled={actionLoading === req._id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg disabled:opacity-60"
                          >
                            <X size={14} /> Deny
                          </button>
                        </>
                      ) : (
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                            req.status === "approved"
                              ? "bg-emerald-50 text-emerald-800"
                              : "bg-red-50 text-red-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Quick links
            </h3>
            {[
              { to: "/founder/create", label: "Edit application" },
              { to: "/founder/data-room", label: "Manage data room" },
              { to: "/founder/certificate", label: "View certificate" },
              ...(isDesignated(startup.status)
                ? [{ to: `/directory/${startup._id}`, label: "Public profile" }]
                : []),
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-100"
              >
                {item.label}
                <ArrowRight size={14} className="text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

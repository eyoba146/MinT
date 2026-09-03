import { useLocation } from "react-router-dom";
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
  TrendingUp,
  Handshake,
  Landmark,
  Heart,
  FileCheck,
  Upload,
  Calendar,
  DollarSign,
  Building2,
  ChevronRight,
  ShieldCheck,
  Lock,
  Unlock,
  FileDown,
} from "lucide-react";

const STAGE_META = {
  interest_expressed: {
    label: "Interest",
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  data_room_accessed: {
    label: "Data Room",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  meeting_scheduled: {
    label: "Meeting Set",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  due_diligence: {
    label: "Startup Review",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  term_sheet: {
    label: "Deal Proposal",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  investment_executed: {
    label: "Investment Done",
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  grant_disbursed: {
    label: "Grant Received",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  guarantee_issued: {
    label: "Guarantee Issued",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
  closed: {
    label: "Deal Closed",
    color: "text-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
};

function formatCurrency(amount, currency = "ETB") {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString()} ${currency}`;
}

function getStageLabel(status) {
  return STAGE_META[status]?.label || status.replace(/_/g, " ");
}

export default function FounderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [messagesByConnection, setMessagesByConnection] = useState({});
  const [messageInputs, setMessageInputs] = useState({});
  const [messageLoading, setMessageLoading] = useState(null);
  const [showMessages, setShowMessages] = useState(null);

  useEffect(() => {
    setShowMessages(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!showMessages) return;
    const interval = setInterval(async () => {
      try {
        const res = await apiRequest(
          `/startups/connections/${showMessages}/messages`,
        );
        setMessagesByConnection((prev) => ({
          ...prev,
          [showMessages]: res.data || [],
        }));
      } catch (err) {
        console.error("Poll messages error:", err);
      }
    }, 5000); // poll every 5 seconds
    return () => clearInterval(interval);
  }, [showMessages]);
  const [startup, setStartup] = useState(null);
  const [connections, setConnections] = useState([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [clarificationResponses, setClarificationResponses] = useState({});
  const [submittingClarification, setSubmittingClarification] = useState(null);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportUrl, setReportUrl] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const fetchData = async () => {
    try {
      const startupRes = await apiRequest("/startups/my");
      setStartup(startupRes.data);
      const promises = [
        apiRequest("/documents/my").catch(() => ({ count: 0, data: [] })),
      ];
      if (startupRes.data && isDesignated(startupRes.data.status)) {
        promises.push(
          apiRequest("/startups/my/connections").catch(() => ({ data: [] })),
        );
      }
      const [docsRes, connRes] = await Promise.all(promises);
      setDocCount(docsRes.count || docsRes.data?.length || 0);
      if (connRes) setConnections(connRes.data || []);
    } catch (err) {
      if (err.message?.toLowerCase().includes("no startup")) setStartup(null);
      else toast(err.message || "Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  const handleDataRoomAction = async (connectionId, approved) => {
    setActionLoading(connectionId);
    try {
      await apiRequest(`/startups/connections/${connectionId}/data-room`, {
        method: "PATCH",
        body: { approved },
      });
      toast(
        approved ? "Data room access approved" : "Interest declined",
        "success",
      );
      await fetchData();
    } catch (err) {
      toast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleTermSheetAction = async (connectionId, approved) => {
    setActionLoading(connectionId);
    try {
      await apiRequest(`/startups/connections/${connectionId}/term-sheet`, {
        method: "PATCH",
        body: { approved },
      });
      toast(
        approved ? "Term sheet approved" : "Term sheet declined",
        "success",
      );
      await fetchData();
    } catch (err) {
      toast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDealExecutionAction = async (connectionId, approved) => {
    setActionLoading(connectionId);
    try {
      await apiRequest(`/startups/connections/${connectionId}/deal-execution`, {
        method: "PATCH",
        body: { approved },
      });
      toast(
        approved ? "Deal execution confirmed" : "Deal execution declined",
        "success",
      );
      await fetchData();
    } catch (err) {
      toast(err.message || "Action failed", "error");
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

  const handleGenerateDocument = async (connectionId, documentType) => {
    setActionLoading(connectionId);
    try {
      const res = await apiRequest(
        `/startups/connections/${connectionId}/generate-document`,
        {
          method: "POST",
          body: { documentType },
        },
      );
      toast("Document generated successfully", "success");
      // Open the generated PDF in a new tab
      if (res.data?.cloudinaryUrl) {
        window.open(res.data.cloudinaryUrl, "_blank");
      }
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to generate document", "error");
    } finally {
      setActionLoading(null);
    }
  };
  const handleTransferAction = async (connectionId, action) => {
    setActionLoading(connectionId);
    try {
      await apiRequest(
        `/startups/connections/${connectionId}/verify-transfer`,
        {
          method: "POST",
          body: { action },
        },
      );
      toast(
        action === "request"
          ? "Transfer verification requested"
          : action === "approve"
            ? "Transfer approved"
            : "Transfer declined",
        "success",
      );
      await fetchData();
    } catch (err) {
      toast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };
  const toggleMessages = async (connectionId) => {
    if (showMessages === connectionId) {
      setShowMessages(null);
      return;
    }
    setShowMessages(connectionId);
    setMessageLoading(connectionId);
    try {
      const res = await apiRequest(
        `/startups/connections/${connectionId}/messages`,
      );
      setMessagesByConnection((prev) => ({
        ...prev,
        [connectionId]: res.data || [],
      }));
    } catch (err) {
      toast(err.message || "Failed to load messages", "error");
    } finally {
      setMessageLoading(null);
    }
  };

  const handleSendMessage = async (connectionId) => {
    const text = (messageInputs[connectionId] || "").trim();
    if (!text) return;
    try {
      const res = await apiRequest(
        `/startups/connections/${connectionId}/messages`,
        {
          method: "POST",
          body: { text },
        },
      );
      // Optimistically append the new message
      setMessagesByConnection((prev) => ({
        ...prev,
        [connectionId]: [...(prev[connectionId] || []), res.data],
      }));
      setMessageInputs((prev) => ({ ...prev, [connectionId]: "" }));
    } catch (err) {
      toast(err.message || "Failed to send message", "error");
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

  const handleSubmitAnnualReport = async (e) => {
    e.preventDefault();
    if (!reportYear || !reportUrl.trim()) {
      toast("Year and report URL are required", "error");
      return;
    }
    setSubmittingReport(true);
    try {
      await apiRequest("/startups/my/annual-report", {
        method: "POST",
        body: { year: Number(reportYear), reportUrl: reportUrl.trim() },
      });
      toast("Annual report submitted successfully", "success");
      setReportUrl("");
      setReportYear(new Date().getFullYear());
      await fetchData();
    } catch (err) {
      toast(err.message || "Failed to submit annual report", "error");
    } finally {
      setSubmittingReport(false);
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
            Submit your startup under Proclamation No. 1396/2025.
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

  const unresolvedClarifications =
    startup.clarificationRequests?.filter((c) => !c.resolved) || [];
  const resolvedClarifications =
    startup.clarificationRequests?.filter((c) => c.resolved) || [];
  const grants = startup.grantsReceived || [];
  const annualReports = startup.annualReports || [];

  const stageGroups = Object.entries(STAGE_META)
    .map(([key, meta]) => ({
      key,
      ...meta,
      items: connections.filter((c) => c.status === key),
    }))
    .filter((g) => g.items.length > 0);

  let decisionBanner = null;
  if (startup.status === "rejected")
    decisionBanner = {
      title: "Application not approved",
      reason: startup.rejectionReason || "Did not meet criteria.",
      className: "bg-red-50 border-red-200 text-red-900",
    };
  else if (startup.status === "suspended")
    decisionBanner = {
      title: "Designation suspended",
      reason: startup.suspensionReason || "Suspended pending review.",
      className: "bg-amber-50 border-amber-200 text-amber-900",
    };
  else if (startup.status === "revoked")
    decisionBanner = {
      title: "Designation revoked",
      reason: startup.revocationReason || "Revoked.",
      className: "bg-red-50 border-red-200 text-red-900",
    };

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
                  <div className="mt-4 space-y-4">
                    {unresolvedClarifications.map((req) => (
                      <div
                        key={req._id}
                        className="bg-white rounded-xl border border-orange-200 p-4"
                      >
                        <div className="text-xs text-slate-500 mb-1">
                          Asked{" "}
                          {req.requestedAt
                            ? new Date(req.requestedAt).toLocaleDateString()
                            : "—"}
                        </div>
                        <p className="text-sm text-slate-800 font-medium">
                          {req.question}
                        </p>
                        <div className="mt-3">
                          <textarea
                            value={clarificationResponses[req._id] || ""}
                            onChange={(e) =>
                              setClarificationResponses((prev) => ({
                                ...prev,
                                [req._id]: e.target.value,
                              }))
                            }
                            rows={4}
                            placeholder="Provide a clear, detailed answer..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
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
                    Clarification required
                  </h3>
                  <p className="text-xs text-orange-800 mt-1">
                    Your application is on hold. The reviewer&apos;s question
                    will appear here once recorded.
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Startup info card */}
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
                    ` · Valid until ${new Date(startup.designationExpiresAt).toLocaleDateString()}`}
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
              <TrendingUp size={14} /> Pipeline
            </div>
            <div className="font-semibold text-slate-900 text-sm">
              {connections.length} investor{connections.length !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
              <Handshake size={14} /> Pending
            </div>
            <div className="font-semibold text-slate-900 text-sm">
              {
                connections.filter(
                  (c) =>
                    c.status === "interest_expressed" && !c.dataRoomApproved,
                ).length
              }
            </div>
          </div>
        </div>

        {isDesignated(startup.status) && (
          <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm text-teal-900">
              Your startup is designated. Investors can express interest and you
              can track deal progression through the pipeline below.
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

        {/* INVESTOR CONNECTIONS PIPELINE */}
        {isDesignated(startup.status) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" /> Investor Deal
                  Pipeline
                </h2>
                <p className="text-xs text-slate-500">
                  Review incoming interest and approve data room access
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {connections.length} connection
                {connections.length !== 1 ? "s" : ""}
              </span>
            </div>

            {connections.length === 0 ? (
              <div className="py-10 text-center">
                <Handshake className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-sm font-bold text-slate-700">
                  No investor connections yet
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Once investors express interest in your startup, they will
                  appear here with their current deal stage.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {stageGroups.map((group) => (
                  <div key={group.key}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider ${group.color}`}
                      >
                        {group.label}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {group.items.length}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.items.map((conn) => (
                        <div
                          key={conn._id}
                          className={`p-4 rounded-2xl border ${group.border} ${group.bg} hover:shadow-sm transition-all`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-slate-900 truncate">
                                {conn.investor?.fullName || "Investor"}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {conn.investor?.organization || "—"}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize shrink-0 ${group.bg} ${group.color} ${group.border}`}
                            >
                              {getStageLabel(conn.status)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                            {conn.amount != null && (
                              <span className="px-2 py-0.5 rounded-lg bg-white text-slate-700 font-semibold border border-slate-200">
                                {formatCurrency(conn.amount, conn.currency)}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-lg bg-white text-slate-600 font-semibold border border-slate-200 capitalize">
                              {conn.investmentType === "none_yet"
                                ? "Type TBD"
                                : conn.investmentType.replace(/_/g, " ")}
                            </span>
                          </div>
                          {conn.status === "interest_expressed" && (
                            <div className="mt-3 flex items-center gap-2">
                              {!conn.dataRoomApproved ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleDataRoomAction(conn._id, true)
                                    }
                                    disabled={actionLoading === conn._id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg disabled:opacity-60"
                                  >
                                    {actionLoading === conn._id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Unlock className="w-3 h-3" />
                                    )}
                                    Approve Data Room
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDataRoomAction(conn._id, false)
                                    }
                                    disabled={actionLoading === conn._id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-60"
                                  >
                                    <X className="w-3 h-3" /> Decline
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded-lg">
                                  <Check className="w-3 h-3" /> Data room
                                  approved
                                </span>
                              )}
                            </div>
                          )}
                          {conn.status === "term_sheet" && (
                            <div className="mt-3 flex items-center gap-2">
                              {!conn.termSheetApproved ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleTermSheetAction(conn._id, true)
                                    }
                                    disabled={actionLoading === conn._id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-60"
                                  >
                                    {actionLoading === conn._id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    Approve Term Sheet
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleTermSheetAction(conn._id, false)
                                    }
                                    disabled={actionLoading === conn._id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-60"
                                  >
                                    <X className="w-3 h-3" /> Decline
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-1 rounded-lg">
                                  <Check className="w-3 h-3" /> Term sheet
                                  approved
                                </span>
                              )}
                            </div>
                          )}
                          {[
                            "investment_executed",
                            "grant_disbursed",
                            "guarantee_issued",
                          ].includes(conn.status) && (
                            <div className="mt-3 flex items-center gap-2">
                              {!conn.dealExecutionApproved ? (
                                <>
                                  <button
                                    onClick={() =>
                                      handleDealExecutionAction(conn._id, true)
                                    }
                                    disabled={actionLoading === conn._id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-60"
                                  >
                                    {actionLoading === conn._id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3" />
                                    )}
                                    Confirm Deal Execution
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDealExecutionAction(conn._id, false)
                                    }
                                    disabled={actionLoading === conn._id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-60"
                                  >
                                    <X className="w-3 h-3" /> Decline
                                  </button>
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                                  <Check className="w-3 h-3" /> Deal execution
                                  confirmed
                                </span>
                              )}
                            </div>
                          )}
                          {(conn.status === "term_sheet" ||
                            conn.status === "investment_executed" ||
                            conn.status === "grant_disbursed" ||
                            conn.status === "guarantee_issued" ||
                            conn.status === "closed") && (
                            <div className="mt-3 flex items-center gap-2">
                              <button
                                onClick={() =>
                                  handleGenerateDocument(conn._id, "term_sheet")
                                }
                                disabled={actionLoading === conn._id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg disabled:opacity-60"
                              >
                                <FileDown className="w-3 h-3" /> Term Sheet
                              </button>
                              <button
                                onClick={() =>
                                  handleGenerateDocument(
                                    conn._id,
                                    "investment_agreement",
                                  )
                                }
                                disabled={actionLoading === conn._id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg disabled:opacity-60"
                              >
                                <FileDown className="w-3 h-3" /> Agreement
                              </button>
                            </div>
                          )}
                          {[
                            "investment_executed",
                            "grant_disbursed",
                            "guarantee_issued",
                            "closed",
                          ].includes(conn.status) && (
                            <div className="mt-3 space-y-2">
                              {conn.transferVerified ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                                  <Check className="w-3 h-3" /> Transfer
                                  Verified
                                </span>
                              ) : conn.transferRequestedBy ? (
                                <div className="space-y-1">
                                  {conn.transferRequestedBy === user?._id ? (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg">
                                      <Clock className="w-3 h-3" /> Pending
                                      other party approval
                                    </span>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() =>
                                          handleTransferAction(
                                            conn._id,
                                            "approve",
                                          )
                                        }
                                        disabled={actionLoading === conn._id}
                                        className="px-2 py-1 text-[10px] font-bold text-white bg-emerald-600 rounded-lg"
                                      >
                                        Approve Transfer
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleTransferAction(
                                            conn._id,
                                            "decline",
                                          )
                                        }
                                        disabled={actionLoading === conn._id}
                                        className="px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 rounded-lg"
                                      >
                                        Decline
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    handleTransferAction(conn._id, "request")
                                  }
                                  disabled={actionLoading === conn._id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-60"
                                >
                                  <Check className="w-3 h-3" />
                                  Verify Transfer
                                </button>
                              )}
                            </div>
                          )}{" "}
                          <button
                            onClick={() => toggleMessages(conn._id)}
                            className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                          >
                            <MessageSquare className="w-3 h-3" /> Messages
                          </button>
                          <div className="mt-2 text-[11px] text-slate-400">
                            Last activity:{" "}
                            {conn.lastActivityAt
                              ? new Date(
                                  conn.lastActivityAt,
                                ).toLocaleDateString()
                              : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GRANTS */}
        {isDesignated(startup.status) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-emerald-600" /> Grants &
                  Incentives
                </h2>
                <p className="text-xs text-slate-500">
                  Track grant programs and compliance per Art. 23–25
                </p>
              </div>
            </div>
            {grants.length === 0 ? (
              <div className="py-10 text-center">
                <Landmark className="mx-auto text-slate-300 mb-3" size={32} />
                <p className="text-sm font-bold text-slate-700">
                  No grants recorded yet
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {grants.map((g) => (
                  <div
                    key={g._id}
                    className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/40"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {g.grantProgram}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {g.purpose}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 capitalize ${g.status === "disbursed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : g.status === "approved" ? "bg-blue-100 text-blue-800 border-blue-200" : g.status === "report_pending" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}
                      >
                        {g.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-3 text-sm font-black text-slate-900">
                      {formatCurrency(g.amount, "ETB")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANNUAL REPORTS */}
        {isDesignated(startup.status) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600" /> Annual Reports
                  & Compliance
                </h2>
                <p className="text-xs text-slate-500">
                  Submit yearly reports per Art. 12(d)
                </p>
              </div>
            </div>
            <form
              onSubmit={handleSubmitAnnualReport}
              className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200"
            >
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Submit new annual report
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Fiscal Year *
                  </label>
                  <input
                    type="number"
                    value={reportYear}
                    onChange={(e) => setReportYear(e.target.value)}
                    min={2020}
                    max={2030}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Report URL *
                  </label>
                  <input
                    type="url"
                    value={reportUrl}
                    onChange={(e) => setReportUrl(e.target.value)}
                    placeholder="https://..."
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
                >
                  {submittingReport ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
            {annualReports.length === 0 ? (
              <div className="py-8 text-center">
                <FileText className="mx-auto text-slate-300 mb-3" size={28} />
                <p className="text-sm font-bold text-slate-700">
                  No annual reports submitted yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {annualReports
                  .sort((a, b) => b.year - a.year)
                  .map((r) => (
                    <div
                      key={r._id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          <span className="font-bold text-slate-900 text-sm">
                            FY {r.year}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${r.status === "reviewed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : r.status === "flagged" ? "bg-red-100 text-red-800 border-red-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Submitted{" "}
                          {r.submittedAt
                            ? new Date(r.submittedAt).toLocaleDateString()
                            : "—"}
                          {r.notes && ` · ${r.notes}`}
                        </div>
                      </div>
                      {r.reportUrl && (
                        <a
                          href={r.reportUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100"
                        >
                          <Eye size={12} /> View
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

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

        {/* Quick links only — removed obsolete legacy access requests section */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
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
      {/* Full-screen Chat Modal */}
      {showMessages && (
        <div className="fixed inset-0 lg:left-72 z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Messages
              </h3>
              <p className="text-xs text-slate-500">
                {startup.companyName} —{" "}
                {connections.find((c) => c._id === showMessages)?.investor
                  ?.fullName || "Investor"}
              </p>
            </div>
            <button
              onClick={() => setShowMessages(null)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 bg-slate-50">
            {messageLoading === showMessages ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto mt-10" />
            ) : (messagesByConnection[showMessages] || []).length === 0 ? (
              <div className="text-center text-sm text-slate-400 mt-10">
                No messages yet. Start the conversation.
              </div>
            ) : (
              (messagesByConnection[showMessages] || []).map((msg, idx) => {
                const currentUserId = String(
                  user?._id || user?.id || user?.userId,
                );
                const senderId = String(
                  msg.sender?._id || msg.sender?.id || msg.sender,
                );
                const isOwn = currentUserId === senderId;
                const senderName = isOwn
                  ? "You"
                  : msg.sender?.fullName || "Other Party";
                const initial = senderName.charAt(0).toUpperCase();
                return (
                  <div key={msg._id || idx} className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${
                        isOwn
                          ? "bg-gradient-to-br from-teal-500 to-emerald-600 text-white"
                          : "bg-gradient-to-br from-slate-400 to-slate-500 text-white"
                      }`}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span
                          className={`text-[13px] font-semibold ${
                            isOwn ? "text-teal-800" : "text-slate-700"
                          }`}
                        >
                          {senderName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div
                        className={`inline-block max-w-full px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? "bg-white border border-teal-100 text-slate-800 break-words"
                            : "bg-slate-100/80 text-slate-700 break-words"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4 bg-white">
            <div className="flex items-center gap-2 sm:gap-3">
              <input
                type="text"
                value={messageInputs[showMessages] || ""}
                onChange={(e) =>
                  setMessageInputs((prev) => ({
                    ...prev,
                    [showMessages]: e.target.value,
                  }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(showMessages);
                  }
                }}
                placeholder="Type your message... (Enter to send)"
                className="flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <button
                onClick={() => handleSendMessage(showMessages)}
                disabled={messageLoading === showMessages}
                className="shrink-0 px-3 sm:px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold disabled:opacity-60"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StartupCard from "../../components/StartupCard";
import {
  Search,
  Send,
  CheckCircle,
  Clock,
  Loader2,
  Inbox,
  Briefcase,
  Building2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Heart,
  X,
  ChevronRight,
  FileText,
  MessageSquare,
  Calendar,
  Scale,
  Handshake,
  Landmark,
  Ban,
  ArrowUpRight,
  Edit3,
  FileDown,
} from "lucide-react";

// Pipeline stage definitions (aligned with investorConnectionSchema enum)
const PIPELINE_STAGES = [
  {
    key: "interest_expressed",
    label: "Interest",
    icon: Heart,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
  {
    key: "data_room_accessed",
    label: "Data Room",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  {
    key: "meeting_scheduled",
    label: "Meeting Set",
    icon: Calendar,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  {
    key: "due_diligence",
    label: "Startup Review",
    icon: Scale,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  {
    key: "term_sheet",
    label: "Deal Proposal",
    icon: MessageSquare,
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  {
    key: "investment_executed",
    label: "Investment Done",
    icon: Handshake,
    color: "text-teal-600",
    bg: "bg-teal-50",
    border: "border-teal-200",
  },
  {
    key: "grant_disbursed",
    label: "Grant Received",
    icon: Landmark,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  {
    key: "guarantee_issued",
    label: "Guarantee Issued",
    icon: ShieldCheck,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
  },
  {
    key: "closed",
    label: "Deal Closed",
    icon: Ban,
    color: "text-slate-400",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
];

function formatCurrency(amount, currency = "ETB") {
  if (amount == null) return null;
  return `${Number(amount).toLocaleString()} ${currency}`;
}

function getStageLabel(status) {
  const stage = PIPELINE_STAGES.find((s) => s.key === status);
  return stage?.label || status.replace(/_/g, " ");
}

function connectionStatusBadge(status) {
  const map = {
    interest_expressed: "bg-slate-100 text-slate-700 border-slate-200",
    data_room_accessed: "bg-blue-100 text-blue-700 border-blue-200",
    meeting_scheduled: "bg-purple-100 text-purple-700 border-purple-200",
    due_diligence: "bg-amber-100 text-amber-700 border-amber-200",
    term_sheet: "bg-indigo-100 text-indigo-700 border-indigo-200",
    investment_executed: "bg-teal-100 text-teal-700 border-teal-200",
    grant_disbursed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    guarantee_issued: "bg-cyan-100 text-cyan-700 border-cyan-200",
    closed: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return map[status] || "bg-slate-100 text-slate-600 border-slate-200";
}

export default function InvestorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  // Express interest modal
  const [expressModal, setExpressModal] = useState(null);
  const [expressLoading, setExpressLoading] = useState(false);
  const [expressForm, setExpressForm] = useState({
    message: "",
    investmentType: "none_yet",
    amount: "",
    currency: "ETB",
  });

  // Stage advance modal
  const [stageModal, setStageModal] = useState(null);
  const [stageLoading, setStageLoading] = useState(false);
  const [stageNotes, setStageNotes] = useState("");

  // Edit details modal
  const [detailModal, setDetailModal] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailForm, setDetailForm] = useState({
    investmentType: "none_yet",
    amount: "",
    currency: "ETB",
    notes: "",
  });
  const [transferLoading, setTransferLoading] = useState(null);
  const [messagesByConnection, setMessagesByConnection] = useState({});
  const [messageInputs, setMessageInputs] = useState({});
  const [messageLoading, setMessageLoading] = useState(null);
  const [showMessages, setShowMessages] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connRes, startupsRes] = await Promise.all([
          apiRequest("/startups/investor/connections"),
          apiRequest("/startups"),
        ]);
        setConnections(connRes.data || []);
        setRecommended((startupsRes.data || []).slice(0, 6));
      } catch (err) {
        console.error(err);
        toast(err.message || "Failed to load investor hub", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExpressInterest = async () => {
    if (!expressModal) return;
    const startupId = expressModal._id || expressModal.id;
    if (!startupId) {
      toast("Invalid startup", "error");
      return;
    }
    setExpressLoading(true);
    try {
      await apiRequest(`/startups/${startupId}/express-interest`, {
        method: "POST",
        body: {
          message:
            expressForm.message.trim() ||
            "Interested in exploring investment opportunity",
          investmentType: expressForm.investmentType,
          amount: expressForm.amount ? Number(expressForm.amount) : null,
          currency: expressForm.currency,
        },
      });
      toast("Interest expressed. Founder will be notified.", "success");
      setExpressModal(null);
      setExpressForm({
        message: "",
        investmentType: "none_yet",
        amount: "",
        currency: "ETB",
      });
      const connRes = await apiRequest("/startups/investor/connections");
      setConnections(connRes.data || []);
    } catch (err) {
      toast(err.message || "Failed to express interest", "error");
    } finally {
      setExpressLoading(false);
    }
  };

  const handleAdvanceStage = async () => {
    if (!stageModal) return;
    setStageLoading(true);
    try {
      await apiRequest(
        `/startups/connections/${stageModal.connection._id}/stage`,
        {
          method: "PATCH",
          body: { stage: stageModal.nextStage, notes: stageNotes.trim() },
        },
      );
      toast(`Advanced to ${getStageLabel(stageModal.nextStage)}`, "success");
      setStageModal(null);
      setStageNotes("");
      const connRes = await apiRequest("/startups/investor/connections");
      setConnections(connRes.data || []);
    } catch (err) {
      toast(err.message || "Failed to update stage", "error");
    } finally {
      setStageLoading(false);
    }
  };

  const handleUpdateDetails = async () => {
    if (!detailModal) return;
    setDetailLoading(true);
    try {
      await apiRequest(`/startups/connections/${detailModal.connection._id}`, {
        method: "PATCH",
        body: {
          investmentType: detailForm.investmentType,
          amount: detailForm.amount ? Number(detailForm.amount) : null,
          currency: detailForm.currency,
          notes: detailForm.notes.trim(),
        },
      });
      toast("Connection details updated", "success");
      setDetailModal(null);
      const connRes = await apiRequest("/startups/investor/connections");
      setConnections(connRes.data || []);
    } catch (err) {
      toast(err.message || "Failed to update details", "error");
    } finally {
      setDetailLoading(false);
    }
  };
  const handleGenerateDocument = async (connectionId, documentType) => {
    try {
      const res = await apiRequest(
        `/startups/connections/${connectionId}/generate-document`,
        {
          method: "POST",
          body: { documentType },
        },
      );
      toast("Document generated successfully", "success");
      if (res.data?.cloudinaryUrl) {
        window.open(res.data.cloudinaryUrl, "_blank");
      }
      const connRes = await apiRequest("/startups/investor/connections");
      setConnections(connRes.data || []);
    } catch (err) {
      toast(err.message || "Failed to generate document", "error");
    }
  };
  const handleTransferAction = async (connectionId, action) => {
    setTransferLoading(connectionId);
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
      const connRes = await apiRequest("/startups/investor/connections");
      setConnections(connRes.data || []);
    } catch (err) {
      toast(err.message || "Action failed", "error");
    } finally {
      setTransferLoading(null);
    }
  };
  const toggleMessages = async (connectionId) => {
    if (showMessages === connectionId) {
      setShowMessages(null);
      return;
    }
    setShowMessages(connectionId);
    if (!messagesByConnection[connectionId]) {
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
    }
  };

  const handleSendMessage = async (connectionId) => {
    const text = (messageInputs[connectionId] || "").trim();
    if (!text) return;
    setMessageLoading(connectionId);
    try {
      await apiRequest(`/startups/connections/${connectionId}/messages`, {
        method: "POST",
        body: { text },
      });
      setMessageInputs((prev) => ({ ...prev, [connectionId]: "" }));
      const res = await apiRequest(
        `/startups/connections/${connectionId}/messages`,
      );
      setMessagesByConnection((prev) => ({
        ...prev,
        [connectionId]: res.data || [],
      }));
      toast("Message sent", "success");
    } catch (err) {
      toast(err.message || "Failed to send message", "error");
    } finally {
      setMessageLoading(null);
    }
  };
  const openStageModal = (connection, nextStage) => {
    setStageModal({ connection, nextStage });
    setStageNotes("");
  };

  const openDetailModal = (connection) => {
    setDetailModal({ connection });
    setDetailForm({
      investmentType: connection.investmentType || "none_yet",
      amount: connection.amount || "",
      currency: connection.currency || "ETB",
      notes: "",
    });
  };

  const getNextStage = (currentStage) => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.key === currentStage);
    if (idx === -1 || idx >= PIPELINE_STAGES.length - 1) return null;
    return PIPELINE_STAGES[idx + 1].key;
  };

  // Metrics derived from real connections
  const totalConnections = connections.length;
  const activeConnections = connections.filter(
    (c) => c.status !== "closed",
  ).length;
  const closedConnections = connections.filter(
    (c) => c.status === "closed",
  ).length;
  const dataRoomCount = connections.filter((c) =>
    [
      "data_room_accessed",
      "meeting_scheduled",
      "due_diligence",
      "term_sheet",
      "investment_executed",
      "grant_disbursed",
      "guarantee_issued",
      "closed",
    ].includes(c.status),
  ).length;

  // Group connections by stage for the pipeline view
  const stageGroups = PIPELINE_STAGES.map((stage) => ({
    ...stage,
    items: connections.filter((c) => c.status === stage.key),
  })).filter((g) => g.items.length > 0);

  if (loading) {
    return (
      <AppShell title="Investor Deal Pipeline">
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <p className="text-xs font-semibold text-slate-500">
            Loading investor deal pipeline…
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Investor Deal Pipeline"
      subtitle={`Welcome, ${user?.fullName || "Accredited Investor"} · Sovereign Deal Rooms & Portfolios`}
      actions={
        <Link
          to="/investor/directory"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all"
        >
          <Search size={14} />
          <span>Browse Registry</span>
        </Link>
      }
    >
      <div className="space-y-8">
        {/* Sovereign Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-blue-900/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-400/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Accredited Sovereign Deal Flow</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Ethiopian Venture Pipeline
              </h1>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Connect directly with officially designated startups, request
                secure data room access for financial audits, and deploy capital
                under statutory protections.
              </p>
            </div>

            <Link
              to="/investor/directory"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-teal-900/40 shrink-0 transition-transform hover:scale-105"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Explore Startups</span>
            </Link>
          </div>
        </div>

        {/* Colorful Metric Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500/10 via-white to-blue-50 rounded-3xl border border-blue-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Total
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {totalConnections}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Pipeline Connections
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50 rounded-3xl border border-emerald-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Active
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {activeConnections}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Active Engagements
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50 rounded-3xl border border-amber-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Unlocked
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {dataRoomCount}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Data Room Access+
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/10 via-white to-purple-50 rounded-3xl border border-purple-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                Criteria
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {user?.focus?.length || 0}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-0.5">
              Target Focus Sectors
            </div>
          </div>
        </div>

        {/* ── INVESTMENT PIPELINE ── */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                My Investment Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Structured deal flow from interest expression to capital
                deployment
              </p>
            </div>
            <Link
              to="/investor/directory"
              className="text-xs font-bold text-teal-800 hover:underline"
            >
              Browse Startups →
            </Link>
          </div>

          {connections.length === 0 ? (
            <div className="py-12 text-center">
              <Heart className="mx-auto text-slate-300 mb-3" size={32} />
              <p className="text-sm font-bold text-slate-700">
                No active pipeline engagements
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Browse the designated startup registry and express interest to
                begin your deal flow.
              </p>
              <Link
                to="/investor/directory"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-700"
              >
                <Search className="w-3.5 h-3.5" /> Explore Registry
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {stageGroups.map((group) => {
                const StageIcon = group.icon;
                return (
                  <div key={group.key}>
                    <div className="flex items-center gap-2 mb-3">
                      <StageIcon className={`w-4 h-4 ${group.color}`} />
                      <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {group.label}
                      </h3>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {group.items.length}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.items.map((conn) => {
                        const nextStage = getNextStage(conn.status);
                        return (
                          <div
                            key={conn._id}
                            className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <Link
                                  to={`/investor/directory/${conn.startup?._id}`}
                                  className="text-sm font-bold text-slate-900 hover:text-teal-800 truncate block"
                                >
                                  {conn.startup?.companyName || "Startup"}
                                </Link>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {conn.startup?.sector || "—"} ·{" "}
                                  {conn.lastActivityAt
                                    ? new Date(
                                        conn.lastActivityAt,
                                      ).toLocaleDateString()
                                    : "—"}
                                </div>
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize shrink-0 ${connectionStatusBadge(conn.status)}`}
                              >
                                {getStageLabel(conn.status)}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                              {formatCurrency(conn.amount, conn.currency) && (
                                <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                                  {formatCurrency(conn.amount, conn.currency)}
                                </span>
                              )}
                              <span className="px-2 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-semibold border border-teal-100 capitalize">
                                {conn.investmentType === "none_yet"
                                  ? "Type TBD"
                                  : conn.investmentType.replace(/_/g, " ")}
                              </span>
                            </div>
                            {conn.status === "term_sheet" &&
                              !conn.termSheetApproved && (
                                <div className="mt-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Awaiting founder approval of term sheet
                                </div>
                              )}

                            {[
                              "investment_executed",
                              "grant_disbursed",
                              "guarantee_issued",
                            ].includes(conn.status) &&
                              !conn.dealExecutionApproved && (
                                <div className="mt-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Awaiting founder confirmation of deal
                                  execution
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
                                    handleGenerateDocument(
                                      conn._id,
                                      "term_sheet",
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg"
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
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-white bg-slate-700 hover:bg-slate-800 rounded-lg"
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
                                    <CheckCircle className="w-3 h-3" /> Transfer
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
                                          disabled={
                                            transferLoading === conn._id
                                          }
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
                                          disabled={
                                            transferLoading === conn._id
                                          }
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
                                    disabled={transferLoading === conn._id}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-60"
                                  >
                                    <CheckCircle className="w-3 h-3" />
                                    Verify Transfer
                                  </button>
                                )}
                              </div>
                            )}
                            <button
                              onClick={() => toggleMessages(conn._id)}
                              className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                            >
                              <MessageSquare className="w-3 h-3" /> Messages
                            </button>

                            {showMessages === conn._id && (
                              <div className="mt-3 bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                                {messageLoading === conn._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                ) : (messagesByConnection[conn._id] || [])
                                    .length === 0 ? (
                                  <p className="text-xs text-slate-500 text-center">
                                    No messages yet
                                  </p>
                                ) : (
                                  <div className="max-h-40 overflow-y-auto space-y-2">
                                    {(messagesByConnection[conn._id] || []).map(
                                      (msg, idx) => (
                                        <div
                                          key={msg._id || idx}
                                          className="text-xs"
                                        >
                                          <div className="font-semibold text-slate-800">
                                            {msg.sender?.fullName || "User"}
                                          </div>
                                          <p className="text-slate-600">
                                            {msg.text}
                                          </p>
                                          <span className="text-[10px] text-slate-400">
                                            {new Date(
                                              msg.createdAt,
                                            ).toLocaleString()}
                                          </span>
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={messageInputs[conn._id] || ""}
                                    onChange={(e) =>
                                      setMessageInputs((prev) => ({
                                        ...prev,
                                        [conn._id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Type a message..."
                                    className="flex-1 px-2 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                                  />
                                  <button
                                    onClick={() => handleSendMessage(conn._id)}
                                    disabled={messageLoading === conn._id}
                                    className="px-2 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold"
                                  >
                                    Send
                                  </button>
                                </div>
                              </div>
                            )}
                            <div className="mt-3 flex items-center gap-2">
                              <Link
                                to={`/investor/directory/${conn.startup?._id}`}
                                className="text-[11px] font-bold text-teal-800 hover:underline flex items-center gap-1"
                              >
                                View startup{" "}
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                              {conn.status !== "closed" && (
                                <div className="ml-auto flex items-center gap-1">
                                  <button
                                    onClick={() => openDetailModal(conn)}
                                    className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500"
                                    title="Edit details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {nextStage &&
                                    (() => {
                                      const blocked =
                                        (conn.status === "term_sheet" &&
                                          !conn.termSheetApproved) ||
                                        ([
                                          "investment_executed",
                                          "grant_disbursed",
                                          "guarantee_issued",
                                        ].includes(conn.status) &&
                                          !conn.dealExecutionApproved);
                                      return (
                                        <button
                                          onClick={() =>
                                            openStageModal(conn, nextStage)
                                          }
                                          disabled={blocked}
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                                            blocked
                                              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                              : "bg-teal-600 hover:bg-teal-700 text-white"
                                          }`}
                                        >
                                          <ArrowUpRight className="w-3 h-3" />
                                          {
                                            PIPELINE_STAGES.find(
                                              (s) => s.key === nextStage,
                                            )?.label
                                          }
                                        </button>
                                      );
                                    })()}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity & Quick Profile */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Recent Activity
                </h2>
                <p className="text-xs text-slate-500">
                  Latest updates across your deal pipeline
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {connections.length === 0 ? (
                <div className="py-12 text-center">
                  <Inbox className="mx-auto text-slate-300 mb-3" size={32} />
                  <p className="text-sm font-bold text-slate-700">
                    No activity yet
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Your deal activity will appear here once you express
                    interest in startups.
                  </p>
                </div>
              ) : (
                connections
                  .slice(0, 8)
                  .sort(
                    (a, b) =>
                      new Date(b.lastActivityAt) - new Date(a.lastActivityAt),
                  )
                  .map((conn) => (
                    <div
                      key={conn._id}
                      className="py-4 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">
                          {conn.startup?.companyName || "Startup"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>
                            Stage:{" "}
                            <strong className="text-slate-700 capitalize">
                              {getStageLabel(conn.status)}
                            </strong>
                          </span>
                          <span>·</span>
                          <span>
                            {conn.lastActivityAt
                              ? new Date(
                                  conn.lastActivityAt,
                                ).toLocaleDateString()
                              : "—"}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 text-xs font-bold rounded-full capitalize shrink-0 border ${connectionStatusBadge(conn.status)}`}
                      >
                        {getStageLabel(conn.status)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Quick Profile & Navigation Card */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Investor Profile
              </h3>
              <div className="text-xs space-y-2 text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <p>
                  <span className="text-slate-400 font-bold">
                    Organization:
                  </span>{" "}
                  <strong>{user?.organization || "Not Specified"}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-bold">
                    Ticket Range:
                  </span>{" "}
                  <strong>{user?.investmentRange || "Not Specified"}</strong>
                </p>
                <p>
                  <span className="text-slate-400 font-bold">Focus:</span>{" "}
                  <strong>
                    {user?.focus?.length
                      ? user.focus.join(", ")
                      : "All Sectors"}
                  </strong>
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs font-bold">
                <Link
                  to="/investor/opportunities"
                  className="flex items-center justify-between p-3 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 transition-colors"
                >
                  <span>Post Call / Investment Mandate</span>
                  <Briefcase className="w-4 h-4 text-teal-600" />
                </Link>
                <Link
                  to="/investor/browse-opportunities"
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 transition-colors"
                >
                  <span>Browse National Calls</span>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Designated Startups Section */}
        {recommended.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Featured Designated Startups
                </h2>
                <p className="text-xs text-slate-500">
                  Statutorily audited entities eligible for investment
                  incentives
                </p>
              </div>
              <Link
                to="/investor/directory"
                className="text-xs font-bold text-teal-800 hover:underline"
              >
                View Full Registry →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommended.map((s) => (
                <StartupCard
                  key={s._id || s.id}
                  startup={s}
                  to={`/investor/directory/${s._id || s.id}`}
                  onExpressInterest={setExpressModal}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── EXPRESS INTEREST MODAL ── */}
      {expressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Express Interest
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {expressModal.companyName || "Startup"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setExpressModal(null);
                  setExpressForm({
                    message: "",
                    investmentType: "none_yet",
                    amount: "",
                    currency: "ETB",
                  });
                }}
                disabled={expressLoading}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Message to founder
                </label>
                <textarea
                  value={expressForm.message}
                  onChange={(e) =>
                    setExpressForm((f) => ({
                      ...f,
                      message: e.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Briefly describe your investment thesis and why this startup aligns with your mandate..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Investment Type
                  </label>
                  <select
                    value={expressForm.investmentType}
                    onChange={(e) =>
                      setExpressForm((f) => ({
                        ...f,
                        investmentType: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                  >
                    {INVESTMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={expressForm.currency}
                    onChange={(e) =>
                      setExpressForm((f) => ({
                        ...f,
                        currency: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Proposed Amount
                </label>
                <input
                  type="number"
                  value={expressForm.amount}
                  onChange={(e) =>
                    setExpressForm((f) => ({
                      ...f,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="e.g. 500000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <strong>Note:</strong> This expresses your interest and creates
                a formal connection record. The founder will be notified and can
                review your profile.
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setExpressModal(null);
                  setExpressForm({
                    message: "",
                    investmentType: "none_yet",
                    amount: "",
                    currency: "ETB",
                  });
                }}
                disabled={expressLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExpressInterest}
                disabled={expressLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60"
              >
                {expressLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Heart className="w-3.5 h-3.5" />
                    Express Interest
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE ADVANCE MODAL ── */}
      {stageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Advance Deal Stage
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stageModal.connection.startup?.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStageModal(null);
                  setStageNotes("");
                }}
                disabled={stageLoading}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs text-slate-500">Current:</span>
                <span className="text-xs font-bold text-slate-700 capitalize">
                  {getStageLabel(stageModal.connection.status)}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-xs font-bold text-teal-700 capitalize">
                  {getStageLabel(stageModal.nextStage)}
                </span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Notes (optional)
                </label>
                <textarea
                  value={stageNotes}
                  onChange={(e) => setStageNotes(e.target.value)}
                  rows={3}
                  placeholder="Add context about this stage transition..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setStageModal(null);
                  setStageNotes("");
                }}
                disabled={stageLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdvanceStage}
                disabled={stageLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60"
              >
                {stageLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Advance to{" "}
                    {
                      PIPELINE_STAGES.find(
                        (s) => s.key === stageModal.nextStage,
                      )?.label
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT DETAILS MODAL ── */}
      {detailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Connection Details
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {detailModal.connection.startup?.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                disabled={detailLoading}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Investment Type
                  </label>
                  <select
                    value={detailForm.investmentType}
                    onChange={(e) =>
                      setDetailForm((f) => ({
                        ...f,
                        investmentType: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                  >
                    {INVESTMENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={detailForm.currency}
                    onChange={(e) =>
                      setDetailForm((f) => ({
                        ...f,
                        currency: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                  >
                    <option value="ETB">ETB</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  value={detailForm.amount}
                  onChange={(e) =>
                    setDetailForm((f) => ({
                      ...f,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="e.g. 1000000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={detailForm.notes}
                  onChange={(e) =>
                    setDetailForm((f) => ({
                      ...f,
                      notes: e.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Add notes about this deal..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                disabled={detailLoading}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateDetails}
                disabled={detailLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-60"
              >
                {detailLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    Save Details
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

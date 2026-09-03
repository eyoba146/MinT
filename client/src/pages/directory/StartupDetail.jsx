import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useDesignation } from "../../context/DesignationContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import CertificateView from "../../components/common/CertificateView";
import { isDesignated } from "../../utils/status";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  Users,
  Globe,
  Send,
  Download,
  FileText,
  CheckCircle,
  Award,
  ShieldCheck,
  Building2,
  Lock,
  Heart,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Clock,
} from "lucide-react";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const INVESTMENT_TYPES = [
  { value: "none_yet", label: "Not yet determined" },
  { value: "equity", label: "Equity" },
  { value: "grant", label: "Grant" },
  { value: "convertible_note", label: "Convertible Note" },
  { value: "venture_debt", label: "Venture Debt" },
  { value: "credit_guarantee", label: "Credit Guarantee" },
];

const STAGE_LABELS = {
  interest_expressed: "Interest Expressed",
  data_room_accessed: "Data Room Accessed",
  meeting_scheduled: "Meeting Scheduled",
  due_diligence: "Due Diligence",
  term_sheet: "Term Sheet",
  investment_executed: "Investment Executed",
  grant_disbursed: "Grant Disbursed",
  guarantee_issued: "Guarantee Issued",
  closed: "Closed",
};

const STAGE_ORDER = [
  "interest_expressed",
  "data_room_accessed",
  "meeting_scheduled",
  "due_diligence",
  "term_sheet",
  "investment_executed",
  "grant_disbursed",
  "guarantee_issued",
  "closed",
];

export default function StartupDetail({ embedded = false }) {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { applications } = useDesignation();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  const [myConnection, setMyConnection] = useState(null);
  const [connectionLoading, setConnectionLoading] = useState(false);

  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [interestModalOpen, setInterestModalOpen] = useState(false);
  const [interestForm, setInterestForm] = useState({
    message: "",
    investmentType: "none_yet",
    amount: "",
    currency: "ETB",
  });
  const [interestSubmitting, setInterestSubmitting] = useState(false);

  const [showCertModal, setShowCertModal] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const backPath =
    embedded && user?.role === "investor"
      ? "/investor/directory"
      : embedded && user?.role === "citizen"
        ? "/citizen/directory"
        : "/directory";

  const loadConnection = async () => {
    if (!isAuthenticated || user?.role !== "investor") return;
    setConnectionLoading(true);
    try {
      const res = await apiRequest("/startups/investor/connections");
      const connections = res.data || [];
      const match = connections.find(
        (c) =>
          c.startup?._id === id ||
          c.startup === id ||
          String(c.startup?._id || c.startup) === String(id),
      );
      setMyConnection(match || null);
    } catch {
      setMyConnection(null);
    } finally {
      setConnectionLoading(false);
    }
  };

  const loadDocs = async () => {
    if (!isAuthenticated || user?.role !== "investor") return;
    setDocsLoading(true);
    try {
      const docsRes = await apiRequest(`/documents/startup/${id}`);
      setDocs(docsRes.data || []);
    } catch {
      setDocs([]);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest(`/startups/${id}`);
        if (res.data) {
          setStartup(res.data);
        } else {
          const fallback = applications.find(
            (a) => a.id === id || a._id === id,
          );
          setStartup(fallback || null);
        }
      } catch {
        const fallback = applications.find((a) => a.id === id || a._id === id);
        setStartup(fallback || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, applications]);

  useEffect(() => {
    setLogoError(false);
  }, [startup?.logo]);

  useEffect(() => {
    if (startup && isAuthenticated && user?.role === "investor") {
      loadConnection();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startup, isAuthenticated, user?.role, id]);

  // Load docs when connection reaches data_room_accessed or higher
  useEffect(() => {
    if (myConnection && canViewDataRoom(myConnection.status)) {
      loadDocs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myConnection?.status]);

  const canViewDataRoom = (status) => {
    return [
      "data_room_accessed",
      "meeting_scheduled",
      "due_diligence",
      "term_sheet",
      "investment_executed",
      "grant_disbursed",
      "guarantee_issued",
      "closed",
    ].includes(status);
  };

  const expressInterest = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || user?.role !== "investor") {
      toast("Sign in as an investor to express interest", "info");
      return;
    }
    setInterestSubmitting(true);
    try {
      const body = {
        message: interestForm.message,
        investmentType: interestForm.investmentType,
        currency: interestForm.currency,
      };
      if (interestForm.amount && !isNaN(Number(interestForm.amount))) {
        body.amount = Number(interestForm.amount);
      }

      await apiRequest(`/startups/${id}/express-interest`, {
        method: "POST",
        body,
      });

      toast(
        "Interest expressed successfully. The founder has been notified.",
        "success",
      );
      setInterestModalOpen(false);
      setInterestForm({
        message: "",
        investmentType: "none_yet",
        amount: "",
        currency: "ETB",
      });
      await loadConnection();
    } catch (err) {
      toast(err.message || "Failed to express interest", "error");
    } finally {
      setInterestSubmitting(false);
    }
  };

  const advanceStage = async () => {
    if (!myConnection) return;
    const currentIdx = STAGE_ORDER.indexOf(myConnection.status);
    const nextStage = STAGE_ORDER[currentIdx + 1];
    if (!nextStage) return;

    try {
      await apiRequest(`/startups/connections/${myConnection._id}/stage`, {
        method: "PATCH",
        body: { stage: nextStage },
      });
      toast(`Advanced to ${STAGE_LABELS[nextStage] || nextStage}`, "success");
      await loadConnection();
    } catch (err) {
      toast(err.message || "Failed to advance stage", "error");
    }
  };

  const handleDownload = async (doc) => {
    try {
      const blob = await apiRequest(`/documents/${doc._id}/download`, {
        blob: true,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.originalName || "document";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.message || "Download failed", "error");
    }
  };

  if (loading) {
    const spinner = (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        <span className="text-xs text-slate-500">
          Loading venture profile...
        </span>
      </div>
    );
    if (embedded) return <AppShell title="Venture Profile">{spinner}</AppShell>;
    return spinner;
  }

  if (!startup) {
    const missing = (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">
          Venture Record Not Found
        </h2>
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Directory</span>
        </Link>
      </div>
    );
    if (embedded) return <AppShell title="Not Found">{missing}</AppShell>;
    return missing;
  }

  const name = startup.legalName || startup.companyName || startup.name;
  const desc =
    startup.innovationDescription ||
    startup.problemStatement ||
    startup.description;
  const sector = startup.sector || "FinTech";
  const stage = startup.fundingStage || startup.stage || "Seed";
  const location = startup.headquarters || startup.location || "Addis Ababa";
  const teamSize = startup.fullTimeEmployees || startup.teamSize || "12";
  const logoUrl =
    typeof startup.logo === "string" &&
    /^https?:\/\//i.test(startup.logo) &&
    !logoError
      ? startup.logo
      : null;

  const designated = isDesignated(startup.status);

  const atInterest = myConnection?.status === "interest_expressed";
  const waitingApproval = atInterest && !myConnection?.dataRoomApproved;
  const canAdvance =
    myConnection &&
    myConnection.status !== "closed" &&
    (!atInterest || myConnection?.dataRoomApproved);
  const dataRoomVisible = myConnection && canViewDataRoom(myConnection.status);

  const page = (
    <div
      className={
        embedded
          ? "space-y-6"
          : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6"
      }
    >
      <Link
        to={backPath}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Directory</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt={`${name} logo`}
                    className="w-full h-full rounded-2xl object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {name}
                  </h1>
                  <StatusBadge
                    status={startup.status || "designated"}
                    size="md"
                  />
                </div>
                <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
                  {desc}
                </p>
                <div className="flex flex-wrap gap-4 pt-3 text-xs text-slate-500 font-medium">
                  <span className="px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 font-bold">
                    {sector}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                    Stage: {stage}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {location}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {teamSize} Staff
                  </span>
                </div>
              </div>
            </div>

            {/* Right Action Stack */}
            <div className="flex flex-col gap-2 shrink-0 min-w-[220px]">
              <button
                onClick={() => setShowCertModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 hover:bg-amber-500/20 text-xs font-bold transition-all"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Inspect Certificate</span>
              </button>

              {user?.role === "investor" && designated && (
                <div className="space-y-2">
                  {connectionLoading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                      Loading...
                    </div>
                  ) : myConnection ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-teal-50 border border-teal-200">
                        <span className="text-xs font-bold text-teal-800">
                          {STAGE_LABELS[myConnection.status] ||
                            myConnection.status}
                        </span>
                        <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                      </div>

                      {waitingApproval && (
                        <div className="px-3 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800">
                            <Clock className="w-3.5 h-3.5" />
                            Waiting for founder approval
                          </div>
                          <p className="text-[11px] text-amber-700 mt-1">
                            The founder must approve data room access before you
                            can proceed.
                          </p>
                        </div>
                      )}

                      {canAdvance && (
                        <button
                          onClick={advanceStage}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md"
                        >
                          <ChevronRight className="w-4 h-4" />
                          <span>
                            Advance to{" "}
                            {STAGE_LABELS[
                              STAGE_ORDER[
                                STAGE_ORDER.indexOf(myConnection.status) + 1
                              ]
                            ] || "Next"}
                          </span>
                        </button>
                      )}

                      {myConnection.amount > 0 && (
                        <div className="text-[11px] text-slate-500 text-center">
                          {myConnection.investmentType !== "none_yet" && (
                            <span className="capitalize">
                              {myConnection.investmentType.replace(/_/g, " ")}
                            </span>
                          )}
                          {myConnection.amount > 0 && (
                            <span>
                              {" "}
                              · {myConnection.amount.toLocaleString()}{" "}
                              {myConnection.currency}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setInterestModalOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl shadow-md"
                    >
                      <Heart className="w-4 h-4" />
                      <span>Express Interest</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Problem Statement & Market Friction
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {startup.problemStatement ||
                "Addressing mission-critical infrastructure and sovereign tech localization."}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Innovation & Tech Stack
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-teal-50/40 p-4 rounded-2xl border border-teal-100">
              {startup.innovationDescription ||
                "Developing state-of-the-art architecture under Proclamation 1396/2025."}
            </p>
          </div>
        </div>
      </div>

      {/* DATA ROOM SECTION — appears when stage >= data_room_accessed */}
      {user?.role === "investor" && dataRoomVisible && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Investor Data Room
              </h3>
            </div>
            <span className="text-xs text-emerald-600 font-semibold">
              Authorized Access
            </span>
          </div>

          {docsLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin text-teal-600 mx-auto mb-2" />
              Loading documents...
            </div>
          ) : docs.length === 0 ? (
            <p className="text-xs text-slate-500">
              No documents uploaded yet by founder.
            </p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => (
                <div
                  key={d._id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <div>
                      <div className="font-semibold text-slate-800">
                        {d.title || d.originalName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatSize(d.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(d)}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Certificate Modal */}
      <Modal
        isOpen={showCertModal}
        onClose={() => setShowCertModal(false)}
        title="MinT Official Designation Certificate"
        subtitle={`Verified statutory accreditation for ${name}`}
        maxWidth="max-w-4xl"
      >
        <CertificateView application={startup} />
      </Modal>

      {/* Express Interest Modal */}
      <Modal
        isOpen={interestModalOpen}
        onClose={() => {
          setInterestModalOpen(false);
          setInterestForm({
            message: "",
            investmentType: "none_yet",
            amount: "",
            currency: "ETB",
          });
        }}
        title="Express Investment Interest"
        subtitle={name}
        maxWidth="max-w-lg"
      >
        <form onSubmit={expressInterest} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Message to Founder
            </label>
            <textarea
              required
              rows={3}
              value={interestForm.message}
              onChange={(e) =>
                setInterestForm({ ...interestForm, message: e.target.value })
              }
              placeholder="Introduce your firm and investment thesis..."
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Investment Type
              </label>
              <select
                value={interestForm.investmentType}
                onChange={(e) =>
                  setInterestForm({
                    ...interestForm,
                    investmentType: e.target.value,
                  })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {INVESTMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proposed Amount
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min={0}
                  value={interestForm.amount}
                  onChange={(e) =>
                    setInterestForm({ ...interestForm, amount: e.target.value })
                  }
                  placeholder="e.g. 500000"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Currency
            </label>
            <select
              value={interestForm.currency}
              onChange={(e) =>
                setInterestForm({ ...interestForm, currency: e.target.value })
              }
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="ETB">ETB — Ethiopian Birr</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={interestSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-bold rounded-xl"
            >
              {interestSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className="w-4 h-4" />
              )}
              <span>Send Interest</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInterestModalOpen(false);
                setInterestForm({
                  message: "",
                  investmentType: "none_yet",
                  amount: "",
                  currency: "ETB",
                });
              }}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );

  if (
    embedded ||
    (isAuthenticated && (user?.role === "investor" || user?.role === "citizen"))
  ) {
    return (
      <AppShell title={name} subtitle="Designated Venture Profile">
        {page}
      </AppShell>
    );
  }
  return page;
}

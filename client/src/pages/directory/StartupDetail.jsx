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
  Clock,
  XCircle,
  Award,
  ShieldCheck,
  Building2,
  Lock,
  Layers,
  Sparkles,
} from "lucide-react";

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function StartupDetail({ embedded = false }) {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { applications } = useDesignation();
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [myRequest, setMyRequest] = useState(null);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);

  const backPath =
    embedded && user?.role === "investor"
      ? "/investor/directory"
      : embedded && user?.role === "citizen"
      ? "/citizen/directory"
      : "/directory";

  const loadAccessAndDocs = async () => {
    if (!isAuthenticated || user?.role !== "investor") return;
    try {
      const reqRes = await apiRequest("/access-requests/my");
      const list = reqRes.data || [];
      const mine = list.find(
        (r) =>
          r.startup?._id === id ||
          r.startup === id ||
          String(r.startup?._id || r.startup) === String(id)
      );
      setMyRequest(mine || null);

      if (mine?.status === "approved") {
        setDocsLoading(true);
        try {
          const docsRes = await apiRequest(`/documents/startup/${id}`);
          setDocs(docsRes.data || []);
        } catch {
          setDocs([]);
        } finally {
          setDocsLoading(false);
        }
      } else {
        setDocs([]);
      }
    } catch {
      setMyRequest(null);
      setDocs([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest(`/startups/${id}`);
        if (res.data) {
          setStartup(res.data);
        } else {
          // Fallback to local context applications
          const fallback = applications.find((a) => a.id === id || a._id === id);
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
    if (startup && isAuthenticated && user?.role === "investor") {
      loadAccessAndDocs();
    }
  }, [startup, isAuthenticated, user?.role, id]);

  const requestAccess = async () => {
    if (!isAuthenticated || user?.role !== "investor") {
      toast("Sign in as an investor to request data room access", "info");
      return;
    }
    setRequesting(true);
    try {
      const res = await apiRequest("/access-requests", {
        method: "POST",
        body: { startupId: id },
      });
      setMyRequest(res.data || { status: "pending" });
      toast("Access request sent to the founder", "success");
    } catch (err) {
      toast(err.message || "Request failed", "error");
      await loadAccessAndDocs();
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const blob = await apiRequest(`/documents/${doc._id}/download`, { blob: true });
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
        <span className="text-xs text-slate-500">Loading statutory venture profile...</span>
      </div>
    );
    if (embedded) return <AppShell title="Venture Profile">{spinner}</AppShell>;
    return spinner;
  }

  if (!startup) {
    const missing = (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Venture Record Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested startup may not be officially published or is currently under designation review.
        </p>
        <Link
          to={backPath}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Registry</span>
        </Link>
      </div>
    );
    if (embedded) return <AppShell title="Not Found">{missing}</AppShell>;
    return missing;
  }

  const accessStatus = myRequest?.status;
  const name = startup.legalName || startup.companyName || startup.name;
  const desc = startup.innovationDescription || startup.problemStatement || startup.oneLineDescription || startup.description;
  const sector = startup.sector || "FinTech";
  const stage = startup.fundingStage || startup.stage || "Seed";
  const location = startup.headquarters || startup.location || "Addis Ababa";
  const teamSize = startup.fullTimeEmployees || startup.teamSize || "12";

  const page = (
    <div className={embedded ? "space-y-6" : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6"}>
      <Link
        to={backPath}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Designated Directory</span>
      </Link>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shrink-0">
                {startup.logo || "🇪🇹"}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {name}
                  </h1>
                  <StatusBadge status={startup.status || "designated"} size="md" />
                </div>
                {startup.tradeName && (
                  <div className="text-xs font-bold text-teal-800">
                    Trade Name: &ldquo;{startup.tradeName}&rdquo;
                  </div>
                )}
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
                    <span>{location}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{teamSize} Staff</span>
                  </span>
                  {startup.website && (
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-teal-800 hover:underline font-semibold"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>{startup.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Right Action Stack */}
            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setShowCertModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 hover:bg-amber-500/20 text-xs font-bold transition-all shadow-2xs"
              >
                <Award className="w-4 h-4 text-amber-600" />
                <span>Inspect Designation Certificate</span>
              </button>

              {user?.role === "investor" && (
                <div>
                  {!accessStatus && (
                    <button
                      onClick={requestAccess}
                      disabled={requesting}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-xs font-bold rounded-2xl shadow-md shadow-teal-700/20"
                    >
                      {requesting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>Request Data Room</span>
                    </button>
                  )}
                  {accessStatus === "pending" && (
                    <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-2xl border border-amber-200">
                      <Clock className="w-4 h-4" /> Request pending approval
                    </span>
                  )}
                  {accessStatus === "approved" && (
                    <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-2xl border border-emerald-200">
                      <CheckCircle className="w-4 h-4" /> Data Room Unlocked
                    </span>
                  )}
                  {accessStatus === "denied" && (
                    <span className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-2xl border border-rose-200">
                      <XCircle className="w-4 h-4" /> Request declined
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Narrative Details */}
        <div className="p-6 sm:p-8 grid md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              National Problem Statement & Market Friction
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {startup.problemStatement || "Addressing mission-critical infrastructure, operational hurdles, and sovereign tech localization in the Ethiopian economy."}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Proprietary Innovation & Tech Stack
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-teal-50/40 p-4 rounded-2xl border border-teal-100">
              {startup.innovationDescription || "Developing state-of-the-art architecture with dedicated domestic digital workflows under Proclamation 1396/2025."}
            </p>
          </div>
        </div>

        {/* Statutory Compliance Table */}
        <div className="px-6 sm:px-8 py-5 bg-slate-50/70 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            <span>Statutory Filing Metadata</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px]">Commercial Reg:</span>
              <div className="font-mono font-bold text-slate-800 mt-0.5">
                {startup.commercialRegNo || "ET/AA/2023/1234"}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Tax Identification (TIN):</span>
              <div className="font-mono font-bold text-slate-800 mt-0.5">
                {startup.tin || "0099887766"}
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Citizen Equity:</span>
              <div className="font-bold text-emerald-700 mt-0.5">
                {startup.ethiopianOwnershipPercent || 80}% Ethiopian Owned
              </div>
            </div>
            <div>
              <span className="text-slate-400 text-[11px]">Accreditation Year:</span>
              <div className="font-bold text-slate-800 mt-0.5">
                2025 (Proclamation 1396)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investor Data Room Section (If Investor is logged in) */}
      {user?.role === "investor" && accessStatus === "approved" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Audited Investor Data Room
              </h3>
            </div>
            <span className="text-xs text-emerald-600 font-semibold">
              Authorized Access
            </span>
          </div>

          {docsLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Loading encrypted documents...
            </div>
          ) : docs.length === 0 ? (
            <p className="text-xs text-slate-500">No documents uploaded yet by founder.</p>
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
                      <div className="font-semibold text-slate-800">{d.title || d.originalName}</div>
                      <div className="text-[10px] text-slate-400">{formatSize(d.size)}</div>
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
    </div>
  );

  if (embedded || (isAuthenticated && (user?.role === "investor" || user?.role === "citizen"))) {
    return (
      <AppShell title={name} subtitle="Designated Venture Profile">
        {page}
      </AppShell>
    );
  }

  return page;
}

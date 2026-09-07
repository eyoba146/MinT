import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AppShell from "../components/AppShell";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  ShieldCheck,
} from "lucide-react";

export default function VerificationPage() {
  const { user, getVerificationStatus, submitVerification } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [documents, setDocuments] = useState([]);
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState("business_license");
  const [submitting, setSubmitting] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await getVerificationStatus();
      setStatus(res.data.status);
      setDocuments(res.data.documents || []);
      setNotes(res.data.notes || "");
    } catch (err) {
      toast(err.message || "Failed to load verification status", "error");
      setStatus("not_submitted");
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast("Please select a document to upload", "error");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("documentType", documentType);
      formData.append("file", file);
      await submitVerification(formData);
      toast("Verification document submitted", "success");
      await loadStatus();
    } catch (err) {
      toast(err.message || "Submission failed", "error");
    } finally {
      setSubmitting(false);
      setFile(null);
    }
  };

  if (status === "loading") {
    return (
      <AppShell title="Verification">
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  const roleLabel =
    user?.role === "founder"
      ? "Founder"
      : user?.role === "investor"
        ? "Investor"
        : "Ecosystem Builder";

  const dashboardPath =
    user?.role === "founder"
      ? "/founder"
      : user?.role === "investor"
        ? "/investor"
        : "/builder";

  return (
    <AppShell title="Account Verification" subtitle={`${roleLabel} onboarding`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Status Banner */}
        {status === "approved" ? (
          <div className="bg-white border border-teal-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <CheckCircle className="w-10 h-10 shrink-0 text-teal-600" />
            <div>
            <h2 className="text-lg font-bold text-slate-900">
              Verification Approved
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Your account is fully verified. You can now access all features
              and apply for startup designation.
            </p>
            <button
              onClick={() => navigate(dashboardPath, { replace: true })}
              className="mt-4 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Go to dashboard
            </button>
            </div>
          </div>
        ) : status === "pending" ? (
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <Clock className="w-10 h-10 shrink-0 text-amber-600" />
            <div>
            <h2 className="text-lg font-bold text-slate-900">
              Verification Under Review
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Your documents have been submitted and are awaiting review. You
              will receive an email notification when a decision is made.
            </p>
            </div>
          </div>
        ) : status === "rejected" ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <XCircle className="w-10 h-10 shrink-0 text-rose-600" />
            <div>
            <h2 className="text-lg font-bold text-slate-900">
              Verification Rejected
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              {notes ||
                "Your documents did not meet requirements. Please submit new documents below."}
            </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-start gap-4">
            <ShieldCheck className="w-10 h-10 shrink-0 text-teal-600" />
            <div>
            <h2 className="text-lg font-bold text-slate-900">
              Submit Verification Documents
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              As a {roleLabel.toLowerCase()}, you must verify your identity
              before accessing the platform.
            </p>
            </div>
          </div>
        )}

        {/* Upload Form */}
        {status !== "approved" && status !== "pending" && (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-5"
          >
            <div className="flex items-center gap-2 pb-1">
              <Upload size={18} className="text-teal-700" />
              <h2 className="text-base font-bold text-slate-900">
                Upload documents
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Document type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="business_license">Business license</option>
                  <option value="incorporation_certificate">
                    Incorporation certificate
                  </option>
                  <option value="tax_identification">Tax identification</option>
                  <option value="passport">Passport/ID</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Upload file
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-600 file:text-white hover:file:bg-teal-700 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !file}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-semibold rounded-xl transition-colors"
            >
              {submitting ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Upload size={18} />
              )}
              <span>{submitting ? "Submitting…" : "Submit verification"}</span>
            </button>
          </form>
        )}

        {/* Submitted Documents */}
        {documents.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-slate-400" /> Submitted
              documents
            </h3>
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center justify-between text-sm bg-slate-50 p-3 rounded-xl"
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
          </div>
        )}
      </div>
    </AppShell>
  );
}

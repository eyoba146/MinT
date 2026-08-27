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
} from "lucide-react";

export default function FounderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [startup, setStartup] = useState(null);
  const [requests, setRequests] = useState([]);
  const [docCount, setDocCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

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
            : r
        )
      );
      toast(
        action === "approve" ? "Access approved" : "Access denied",
        "success"
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
        {decisionBanner && (
          <div
            className={`p-4 rounded-2xl border flex gap-3 ${decisionBanner.className}`}
            role="alert"
          >
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">{decisionBanner.title}</div>
              <p className="text-sm mt-1 leading-relaxed">
                {decisionBanner.reason}
              </p>
            </div>
          </div>
        )}

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
                      startup.designationExpiresAt
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
            <div className="font-semibold text-slate-900 text-sm">{docCount}</div>
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
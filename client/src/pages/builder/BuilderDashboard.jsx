import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import StatusBadge from "../../components/StatusBadge";
import { Loader2, PlusCircle, Award, FileText, ArrowRight } from "lucide-react";

export default function BuilderDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [builder, setBuilder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest("/ecosystem-builders/my");
        setBuilder(res.data);
      } catch (err) {
        if (!err.message?.toLowerCase().includes("no ")) {
          // 404 = no application yet — normal
        }
        setBuilder(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <AppShell title="Builder workspace">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-700" />
        </div>
      </AppShell>
    );
  }

  if (!builder) {
    return (
      <AppShell
        title="Builder workspace"
        subtitle={user?.fullName || "Ecosystem builder"}
      >
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <PlusCircle className="mx-auto text-teal-700 mb-4" size={36} />
          <h2 className="text-lg font-bold text-slate-900 mb-2">
            Apply as an ecosystem builder
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            Submit your incubator, accelerator, or hub for MinT designation so
            founders and investors can discover your organization.
          </p>
          <Link
            to="/builder/apply"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-xl"
          >
            <FileText size={16} /> Start application
          </Link>
        </div>
      </AppShell>
    );
  }

  const designated =
    builder.status === "designated" || builder.status === "verified";

  return (
    <AppShell
      title="Builder workspace"
      subtitle={builder.organizationName}
      actions={
        <Link
          to="/builder/apply"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
        >
          Edit application
        </Link>
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {builder.organizationName}
                </h2>
                <p className="text-sm text-slate-500 capitalize mt-1">
                  {(builder.builderType || "").replace(/_/g, " ")}
                </p>
              </div>
              <StatusBadge status={builder.status} />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {builder.description || "No description provided."}
            </p>
            {(builder.country || builder.location) && (
              <p className="text-sm text-slate-500 mt-3">
                {[builder.location, builder.country].filter(Boolean).join(", ")}
              </p>
            )}
          </div>

          {builder.status === "rejected" && builder.rejectionReason && (
            <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-800">
              <strong>Not approved:</strong> {builder.rejectionReason}
            </div>
          )}

          {builder.resources && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Resources offered
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(builder.resources)
                  .filter(([k, v]) => k !== "other" && v === true)
                  .map(([k]) => (
                    <span
                      key={k}
                      className="px-2.5 py-1 text-xs rounded-full bg-teal-50 text-teal-800 border border-teal-100 capitalize"
                    >
                      {k.replace(/([A-Z])/g, " $1")}
                    </span>
                  ))}
                {builder.resources.other && (
                  <span className="px-2.5 py-1 text-xs rounded-full bg-slate-50 text-slate-600 border border-slate-200">
                    {builder.resources.other}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {designated && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Award size={18} className="text-teal-700" />
                <h3 className="font-semibold text-teal-900">MinT designated</h3>
              </div>
              <p className="text-sm text-teal-800 leading-relaxed">
                Your organization is designated in the official registry.
                {builder.designationExpiresAt && (
                  <>
                    <br />
                    Valid until{" "}
                    {new Date(
                      builder.designationExpiresAt,
                    ).toLocaleDateString()}
                  </>
                )}
              </p>
              <Link
                to="/builders"
                className="inline-flex items-center gap-1 text-sm font-semibold text-teal-900 mt-3 hover:underline"
              >
                Public directory <ArrowRight size={14} />
              </Link>
            </div>
          )}

          {!designated &&
            ["pending", "submitted", "under_review"].includes(
              builder.status,
            ) && (
              <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5 text-sm text-amber-900">
                Application is in the review queue
                {builder.reviewDueAt && (
                  <>
                    . Target:{" "}
                    {new Date(builder.reviewDueAt).toLocaleDateString()}
                  </>
                )}
                .
              </div>
            )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Quick links
            </h3>
            <Link
              to="/builder/apply"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
            >
              Edit application
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
            <Link
              to="/builder/opportunities"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-700 hover:bg-slate-50"
            >
              Opportunities
              <ArrowRight size={14} className="text-slate-400" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

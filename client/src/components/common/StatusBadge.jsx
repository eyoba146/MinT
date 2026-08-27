import { ShieldCheck, Clock, CheckCircle2, XCircle, AlertTriangle, Award } from "lucide-react";

export function OfficialDesignationSeal({ certificateNumber, className = "" }) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold backdrop-blur-sm ${className}`}
    >
      <Award className="w-3.5 h-3.5 text-amber-500" />
      <span>Designated</span>
      {certificateNumber && (
        <span className="font-mono text-[10px] opacity-80 border-l border-amber-500/30 pl-1.5 ml-0.5">
          {certificateNumber}
        </span>
      )}
    </div>
  );
}

export default function StatusBadge({ status, size = "md", className = "" }) {
  const norm = (status || "draft").toLowerCase();

  const configs = {
    designated: {
      label: "Designated",
      icon: ShieldCheck,
      classes: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    },
    verified: {
      label: "Verified",
      icon: CheckCircle2,
      classes: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    },
    under_review: {
      label: "Under Review",
      icon: Clock,
      classes: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
    },
    submitted: {
      label: "Submitted",
      icon: Clock,
      classes: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    },
    pending: {
      label: "Pending Verification",
      icon: Clock,
      classes: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
    },
    rejected: {
      label: "Rejected",
      icon: XCircle,
      classes: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
    },
    suspended: {
      label: "Suspended",
      icon: AlertTriangle,
      classes: "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700",
    },
    draft: {
      label: "Draft",
      icon: Clock,
      classes: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    },
  };

  const current = configs[norm] || configs.draft;
  const Icon = current.icon;

  const sizeClasses = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  }[size] || "text-xs px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border shadow-2xs ${current.classes} ${sizeClasses} ${className}`}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5"} />
      <span>{current.label}</span>
    </span>
  );
}

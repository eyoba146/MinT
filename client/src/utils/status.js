export const PUBLIC_STATUSES = ["verified", "designated"];

export const STATUS_META = {
  draft: { label: "Draft", color: "slate" },
  pending: { label: "Pending review", color: "amber" },
  submitted: { label: "Submitted", color: "amber" },
  under_review: { label: "Under review", color: "blue" },
  interview_requested: { label: "Interview requested", color: "purple" },
  verified: { label: "MinT designated", color: "teal" },
  designated: { label: "MinT designated", color: "teal" },
  rejected: { label: "Rejected", color: "red" },
  renewal_due: { label: "Renewal due", color: "orange" },
  suspended: { label: "Suspended", color: "rose" },
  revoked: { label: "Revoked", color: "red" },
  expired: { label: "Expired", color: "slate" },
};

export function statusLabel(status) {
  return STATUS_META[status]?.label || status || "Unknown";
}

export function statusColor(status) {
  return STATUS_META[status]?.color || "slate";
}

export function isDesignated(status) {
  return PUBLIC_STATUSES.includes(status);
}

export const COLOR_CLASSES = {
  slate: "bg-slate-100 text-slate-700 border-slate-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  blue: "bg-blue-50 text-blue-800 border-blue-200",
  purple: "bg-purple-50 text-purple-800 border-purple-200",
  teal: "bg-teal-50 text-teal-800 border-teal-200",
  orange: "bg-orange-50 text-orange-800 border-orange-200",
  rose: "bg-rose-50 text-rose-800 border-rose-200",
  red: "bg-red-50 text-red-800 border-red-200",
};
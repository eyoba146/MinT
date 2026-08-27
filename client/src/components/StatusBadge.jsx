import { statusLabel, statusColor, COLOR_CLASSES } from "../utils/status";

export default function StatusBadge({ status, className = "" }) {
  const color = statusColor(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${COLOR_CLASSES[color]} ${className}`}
    >
      {statusLabel(status)}
    </span>
  );
}
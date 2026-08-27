import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title = "Nothing here yet",
  description = "",
  action = null,
}) {
  return (
    <div className="py-14 text-center bg-white rounded-2xl border border-slate-200">
      <Icon className="mx-auto text-slate-300 mb-3" size={32} />
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
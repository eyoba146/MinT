export default function StatCard({ label, value, icon: Icon, color = "teal", hint, trend }) {
  const colorStyles = {
    teal: {
      bg: "bg-teal-500/10",
      text: "text-teal-800",
      border: "border-teal-200/60",
    },
    indigo: {
      bg: "bg-indigo-500/10",
      text: "text-indigo-800",
      border: "border-indigo-200/60",
    },
    amber: {
      bg: "bg-amber-500/10",
      text: "text-amber-800",
      border: "border-amber-200/60",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-800",
      border: "border-blue-200/60",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-800",
      border: "border-purple-200/60",
    },
    rose: {
      bg: "bg-rose-500/10",
      text: "text-rose-800",
      border: "border-rose-200/60",
    },
    slate: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
    },
    primary: {
      bg: "bg-teal-500/10",
      text: "text-teal-800",
      border: "border-teal-200/60",
    },
  };

  const style = colorStyles[color] || colorStyles.teal;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {value ?? "—"}
          </div>
          {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
          {trend && (
            <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
              <span>{trend}</span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${style.bg} ${style.text} ${style.border}`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}

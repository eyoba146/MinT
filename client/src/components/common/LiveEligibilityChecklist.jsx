import { CheckCircle2, XCircle, AlertCircle, Award, Scale } from "lucide-react";
import { useDesignation } from "../../context/DesignationContext";

export default function LiveEligibilityChecklist({ formData = {}, track = "startup" }) {
  const { calculateEligibility } = useDesignation();
  const assessment = calculateEligibility(formData);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Proclamation 1396/2025 Statutory Meter
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Eligibility Score:</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
              assessment.score >= 75
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            }`}
          >
            {assessment.score}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            assessment.score === 100
              ? "bg-emerald-500"
              : assessment.score >= 75
              ? "bg-teal-500"
              : assessment.score >= 50
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
          style={{ width: `${assessment.score}%` }}
        />
      </div>

      {/* Criteria Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {assessment.checks.map((check) => (
          <div
            key={check.id}
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-colors ${
              check.passed
                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/70 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-200"
                : "bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            }`}
          >
            {check.passed ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold">{check.label}</div>
              <div className="text-[11px] opacity-80 mt-0.5">
                Current Value: <span className="font-medium">{check.actual}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legal Recommendation */}
      <div
        className={`p-3.5 rounded-xl text-xs leading-relaxed flex items-start gap-2.5 ${
          assessment.isEligible
            ? "bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200"
            : "bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
        }`}
      >
        <Award className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600 dark:text-indigo-400" />
        <div>
          <span className="font-bold">Official Statutory Recommendation: </span>
          {assessment.recommendation}
        </div>
      </div>
    </div>
  );
}

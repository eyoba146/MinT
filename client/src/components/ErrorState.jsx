import { AlertCircle } from "lucide-react";

export default function ErrorState({
  title = "Something went wrong",
  message = "",
  onRetry = null,
}) {
  return (
    <div className="py-12 px-4 text-center bg-red-50 rounded-2xl border border-red-100">
      <AlertCircle className="mx-auto text-red-400 mb-3" size={28} />
      <p className="text-sm font-semibold text-red-900">{title}</p>
      {message && <p className="text-xs text-red-700 mt-1">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-red-200 text-red-800 hover:bg-red-50"
        >
          Try again
        </button>
      )}
    </div>
  );
}
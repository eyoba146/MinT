import { useState, useRef, useEffect } from "react";
import { apiRequest } from "../utils/api";
import { Sparkles, Loader2, Check, Copy, X, Wand2 } from "lucide-react";

export default function AiPolishButton({ text, onApply, className = "" }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("enhance");
  const [loading, setLoading] = useState(false);
  const [improved, setImproved] = useState("");
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handlePolish = async () => {
    if (!text || !text.trim()) return;
    setLoading(true);
    try {
      const res = await apiRequest("/ai/polish", {
        method: "POST",
        body: { text, mode },
      });
      setImproved(res.data.improved || "");
    } catch (err) {
      console.error(err);
      setImproved("");
    } finally {
      setLoading(false);
    }
  };

  const applyText = () => {
    if (improved) onApply(improved);
    setOpen(false);
    setImproved("");
  };

  return (
    <div className="relative inline-block" ref={buttonRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors ${className}`}
      >
        <Sparkles size={14} />
        AI
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute z-30 top-full right-0 mt-2 w-96 rounded-2xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 size={16} className="text-violet-600" />
              <span className="text-sm font-semibold text-slate-900">
                AI Writing Assistant
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex gap-2">
            {["enhance", "grammar", "concise"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize ${
                  mode === m
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={handlePolish}
            disabled={loading || !text.trim()}
            className="w-full flex items-center justify-center gap-2 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            Improve text
          </button>

          {improved && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 max-h-40 overflow-y-auto">
                {improved}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyText}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl"
                >
                  <Check size={16} /> Apply
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(improved)}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl"
                >
                  <Copy size={16} /> Copy
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { KeyRound, Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [step, setStep] = useState("code"); // "code" | "password"
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(60);
  const { verifyResetCode, resetPassword, forgotPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError("");
    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter the 6-digit reset code.");
      return;
    }
    setLoading(true);
    try {
      await verifyResetCode(email, code.trim());
      setStep("password");
    } catch (err) {
      setError(err.message || "Invalid or expired code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, code.trim(), newPassword);
      toast("Password reset successfully", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError("");
    setResendLoading(true);
    try {
      await forgotPassword(email);
      toast("A new reset code has been sent", "success");
      setCooldown(60);
    } catch (err) {
      setError(err.message || "Failed to resend reset code.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-teal-50/30">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
            {step === "code" ? (
              <KeyRound size={28} />
            ) : (
              <ShieldCheck size={28} />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === "code" ? "Check your email" : "Set new password"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {step === "code"
              ? `Enter the 6-digit code sent to ${email || "your email"}`
              : "Choose a strong new password"}
          </p>
        </div>

        {step === "code" ? (
          <>
            <form onSubmit={handleVerifyCode} className="space-y-5">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Reset code
                </label>
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-2xl tracking-[0.5em] font-bold"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p role="alert" className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:from-teal-400 disabled:to-teal-400 text-white font-semibold rounded-xl text-sm shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying…
                  </>
                ) : (
                  <>
                    Verify code <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || cooldown > 0}
                className="text-sm text-teal-700 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"
              >
                {cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : resendLoading
                    ? "Sending…"
                    : "Resend reset code"}
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                New password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Confirm new password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:from-teal-400 disabled:to-teal-400 text-white font-semibold rounded-xl text-sm shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Resetting…
                </>
              ) : (
                <>
                  Reset password <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

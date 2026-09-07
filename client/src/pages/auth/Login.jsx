import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";

function roleHome(role) {
  if (role === "founder") return "/founder";
  if (role === "investor") return "/investor";
  if (role === "admin") return "/admin";
  if (role === "ecosystem_builder") return "/builder";
  if (role === "citizen") return "/citizen";
  if (role === "reviewer") return "/reviewer";
  if (role === "moderator") return "/moderator";
  return "/";
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setUnverifiedEmail("");
    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      navigate(roleHome(user.role), { replace: true });
    } catch (err) {
      const message = err.message || "Sign-in failed. Please try again.";
      setError(message);
      if (message.toLowerCase().includes("verify your email")) {
        setUnverifiedEmail(form.email.trim());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_10%_15%,rgba(20,184,166,0.12),transparent_30%),radial-gradient(circle_at_90%_85%,rgba(245,158,11,0.10),transparent_28%),linear-gradient(135deg,#f8fafc_0%,#ffffff_52%,#f0fdfa_100%)] px-5 py-12 sm:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(#0f766e_1px,transparent_1px),linear-gradient(90deg,#0f766e_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-7 shadow-2xl shadow-slate-900/10 backdrop-blur sm:p-8">
          <div className="mb-7">
            <div className="mb-3 inline-flex items-center rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700">
              Secure portal access
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Sign in to continue managing your MinT Digital Hub workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@organization.et"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                <p role="alert" className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {unverifiedEmail && (
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-semibold text-teal-800 transition-all hover:bg-teal-100"
              >
                <KeyRound size={16} />
                <span>Verify your email</span>
              </Link>
            )}

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-semibold text-teal-700 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-900/20 transition-all hover:from-teal-500 hover:to-teal-600 disabled:from-teal-400 disabled:to-teal-400"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <>Sign in <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-7 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            New to the portal?{" "}
            <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-800 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

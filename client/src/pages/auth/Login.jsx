import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  Shield,
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const msg = err.message || "Sign-in failed. Please try again.";
      setError(msg);
      if (msg.toLowerCase().includes("verify your email")) {
        setUnverifiedEmail(form.email.trim());
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center ring-1 ring-white/20">
              <Shield size={20} className="text-teal-200" />
            </div>
            <div>
              <div className="font-semibold text-sm">MinT Digital Hub</div>
              <div className="text-xs text-teal-200/80">
                Ministry of Innovation and Technology
              </div>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
            Sign in to your workspace
          </h1>
          <p className="text-teal-100/90 text-base leading-relaxed max-w-md">
            Access designation applications, certificates, data rooms, and
            investor workflows.
          </p>
        </div>
        <p className="relative z-10 text-sm text-teal-200/60">
          Digital Ethiopia · MinT Portal
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-slate-50 to-teal-50/30">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-slate-900 mb-1">
            Welcome back
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            New to the portal?{" "}
            <Link
              to="/register"
              className="text-teal-700 font-semibold hover:text-teal-800 hover:underline transition-colors"
            >
              Create an account
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Email address
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@organization.et"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            )}

            {unverifiedEmail && (
              <Link
                to={`/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-semibold text-sm hover:bg-teal-100 transition-all"
              >
                <KeyRound size={16} />
                <span>Verify your email</span>
              </Link>
            )}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-teal-700 font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:from-teal-400 disabled:to-teal-400 text-white font-semibold rounded-xl text-sm shadow-md shadow-teal-900/20 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Sign in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  User,
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
  return "/";
}

const ROLES = [
  {
    value: "founder",
    label: "Startup founder",
    desc: "Apply for MinT designation",
  },
  {
    value: "investor",
    label: "Investor",
    desc: "Discover designated startups",
  },
  {
    value: "ecosystem_builder",
    label: "Ecosystem builder",
    desc: "Incubator, accelerator, or hub",
  },
  { value: "citizen", label: "Citizen", desc: "Explore the public portal" },
];

export default function Register() {
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "founder",
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmitRegistration = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName.trim() || !form.email.trim() || !form.password) {
      setError("Please complete all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(
        form.fullName.trim(),
        form.email.trim(),
        form.password,
        form.role,
      );
      setStep("verify");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setError("");
    if (!verificationCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }
    setLoading(true);
    try {
      const user = await verifyEmail(
        form.email.trim(),
        verificationCode.trim(),
      );
      navigate(roleHome(user.role), { replace: true });
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-teal-50/30">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Verify your email
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Enter the 6-digit code sent to <strong>{form.email}</strong>
            </p>
          </div>

          <form onSubmit={handleSubmitVerification} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Verification code
              </label>
              <input
                id="code"
                name="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-center text-2xl tracking-[0.5em] font-bold"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl"
              >
                {error}
              </p>
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
                  Verify email <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep("form")}
              className="w-full text-sm text-teal-700 font-semibold hover:underline"
            >
              Back to registration
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-50">
      <div className="lg:w-1/2 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <div className="font-semibold text-sm">MinT Digital Hub</div>
              <div className="text-xs text-teal-300">
                Ministry of Innovation & Technology
              </div>
            </div>
          </div>
          <div className="pt-4 space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
              Create your portal account
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed max-w-lg">
              Register as a founder, investor, ecosystem builder, or citizen to
              use the national startup designation platform.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-400 pt-10 border-t border-slate-800 relative z-10">
          Digital Ethiopia · MinT Portal
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-slate-50 to-teal-50/30">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create account</h2>
            <p className="text-slate-500 text-sm mt-1">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-teal-700 font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>

          <form
            onSubmit={handleSubmitRegistration}
            className="space-y-4"
            autoComplete="on"
          >
            <div>
              <p className="block text-sm font-medium text-slate-700 mb-2">
                I am registering as
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={`p-3 text-left rounded-xl border transition-all ${
                      form.role === r.value
                        ? "bg-teal-50 border-teal-500"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`text-sm font-semibold ${
                        form.role === r.value
                          ? "text-teal-800"
                          : "text-slate-800"
                      }`}
                    >
                      {r.label}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {r.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="fullName"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Full name
              </label>
              <div className="relative">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="fullName"
                  name="fullName"
                  autoComplete="name"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-email"
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
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="name@organization.et"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="reg-password"
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
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="text-sm text-red-700 bg-red-50 border border-red-100 px-3 py-2 rounded-xl"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 disabled:from-teal-400 disabled:to-teal-400 text-white font-semibold rounded-xl text-sm shadow-md"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating
                  account…
                </>
              ) : (
                <>
                  Create account <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

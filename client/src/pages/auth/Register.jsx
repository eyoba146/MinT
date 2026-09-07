import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SECTORS } from "../../data/constants";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  Check,
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
  const [step, setStep] = useState("basic"); // "basic" | "details" | "verify"
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "founder",
    organization: "",
    investmentRange: "",
    focus: [],
  });
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, verifyEmail } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "focus") {
      setForm((prev) => {
        const current = prev.focus;
        if (checked) return { ...prev, focus: [...current, value] };
        return { ...prev, focus: current.filter((s) => s !== value) };
      });
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleBasicSubmit = (e) => {
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

    if (form.role === "investor") {
      setStep("details");
    } else {
      handleRegister({});
    }
  };

  const handleDetailsSubmit = (e) => {
    e.preventDefault();
    setError("");
    handleRegister({
      organization: form.organization.trim(),
      investmentRange: form.investmentRange.trim(),
      focus: form.focus,
    });
  };

  const handleRegister = async (extraData) => {
    setLoading(true);
    try {
      await register(
        form.fullName.trim(),
        form.email.trim(),
        form.password,
        form.role,
        extraData,
      );
      setStep("verify");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!verificationCode.trim() || verificationCode.trim().length !== 6) {
      setError("Please enter the 6-digit verification code.");
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

  // Step 3: Verification
  if (step === "verify") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-teal-50/30">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4">
              <KeyRound size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              Verify your email
            </h1>
            <p className="text-sm text-slate-500 mt-2">
              Enter the 6-digit code sent to <strong>{form.email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerifySubmit} className="space-y-5">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Verification code
              </label>
              <input
                id="code"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, ""))
                }
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
                  Verify email <ArrowRight size={16} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                setStep(form.role === "investor" ? "details" : "basic")
              }
              className="w-full text-sm text-teal-700 font-semibold hover:underline"
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Step 1 or Step 2
  const isBasicStep = step === "basic";
  const isDetailsStep = step === "details";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row bg-slate-50">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
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
            Create your portal account
          </h1>
          <p className="text-teal-100/90 text-base leading-relaxed max-w-md">
            Register as a founder, investor, ecosystem builder, or citizen to
            use the national startup designation platform.
          </p>
        </div>
        <p className="relative z-10 text-sm text-teal-200/60">
          Digital Ethiopia · MinT Portal
        </p>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-slate-50 to-teal-50/30">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "basic" || step === "details" || step === "verify" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-700"}`}
            >
              1
            </div>

            {form.role === "investor" && (
              <>
                <div
                  className={`h-0.5 flex-1 ${step === "details" || step === "verify" ? "bg-teal-600" : "bg-slate-200"}`}
                />
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "details" || step === "verify" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-700"}`}
                >
                  2
                </div>
              </>
            )}

            <div
              className={`h-0.5 flex-1 ${step === "verify" ? "bg-teal-600" : "bg-slate-200"}`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step === "verify" ? "bg-teal-600 text-white" : "bg-teal-100 text-teal-700"}`}
            >
              {form.role === "investor" ? 3 : 2}
            </div>
          </div>

          {isBasicStep ? (
            <form
              onSubmit={handleBasicSubmit}
              className="space-y-5"
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
                        className={`text-sm font-semibold ${form.role === r.value ? "text-teal-800" : "text-slate-800"}`}
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
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
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
                    <Loader2 size={16} className="animate-spin" /> Creating…
                  </>
                ) : (
                  <>
                    Continue <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: Details (investor only) */
            <form onSubmit={handleDetailsSubmit} className="space-y-5">
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setStep("basic")}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 className="text-lg font-bold text-slate-900">
                  Investor details
                </h2>
              </div>

              <div>
                <label
                  htmlFor="organization"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Organization
                </label>
                <input
                  id="organization"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="Your organization or firm"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="investmentRange"
                  className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                  Investment range
                </label>
                <input
                  id="investmentRange"
                  name="investmentRange"
                  value={form.investmentRange}
                  onChange={handleChange}
                  placeholder="e.g. $50k - $200k"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>

              <div>
                <p className="block text-sm font-medium text-slate-700 mb-1.5">
                  Focus sectors
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SECTORS.map((sector) => (
                    <label
                      key={sector}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        name="focus"
                        value={sector}
                        checked={form.focus.includes(sector)}
                        onChange={handleChange}
                        className="rounded border-slate-300"
                      />
                      {sector}
                    </label>
                  ))}
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
                    <Check size={16} /> Complete registration
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

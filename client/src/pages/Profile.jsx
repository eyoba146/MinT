import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AppShell from "../components/AppShell";
import { SECTORS } from "../data/constants";
import { User, Lock, Save, Loader2, Building2, Target } from "lucide-react";

const BUILDER_TYPES = [
  { value: "incubator", label: "Incubator" },
  { value: "accelerator", label: "Accelerator" },
  { value: "coworking", label: "Coworking / hub" },
  { value: "angel_network", label: "Angel network" },
  { value: "university", label: "University" },
  { value: "research", label: "Research" },
  { value: "ngo", label: "NGO" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500";
const selectClass = `${inputClass} bg-white`;

function SectionHeader({ icon: Icon, title, description, tone = "teal" }) {
  const tones = {
    teal: "bg-teal-50 text-teal-700",
    blue: "bg-blue-50 text-blue-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`rounded-xl p-2 ${tones[tone]}`}>
        <Icon size={18} />
      </div>
      <div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    companyName: "",
    organization: "",
    organizationName: "",
    builderType: "",
    investmentRange: "",
    focus: [],
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((previous) => ({
      ...previous,
      fullName: user.fullName || "",
      companyName: user.companyName || "",
      organization: user.organization || "",
      organizationName: user.organizationName || "",
      builderType: user.builderType || "",
      investmentRange: user.investmentRange || "",
      focus: user.focus || [],
    }));
  }, [user]);

  const update = (field, value) =>
    setForm((previous) => ({ ...previous, [field]: value }));

  const handleFocusToggle = (sector) => {
    setForm((previous) => ({
      ...previous,
      focus: previous.focus.includes(sector)
        ? previous.focus.filter((item) => item !== sector)
        : [...previous.focus, sector],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (form.newPassword) {
        if (form.newPassword !== form.confirmPassword) {
          throw new Error("New passwords do not match");
        }
        if (form.newPassword.length < 6) {
          throw new Error("New password must be at least 6 characters");
        }
      }

      const payload = { fullName: form.fullName };
      if (user.role === "founder") payload.companyName = form.companyName;
      if (user.role === "investor") {
        payload.organization = form.organization;
        payload.investmentRange = form.investmentRange;
        payload.focus = form.focus;
      }
      if (user.role === "ecosystem_builder") {
        payload.organizationName = form.organizationName;
        payload.builderType = form.builderType;
      }
      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      await updateProfile(payload);
      setForm((previous) => ({
        ...previous,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      toast("Profile updated", "success");
    } catch (err) {
      setError(err.message || "Failed to update profile");
      toast(err.message || "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <AppShell
      title="My profile"
      subtitle={`Account · ${user.role?.replace(/_/g, " ")}`}
    >
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <SectionHeader
            icon={User}
            title="Account"
            description="Your basic account information."
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <input
                value={form.fullName}
                onChange={(event) => update("fullName", event.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                value={user.email}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
              />
            </div>
          </div>

          {user.role === "founder" && (
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Company name (optional)
              </label>
              <input
                value={form.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </section>

        {user.role === "investor" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <SectionHeader
              icon={Building2}
              title="Investor profile"
              description="The preferences used to personalize startup matches."
              tone="blue"
            />
            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Organization
                </label>
                <input
                  value={form.organization}
                  onChange={(event) => update("organization", event.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="border-t border-slate-100 pt-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Target size={16} className="text-teal-700" />
                  Investment preferences
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">
                    Investment range
                  </label>
                  <select
                    value={form.investmentRange}
                    onChange={(event) =>
                      update("investmentRange", event.target.value)
                    }
                    className={selectClass}
                  >
                    <option value="">Select range</option>
                    <option value="$10k-$50k">$10k-$50k</option>
                    <option value="$50k-$250k">$50k-$250k</option>
                    <option value="$250k-$1M">$250k-$1M</option>
                    <option value="$1M+">$1M+</option>
                  </select>
                </div>
                <div className="mt-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Focus sectors
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((sector) => (
                      <button
                        key={sector}
                        type="button"
                        onClick={() => handleFocusToggle(sector)}
                        className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                          form.focus.includes(sector)
                            ? "border-teal-500 bg-teal-50 text-teal-800"
                            : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:text-teal-700"
                        }`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {user.role === "ecosystem_builder" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <SectionHeader
              icon={Building2}
              title="Organization"
              description="Your ecosystem organization details."
              tone="blue"
            />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Organization name
                </label>
                <input
                  value={form.organizationName}
                  onChange={(event) =>
                    update("organizationName", event.target.value)
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Builder type
                </label>
                <select
                  value={form.builderType}
                  onChange={(event) => update("builderType", event.target.value)}
                  className={selectClass}
                >
                  <option value="">Select type</option>
                  {BUILDER_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <SectionHeader
            icon={Lock}
            title="Security"
            description="Update your password and protect your account."
            tone="violet"
          />
          <div className="mt-6 grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Current password
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={form.currentPassword}
                onChange={(event) => update("currentPassword", event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                New password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={form.newPassword}
                onChange={(event) => update("newPassword", event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Confirm new password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) => update("confirmPassword", event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Leave the password fields blank to keep your current password.
          </p>
        </section>

        <div>
          {error && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:bg-teal-400"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save size={16} /> Save changes
              </>
            )}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

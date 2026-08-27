import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AppShell from "../components/AppShell";
import { SECTORS } from "../data/constants";
import { User, Lock, Save, Loader2 } from "lucide-react";

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
    if (user) {
      setForm((prev) => ({
        ...prev,
        fullName: user.fullName || "",
        companyName: user.companyName || "",
        organization: user.organization || "",
        organizationName: user.organizationName || "",
        builderType: user.builderType || "",
        investmentRange: user.investmentRange || "",
        focus: user.focus || [],
      }));
    }
  }, [user]);

  const handleFocusToggle = (sector) => {
    setForm((prev) => {
      const exists = prev.focus.includes(sector);
      return {
        ...prev,
        focus: exists
          ? prev.focus.filter((s) => s !== sector)
          : [...prev.focus, sector],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      if (user.role === "founder") {
        payload.companyName = form.companyName;
      }
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
      setForm((prev) => ({
        ...prev,
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
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <User size={18} className="text-teal-700" />
            <h2 className="font-semibold text-slate-900">Account</h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Full name
            </label>
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              value={user.email}
              disabled
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500"
            />
          </div>

          {user.role === "founder" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Company name (optional)
              </label>
              <input
                value={form.companyName}
                onChange={(e) =>
                  setForm({ ...form, companyName: e.target.value })
                }
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          {user.role === "investor" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization
                </label>
                <input
                  value={form.organization}
                  onChange={(e) =>
                    setForm({ ...form, organization: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Investment range
                </label>
                <select
                  value={form.investmentRange}
                  onChange={(e) =>
                    setForm({ ...form, investmentRange: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select range</option>
                  <option value="$10k–$50k">$10k–$50k</option>
                  <option value="$50k–$250k">$50k–$250k</option>
                  <option value="$250k–$1M">$250k–$1M</option>
                  <option value="$1M+">$1M+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Focus sectors
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sector) => (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => handleFocusToggle(sector)}
                      className={`px-3 py-1.5 text-xs rounded-full border ${
                        form.focus.includes(sector)
                          ? "bg-teal-50 border-teal-500 text-teal-800"
                          : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {user.role === "ecosystem_builder" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization name
                </label>
                <input
                  value={form.organizationName}
                  onChange={(e) =>
                    setForm({ ...form, organizationName: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Builder type
                </label>
                <select
                  value={form.builderType}
                  onChange={(e) =>
                    setForm({ ...form, builderType: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select type</option>
                  {BUILDER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-5 border-b border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-teal-700" />
            <h2 className="font-semibold text-slate-900">Change password</h2>
          </div>
          <p className="text-xs text-slate-500">
            Leave blank to keep your current password
          </p>
          <input
            type="password"
            placeholder="Current password"
            autoComplete="current-password"
            value={form.currentPassword}
            onChange={(e) =>
              setForm({ ...form, currentPassword: e.target.value })
            }
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="password"
            placeholder="New password"
            autoComplete="new-password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="px-6 py-5">
          {error && (
            <p className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-semibold rounded-xl"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Saving…
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
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import { COUNTRIES } from "../../data/constants";
import {
  Loader2,
  Save,
  ChevronDown,
  Building2,
  Landmark,
  Rocket,
  Lightbulb,
  Globe2,
  GraduationCap,
  Microscope,
  Handshake,
  BriefcaseBusiness,
  Factory,
} from "lucide-react";

const TYPES = [
  { value: "incubator", label: "Incubator" },
  { value: "accelerator", label: "Accelerator" },
  { value: "coworking", label: "Coworking / hub" },
  { value: "angel_network", label: "Angel network" },
  { value: "university", label: "University" },
  { value: "research", label: "Research center" },
  { value: "ngo", label: "NGO" },
  { value: "other", label: "Other" },
];

const LOGO_OPTIONS = [
  { value: "building", Icon: Building2, label: "Building" },
  { value: "landmark", Icon: Landmark, label: "Institution" },
  { value: "rocket", Icon: Rocket, label: "Startup" },
  { value: "lightbulb", Icon: Lightbulb, label: "Innovation" },
  { value: "globe", Icon: Globe2, label: "Global" },
  { value: "education", Icon: GraduationCap, label: "Education" },
  { value: "research", Icon: Microscope, label: "Research" },
  { value: "partnership", Icon: Handshake, label: "Partnership" },
  { value: "business", Icon: BriefcaseBusiness, label: "Business" },
  { value: "factory", Icon: Factory, label: "Industry" },
];

const getLogoOption = (value) =>
  LOGO_OPTIONS.find((option) => option.value === value) || LOGO_OPTIONS[0];

const empty = {
  organizationName: "",
  logo: "building",
  builderType: "incubator",
  description: "",
  country: "Ethiopia",
  location: "",
  website: "",
  licenseInfo: "",
  resources: {
    space: false,
    mentorship: false,
    fundingSupport: false,
    training: false,
    networking: false,
    other: "",
  },
};

export default function BuilderApplication() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest("/ecosystem-builders/my");
        const b = res.data;
        setForm({
          organizationName: b.organizationName || "",
          logo: b.logo || "building",
          builderType: b.builderType || "incubator",
          description: b.description || "",
          country: b.country || "Ethiopia",
          location: b.location || "",
          website: b.website || "",
          licenseInfo: b.licenseInfo || "",
          resources: {
            space: !!b.resources?.space,
            mentorship: !!b.resources?.mentorship,
            fundingSupport: !!b.resources?.fundingSupport,
            training: !!b.resources?.training,
            networking: !!b.resources?.networking,
            other: b.resources?.other || "",
          },
        });
        setIsUpdate(true);
      } catch {
        setIsUpdate(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const onDoc = (e) => {
      if (logoRef.current && !logoRef.current.contains(e.target)) {
        setLogoOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const setRes = (key, value) => {
    setForm((prev) => ({
      ...prev,
      resources: { ...prev.resources, [key]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isUpdate) {
        await apiRequest("/ecosystem-builders/my", { method: "PUT", body: form });
        toast("Application updated", "success");
      } else {
        await apiRequest("/ecosystem-builders", { method: "POST", body: form });
        toast("Application submitted for MinT review", "success");
      }
      navigate("/builder");
    } catch (err) {
      toast(err.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell title="Application">
        <div className="py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={isUpdate ? "Edit application" : "Ecosystem builder application"}
      subtitle="Pending → Reviewer under review → Admin designation"
    >
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5"
      >
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Organization name *
            </label>
            <input
              required
              value={form.organizationName}
              onChange={(e) => setForm({ ...form, organizationName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div ref={logoRef} className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
            <button
              type="button"
              onClick={() => setLogoOpen((o) => !o)}
              className="w-full h-[42px] flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-2xl"
              title="Click to choose logo"
            >
              {(() => {
                const { Icon } = getLogoOption(form.logo);
                return <Icon className="w-5 h-5 text-teal-700" />;
              })()}
              <ChevronDown size={14} className="text-slate-400" />
            </button>
            {logoOpen && (
              <div className="absolute z-20 mt-1 left-0 right-0 sm:min-w-[200px] p-2 rounded-xl border border-slate-200 bg-white shadow-lg grid grid-cols-5 gap-1">
                {LOGO_OPTIONS.map(({ value, Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, logo: value });
                      setLogoOpen(false);
                    }}
                    className={`h-10 rounded-lg hover:bg-teal-50 flex items-center justify-center ${
                      form.logo === value ? "bg-teal-50 ring-1 ring-teal-400" : ""
                    }`}
                    title={label}
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5 text-teal-700" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
          <select
            value={form.builderType}
            onChange={(e) => setForm({ ...form, builderType: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="What you do for startups…"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Country *</label>
            <select
              required
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
          <input
            type="url"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            placeholder="https://"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            License / registration info
          </label>
          <input
            value={form.licenseInfo}
            onChange={(e) => setForm({ ...form, licenseInfo: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Resources you offer</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {[
              ["space", "Space"],
              ["mentorship", "Mentorship"],
              ["fundingSupport", "Funding support"],
              ["training", "Training"],
              ["networking", "Networking"],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={!!form.resources[key]}
                  onChange={(e) => setRes(key, e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                {label}
              </label>
            ))}
          </div>
          <input
            value={form.resources.other}
            onChange={(e) => setRes("other", e.target.value)}
            placeholder="Other resources"
            className="mt-2 w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white text-sm font-semibold rounded-xl"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {isUpdate ? "Save changes" : "Submit for review"}
        </button>
      </form>
    </AppShell>
  );
}

import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import { SECTORS, STAGES, LOCATIONS, COUNTRIES } from "../../data/constants";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, ChevronDown } from "lucide-react";

const LOGO_EMOJIS = ["🚀", "🌱", "💳", "📚", "🏥", "⚡", "🚚", "🏦", "🛠️", "💡", "🌐", "🔬"];

const emptyForm = {
  companyName: "",
  logo: "🚀",
  oneLineDescription: "",
  sector: "FinTech",
  fundingStage: "Idea",
  country: "Ethiopia",
  location: "Addis Ababa",
  teamSize: 1,
  foundedYear: new Date().getFullYear(),
  website: "",
  problemStatement: "",
  solutionStatement: "",
  founderOwnershipPercent: "",
  isPublicCompany: false,
  dateEstablished: "",
  hasBusinessLicense: false,
  innovationDescription: "",
  productOwnershipDeclaration: false,
  legalStructure: "",
};

export default function CreateStartup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [logoOpen, setLogoOpen] = useState(false);
  const logoRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest("/startups/my");
        if (res.data) {
          setIsEdit(true);
          const d = res.data;
          setForm({
            companyName: d.companyName || "",
            logo: d.logo || "🚀",
            oneLineDescription: d.oneLineDescription || "",
            sector: d.sector || "FinTech",
            fundingStage: d.fundingStage || "Idea",
            country: d.country || "Ethiopia",
            location: d.location || "Addis Ababa",
            teamSize: d.teamSize || 1,
            foundedYear: d.foundedYear || new Date().getFullYear(),
            website: d.website || "",
            problemStatement: d.problemStatement || "",
            solutionStatement: d.solutionStatement || "",
            founderOwnershipPercent:
              d.founderOwnershipPercent != null ? d.founderOwnershipPercent : "",
            isPublicCompany: !!d.isPublicCompany,
            dateEstablished: d.dateEstablished
              ? new Date(d.dateEstablished).toISOString().slice(0, 10)
              : "",
            hasBusinessLicense: !!d.hasBusinessLicense,
            innovationDescription: d.innovationDescription || "",
            productOwnershipDeclaration: !!d.productOwnershipDeclaration,
            legalStructure: d.legalStructure || "",
          });
        }
      } catch {
        setIsEdit(false);
      } finally {
        setFetching(false);
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

  const checklist = useMemo(() => {
    const ownership = Number(form.founderOwnershipPercent);
    return [
      { ok: !Number.isNaN(ownership) && ownership >= 25, label: "Founder ownership ≥ 25%" },
      { ok: !form.isPublicCompany, label: "Not a public company" },
      {
        ok: (form.innovationDescription || form.solutionStatement || "").trim().length >= 10,
        label: "Innovation / solution described",
      },
      { ok: form.productOwnershipDeclaration === true, label: "Product ownership declared" },
      {
        ok:
          !form.hasBusinessLicense ||
          (!!form.dateEstablished &&
            (new Date() - new Date(form.dateEstablished)) / (365.25 * 86400000) <= 5),
        label: "If licensed, age ≤ 5 years",
      },
      { ok: !!(form.country && form.country.trim()), label: "Country selected" },
    ];
  }, [form]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.country) {
      setError("Country is required");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        teamSize: Number(form.teamSize),
        foundedYear: Number(form.foundedYear),
        founderOwnershipPercent:
          form.founderOwnershipPercent === ""
            ? null
            : Number(form.founderOwnershipPercent),
        dateEstablished: form.dateEstablished || null,
        strictEligibility: true,
      };

      if (isEdit) {
        await apiRequest("/startups/my", { method: "PUT", body: payload });
        toast("Application updated", "success");
      } else {
        await apiRequest("/startups", { method: "POST", body: payload });
        toast("Application submitted for MinT review", "success");
      }
      navigate("/founder");
    } catch (err) {
      setError(err.message || "Save failed");
      toast(err.message || "Save failed", "error");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AppShell title="Application">
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={isEdit ? "Edit designation application" : "Startup designation application"}
      subtitle="Aligned with Proclamation 1396/2025 · foreign startups may apply"
      actions={
        <Link
          to="/founder"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
        >
          <ArrowLeft size={16} /> Back
        </Link>
      }
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-2 space-y-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
        >
          <Section title="Company identity">
            <div className="grid sm:grid-cols-4 gap-4">
              <Field
                className="sm:col-span-3"
                label="Company name *"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
              />
              <div ref={logoRef} className="relative">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Logo</label>
                <button
                  type="button"
                  onClick={() => setLogoOpen((o) => !o)}
                  className="w-full h-[42px] flex items-center justify-center gap-1 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-2xl"
                  title="Click to choose logo"
                >
                  <span>{form.logo || "🚀"}</span>
                  <ChevronDown size={14} className="text-slate-400" />
                </button>
                {logoOpen && (
                  <div className="absolute z-20 mt-1 left-0 right-0 sm:min-w-[220px] p-2 rounded-xl border border-slate-200 bg-white shadow-lg grid grid-cols-4 gap-1">
                    {LOGO_EMOJIS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, logo: em }));
                          setLogoOpen(false);
                        }}
                        className={`h-10 text-xl rounded-lg hover:bg-teal-50 ${
                          form.logo === em ? "bg-teal-50 ring-1 ring-teal-400" : ""
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <Field
              label="One-line description *"
              name="oneLineDescription"
              value={form.oneLineDescription}
              onChange={handleChange}
              required
              maxLength={200}
            />
            <div className="grid sm:grid-cols-3 gap-4">
              <Select label="Sector *" name="sector" value={form.sector} onChange={handleChange} options={SECTORS} />
              <Select label="Funding stage *" name="fundingStage" value={form.fundingStage} onChange={handleChange} options={STAGES} />
              <Select label="Country *" name="country" value={form.country} onChange={handleChange} options={COUNTRIES} />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Select label="City / location *" name="location" value={form.location} onChange={handleChange} options={LOCATIONS} />
              <Field type="number" label="Team size" name="teamSize" value={form.teamSize} onChange={handleChange} min={1} />
              <Field type="number" label="Founded year" name="foundedYear" value={form.foundedYear} onChange={handleChange} />
            </div>
            <Field label="Website" name="website" value={form.website} onChange={handleChange} placeholder="https://" />
          </Section>

          <Section title="Problem & solution">
            <TextArea label="Problem statement *" name="problemStatement" value={form.problemStatement} onChange={handleChange} required rows={3} />
            <TextArea label="Solution statement *" name="solutionStatement" value={form.solutionStatement} onChange={handleChange} required rows={3} />
            <TextArea
              label="Innovation description"
              name="innovationDescription"
              value={form.innovationDescription}
              onChange={handleChange}
              rows={3}
            />
          </Section>

          <Section title="Legal eligibility (Proclamation 1396/2025)">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                type="number"
                label="Founder ownership % *"
                name="founderOwnershipPercent"
                value={form.founderOwnershipPercent}
                onChange={handleChange}
                min={0}
                max={100}
                placeholder="Minimum 25"
              />
              <Select
                label="Legal structure"
                name="legalStructure"
                value={form.legalStructure}
                onChange={handleChange}
                options={[
                  { value: "", label: "Select…" },
                  { value: "sole_proprietor", label: "Sole proprietor" },
                  { value: "private_limited", label: "Private limited" },
                  { value: "partnership", label: "Partnership" },
                  { value: "other", label: "Other" },
                ]}
              />
              <Field type="date" label="Date established" name="dateEstablished" value={form.dateEstablished} onChange={handleChange} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="isPublicCompany" checked={form.isPublicCompany} onChange={handleChange} className="rounded border-slate-300" />
              This is a public company (not eligible)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="hasBusinessLicense" checked={form.hasBusinessLicense} onChange={handleChange} className="rounded border-slate-300" />
              Already has a business license
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="productOwnershipDeclaration" checked={form.productOwnershipDeclaration} onChange={handleChange} className="rounded border-slate-300" />
              I declare product / IP ownership as required
            </label>
          </Section>

          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold rounded-xl"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Saving…
              </>
            ) : isEdit ? (
              "Save application"
            ) : (
              "Submit for MinT designation review"
            )}
          </button>
        </form>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit sticky top-24">
          <h3 className="font-semibold text-slate-900 mb-3">Live eligibility checklist</h3>
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-2 text-sm">
                {c.ok ? (
                  <CheckCircle2 size={16} className="text-teal-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-slate-300 mt-0.5 shrink-0" />
                )}
                <span className={c.ok ? "text-slate-800" : "text-slate-500"}>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      />
    </div>
  );
}

function TextArea({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o
  );
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <select
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm bg-white"
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
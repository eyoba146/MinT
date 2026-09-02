import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import AppShell from "../../components/AppShell";
import { SECTORS, STAGES, LOCATIONS, COUNTRIES } from "../../data/constants";
import { getApiBase } from "../../utils/api";
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Save,
  Send,
  ImageIcon,
  FileText,
  Info,
} from "lucide-react";

const emptyForm = {
  companyName: "",
  description: "",
  productServiceType: "",
  sector: "FinTech",
  fundingStage: "Idea",
  country: "Ethiopia",
  location: "Addis Ababa",
  teamSize: 1,
  foundedYear: new Date().getFullYear(),
  website: "",
  problemStatement: "",
  solutionStatement: "",
  innovationDescription: "",
  techEnabledDescription: "",
  scalabilityDescription: "",
  marketChangingDescription: "",
  economicValueFactors: [],
  founderOwnershipPercent: "",
  isPublicCompany: false,
  dateEstablished: "",
  hasBusinessLicense: false,
  legalStructure: "",
  productOwnershipDeclaration: false,
};

const ECONOMIC_FACTORS = [
  { value: "efficiency_productivity", label: "Efficiency & Productivity" },
  { value: "job_creation", label: "Job Creation" },
  { value: "export_growth", label: "Export Growth & Diversification" },
  { value: "innovation", label: "Innovation" },
  { value: "social_welfare", label: "Social Welfare Enhancement" },
];

const PRODUCT_TYPES = [
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "process", label: "Process" },
];

const LEGAL_STRUCTURES = [
  { value: "", label: "Select…" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "private_limited_company", label: "Private Limited Company" },
  { value: "partnership", label: "Partnership" },
  { value: "share_company", label: "Share Company" },
  { value: "other", label: "Other" },
];

const apiBase = import.meta.env.VITE_API_URL || "";

async function submitWithFiles(path, method, jsonData, files) {
  const token = localStorage.getItem("dih_token") || "";
  const apiBase = getApiBase();
  const formData = new FormData();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 30000);

  Object.entries(jsonData).forEach(([key, value]) => {
    if (value === null || value === undefined) return;
    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(key, v));
    } else {
      formData.append(key, String(value));
    }
  });

  if (files.logo) formData.append("logo", files.logo);
  if (files.affidavit) formData.append("affidavit", files.affidavit);

  let res;
  try {
    res = await fetch(`${apiBase}${path}`, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("File upload timed out after 30 seconds. Please try again.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  // Handle empty or non-JSON responses gracefully
  let data;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = { message: "Server returned invalid JSON" };
    }
  } else {
    const text = await res.text();
    data = {
      message: text
        ? `Server error (${res.status}): ${text.slice(0, 200)}`
        : `Server error (${res.status}). No response body.`,
    };
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}

export default function CreateStartup() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submissionStep, setSubmissionStep] = useState("");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [affidavitFile, setAffidavitFile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest("/startups/my");
        if (res.data) {
          setIsEdit(true);
          const d = res.data;
          setForm({
            companyName: d.companyName || "",
            description: d.description || d.oneLineDescription || "",
            productServiceType: d.productServiceType || "",
            sector: d.sector || "FinTech",
            fundingStage: d.fundingStage || "Idea",
            country: d.country || "Ethiopia",
            location: d.location || "Addis Ababa",
            teamSize: d.teamSize || 1,
            foundedYear: d.foundedYear || new Date().getFullYear(),
            website: d.website || "",
            problemStatement: d.problemStatement || "",
            solutionStatement: d.solutionStatement || "",
            innovationDescription: d.innovationDescription || "",
            techEnabledDescription: d.techEnabledDescription || "",
            scalabilityDescription: d.scalabilityDescription || "",
            marketChangingDescription: d.marketChangingDescription || "",
            economicValueFactors: d.economicValueFactors || [],
            founderOwnershipPercent:
              d.founderOwnershipPercent != null
                ? d.founderOwnershipPercent
                : "",
            isPublicCompany: !!d.isPublicCompany,
            dateEstablished: d.dateEstablished
              ? new Date(d.dateEstablished).toISOString().slice(0, 10)
              : "",
            hasBusinessLicense: !!d.hasBusinessLicense,
            legalStructure: d.legalStructure || "",
            productOwnershipDeclaration: !!d.productOwnershipDeclaration,
          });
          if (d.logo && String(d.logo).startsWith("http")) {
            setLogoPreview(d.logo);
          }
        }
      } catch {
        setIsEdit(false);
      } finally {
        setFetching(false);
      }
    };
    load();
  }, []);

  const checklist = useMemo(() => {
    const ownership = Number(form.founderOwnershipPercent);
    return [
      {
        ok: !Number.isNaN(ownership) && ownership >= 25,
        label: "Founder ownership ≥ 25%",
      },
      { ok: !form.isPublicCompany, label: "Not a public company" },
      {
        ok: (form.description || "").trim().length >= 10,
        label: "Company description provided",
      },
      {
        ok: (form.problemStatement || "").trim().length >= 10,
        label: "Problem statement provided",
      },
      {
        ok: (form.solutionStatement || "").trim().length >= 10,
        label: "Solution statement provided",
      },
      {
        ok: (form.innovationDescription || "").trim().length >= 20,
        label: "Innovation described (min 20 chars)",
      },
      {
        ok: (form.techEnabledDescription || "").trim().length >= 20,
        label: "Technology-enabled described (min 20 chars)",
      },
      {
        ok: (form.scalabilityDescription || "").trim().length >= 20,
        label: "Scalability described (min 20 chars)",
      },
      {
        ok: (form.marketChangingDescription || "").trim().length >= 20,
        label: "Market-changing nature described (min 20 chars)",
      },
      {
        ok: form.economicValueFactors.length > 0,
        label: "Economic value factors selected",
      },
      {
        ok: ["product", "service", "process"].includes(form.productServiceType),
        label: "Product/service/process type selected",
      },
      {
        ok: form.productOwnershipDeclaration === true,
        label: "Product ownership declared",
      },
      { ok: !!affidavitFile, label: "Ownership affidavit uploaded" },
      {
        ok:
          !form.hasBusinessLicense ||
          (!!form.dateEstablished &&
            (new Date() - new Date(form.dateEstablished)) /
              (365.25 * 86400000) <=
              5),
        label: "If licensed, age ≤ 5 years",
      },
    ];
  }, [form, affidavitFile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleMultiSelect = (e) => {
    const { value, checked } = e.target;
    setForm((prev) => {
      const current = prev.economicValueFactors || [];
      if (checked)
        return { ...prev, economicValueFactors: [...current, value] };
      return {
        ...prev,
        economicValueFactors: current.filter((v) => v !== value),
      };
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (!files || !files[0]) return;
    if (name === "logoFile") {
      setLogoFile(files[0]);
      setLogoPreview(URL.createObjectURL(files[0]));
    } else if (name === "affidavitFile") {
      setAffidavitFile(files[0]);
    }
  };

  const buildPayload = () => ({
    companyName: form.companyName,
    description: form.description,
    oneLineDescription: form.description,
    productServiceType: form.productServiceType,
    sector: form.sector,
    fundingStage: form.fundingStage,
    country: form.country,
    location: form.location,
    teamSize: Number(form.teamSize),
    foundedYear: Number(form.foundedYear),
    website: form.website,
    problemStatement: form.problemStatement,
    solutionStatement: form.solutionStatement,
    innovationDescription: form.innovationDescription,
    techEnabledDescription: form.techEnabledDescription,
    scalabilityDescription: form.scalabilityDescription,
    marketChangingDescription: form.marketChangingDescription,
    economicValueFactors: form.economicValueFactors,
    founderOwnershipPercent:
      form.founderOwnershipPercent === ""
        ? null
        : Number(form.founderOwnershipPercent),
    isPublicCompany: form.isPublicCompany,
    dateEstablished: form.dateEstablished || null,
    hasBusinessLicense: form.hasBusinessLicense,
    legalStructure: form.legalStructure,
    productOwnershipDeclaration: form.productOwnershipDeclaration,
  });

  const handleSaveDraft = async () => {
    setError("");
    setLoading(true);
    setSubmissionStep("Saving your draft…");
    try {
      const payload = buildPayload();
      const files = {};
      if (logoFile) files.logo = logoFile;
      if (affidavitFile) files.affidavit = affidavitFile;

      const hasFiles = Object.keys(files).length > 0;
      if (hasFiles) {
        setSubmissionStep("Uploading your files…");
        await submitWithFiles(
          isEdit ? "/startups/my" : "/startups",
          isEdit ? "PUT" : "POST",
          payload,
          files,
        );
      } else {
        await apiRequest(isEdit ? "/startups/my" : "/startups", {
          method: isEdit ? "PUT" : "POST",
          body: payload,
        });
      }

      toast(isEdit ? "Draft updated" : "Draft saved", "success");
      navigate("/founder");
    } catch (err) {
      setError(err.message || "Save failed");
      toast(err.message || "Save failed", "error");
    } finally {
      setLoading(false);
      setSubmissionStep("");
    }
  };

  const handleSubmitForReview = async () => {
    setError("");
    const failed = checklist.filter((c) => !c.ok);
    if (failed.length > 0) {
      setError(
        `Please complete all eligibility requirements before submitting. Missing: ${failed
          .slice(0, 3)
          .map((f) => f.label)
          .join(", ")}`,
      );
      return;
    }

    setLoading(true);
    try {
      const payload = buildPayload();
      const files = {};
      if (logoFile) files.logo = logoFile;
      if (affidavitFile) files.affidavit = affidavitFile;

      const hasFiles = Object.keys(files).length > 0;
      if (hasFiles) {
        setSubmissionStep("Uploading your files…");
        await submitWithFiles(
          isEdit ? "/startups/my" : "/startups",
          isEdit ? "PUT" : "POST",
          payload,
          files,
        );
      } else {
        setSubmissionStep("Saving your application…");
        await apiRequest(isEdit ? "/startups/my" : "/startups", {
          method: isEdit ? "PUT" : "POST",
          body: payload,
        });
      }

      setSubmissionStep("Sending application for review…");
      await apiRequest("/startups/my/submit", {
        method: "POST",
        timeoutMs: 30000,
      });

      toast("Submitted for MinT designation review", "success");
      navigate("/founder");
    } catch (err) {
      setError(err.message || "Submission failed");
      toast(err.message || "Submission failed", "error");
    } finally {
      setLoading(false);
      setSubmissionStep("");
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
      title={
        isEdit
          ? "Edit designation application"
          : "Startup designation application"
      }
      subtitle="MinT designation under Proclamation 1396/2025"
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
        <div className="lg:col-span-2 space-y-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          {/* ── Company Identity ── */}
          <Section title="Company identity" icon={<ImageIcon size={16} />}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="Company name *"
                name="companyName"
                value={form.companyName}
                onChange={handleChange}
                required
              />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Company Logo *
                </label>
                <input
                  type="file"
                  name="logoFile"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                />
                {logoPreview && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-12 w-12 object-contain rounded-lg border border-slate-200"
                    />
                    <span className="text-xs text-slate-500">Logo preview</span>
                  </div>
                )}
              </div>
            </div>

            <TextArea
              label="Company description *"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={2}
              placeholder="Brief description of your company (max 500 characters)"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Product / Service / Process type *
              </label>
              <div className="flex flex-wrap gap-4">
                {PRODUCT_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="radio"
                      name="productServiceType"
                      value={type.value}
                      checked={form.productServiceType === type.value}
                      onChange={handleChange}
                      className="border-slate-300"
                    />
                    {type.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Select
                label="Sector *"
                name="sector"
                value={form.sector}
                onChange={handleChange}
                options={SECTORS}
              />
              <Select
                label="Funding stage *"
                name="fundingStage"
                value={form.fundingStage}
                onChange={handleChange}
                options={STAGES}
              />
              <Select
                label="Country *"
                name="country"
                value={form.country}
                onChange={handleChange}
                options={COUNTRIES}
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <Select
                label="City / location *"
                name="location"
                value={form.location}
                onChange={handleChange}
                options={LOCATIONS}
              />
              <Field
                type="number"
                label="Team size"
                name="teamSize"
                value={form.teamSize}
                onChange={handleChange}
                min={1}
              />
              <Field
                type="number"
                label="Founded year"
                name="foundedYear"
                value={form.foundedYear}
                onChange={handleChange}
              />
            </div>
            <Field
              label="Website"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://"
            />
          </Section>

          {/* ── Problem & Solution ── */}
          <Section title="Problem & solution">
            <TextArea
              label="Problem statement *"
              name="problemStatement"
              value={form.problemStatement}
              onChange={handleChange}
              required
              rows={3}
            />
            <TextArea
              label="Solution statement *"
              name="solutionStatement"
              value={form.solutionStatement}
              onChange={handleChange}
              required
              rows={3}
            />
          </Section>

          {/* ── Article 7: Innovation & Technology ── */}
          <Section
            title="Innovation & technology (Proclamation Art. 7)"
            icon={<Info size={16} />}
          >
            <p className="text-xs text-slate-500 -mt-2 mb-2">
              MinT designation requires proof that your startup is
              innovation-driven, technology-enabled, scalable, and
              market-changing.
            </p>
            <TextArea
              label="Innovation description *"
              name="innovationDescription"
              value={form.innovationDescription}
              onChange={handleChange}
              required
              rows={3}
              placeholder="What is novel about your product, service, or process?"
            />
            <TextArea
              label="Technology-enabled description *"
              name="techEnabledDescription"
              value={form.techEnabledDescription}
              onChange={handleChange}
              required
              rows={3}
              placeholder="How does technology enable or enhance your solution?"
            />
            <TextArea
              label="Scalability description *"
              name="scalabilityDescription"
              value={form.scalabilityDescription}
              onChange={handleChange}
              required
              rows={3}
              placeholder="How can your solution grow its market share at low marginal cost?"
            />
            <TextArea
              label="Market-changing description *"
              name="marketChangingDescription"
              value={form.marketChangingDescription}
              onChange={handleChange}
              required
              rows={3}
              placeholder="How does your solution change or create the market?"
            />

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Economic value factors *{" "}
                <span className="text-slate-400 font-normal">
                  (select all that apply)
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ECONOMIC_FACTORS.map((factor) => (
                  <label
                    key={factor.value}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      value={factor.value}
                      checked={form.economicValueFactors.includes(factor.value)}
                      onChange={handleMultiSelect}
                      className="rounded border-slate-300"
                    />
                    {factor.label}
                  </label>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Legal Eligibility ── */}
          <Section
            title="Legal eligibility (Proclamation Art. 7)"
            icon={<FileText size={16} />}
          >
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
                options={LEGAL_STRUCTURES}
              />
              <Field
                type="date"
                label="Date established"
                name="dateEstablished"
                value={form.dateEstablished}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="isPublicCompany"
                  checked={form.isPublicCompany}
                  onChange={handleChange}
                  className="rounded border-slate-300"
                />
                This is a public company{" "}
                <span className="text-red-500 font-medium">(not eligible)</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="hasBusinessLicense"
                  checked={form.hasBusinessLicense}
                  onChange={handleChange}
                  className="rounded border-slate-300"
                />
                Already has a business license
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  name="productOwnershipDeclaration"
                  checked={form.productOwnershipDeclaration}
                  onChange={handleChange}
                  className="rounded border-slate-300"
                />
                I declare product / IP ownership as required by Art. 7(2)(a)
              </label>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Ownership affidavit / signed declaration *
              </label>
              <input
                type="file"
                name="affidavitFile"
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
              />
              <p className="text-xs text-slate-500 mt-1">
                Upload a signed affidavit or document proving ownership of the
                product, service, or process.
              </p>
            </div>
          </Section>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {loading && submissionStep && (
            <div className="text-sm text-teal-800 bg-teal-50 px-4 py-3 rounded-xl border border-teal-100">
              <div className="flex items-center gap-2 font-medium">
                <Loader2 size={16} className="animate-spin" />
                {submissionStep}
              </div>
              <p className="mt-1 text-xs text-teal-700">
                Please keep this page open. You will see a success message or a
                specific error here when the request finishes.
              </p>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 font-semibold rounded-xl"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {loading && submissionStep ? submissionStep : isEdit ? "Update draft" : "Save as draft"}
            </button>
            <button
              type="button"
              onClick={handleSubmitForReview}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold rounded-xl"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}
              {loading && submissionStep ? submissionStep : "Submit for designation review"}
            </button>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h4 className="font-medium text-slate-900 mb-1 flex items-center gap-2">
              <Info size={14} /> What happens next?
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              After submission, the National Designation Committee will review
              your application against Proclamation 1396/2025 criteria. You may
              receive a clarification request. If designated, your startup
              becomes eligible for grants, tax incentives, duty-free imports,
              and credit guarantees for two years (renewable up to eight years).
            </p>
          </div>
        </div>

        {/* ── Sidebar Checklist ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit sticky top-24">
          <h3 className="font-semibold text-slate-900 mb-3">
            Live eligibility checklist
          </h3>
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-start gap-2 text-sm">
                {c.ok ? (
                  <CheckCircle2
                    size={16}
                    className="text-teal-600 mt-0.5 shrink-0"
                  />
                ) : (
                  <XCircle
                    size={16}
                    className="text-slate-300 mt-0.5 shrink-0"
                  />
                )}
                <span className={c.ok ? "text-slate-800" : "text-slate-500"}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

function Section({ title, icon, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
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
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      <textarea
        {...props}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
      />
    </div>
  );
}

function Select({ label, options, ...props }) {
  const normalized = options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
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

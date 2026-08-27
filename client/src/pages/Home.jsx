import { useState } from "react";
import { Link } from "react-router-dom";
import { useDesignation } from "../context/DesignationContext";
import { useAuth } from "../context/AuthContext";
import ThreeHeroCanvas from "../components/common/ThreeHeroCanvas";
import StatusBadge from "../components/common/StatusBadge";
import LiveEligibilityChecklist from "../components/common/LiveEligibilityChecklist";
import Modal from "../components/common/Modal";
import CertificateView from "../components/common/CertificateView";
import {
  Award,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Network,
  Zap,
  Check,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const { applications, proclamation, stats } = useDesignation();
  const { user, isAuthenticated } = useAuth();
  const [quickCheckModal, setQuickCheckModal] = useState(false);
  const [previewCertApp, setPreviewCertApp] = useState(null);

  const [quickFormData, setQuickFormData] = useState({
    legalName: "My Ethiopian Tech Venture",
    regDate: "2023-05-12",
    sector: "FinTech",
    tin: "0099887766",
    commercialRegNo: "ET/AA/2023/1234",
    problemStatement: "Solving logistics bottleneck across Ethiopian regions.",
    innovationDescription:
      "Proprietary software platform optimizing multi-modal supply chains with automated settlement.",
    ethiopianOwnershipPercent: 80,
    annualRevenueETB: 8500000,
    fullTimeEmployees: 14,
    iprStatus: "Registered with EIPA",
  });

  const designatedList = (applications || []).filter(
    (a) => a.status === "designated" || a.status === "verified" || !a.status
  );

  const tiers = proclamation?.incentiveTiers || [
    { tier: "Tax incentives", desc: "Access pathways to profit tax relief for designated startups.", category: "Fiscal" },
    { tier: "FX prioritization", desc: "Support for foreign exchange allocation where applicable.", category: "Finance" },
    { tier: "Investor visibility", desc: "Appear in the official designated startup registry.", category: "Market" },
    { tier: "Digital certificate", desc: "Receive a verifiable MinT designation certificate.", category: "Trust" },
  ];

  return (
    <div className="relative overflow-hidden bg-slate-50 min-h-screen">
      {/* HERO */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-12 pb-20 bg-gradient-to-b from-slate-950 via-teal-950 to-slate-950 text-white">
        <ThreeHeroCanvas className="opacity-60" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-400/30 bg-teal-500/10 text-teal-200 text-sm font-semibold backdrop-blur-md shadow-sm">
            <ShieldCheck className="w-4 h-4 text-teal-300" />
            <span>Official MinT Digital Portal</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Accelerating{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-200 via-cyan-200 to-amber-300">
              Digital Innovation
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 leading-relaxed">
            Connect Ethiopian startups, investors, and ecosystem builders. Apply for official
            designation, unlock incentives, and grow with a trusted national innovation platform.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to={
                isAuthenticated
                  ? user?.role === "founder"
                    ? "/founder/create"
                    : "/register"
                  : "/register"
              }
              className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-sm transition-all shadow-xl shadow-teal-900/50 hover:scale-[1.02] flex items-center gap-2"
            >
              <Award className="w-4 h-4" />
              <span>Apply for Designation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              onClick={() => setQuickCheckModal(true)}
              className="px-6 py-3.5 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all shadow-sm flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Check Eligibility</span>
            </button>

            <Link
              to="/directory"
              className="px-6 py-3.5 rounded-2xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition-all"
            >
              Explore Registry
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-slate-800 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {stats?.verifiedStartups || designatedList.length}+
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Designated
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">3 Years</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                Tax Pathway
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">Fast-Track</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                FX Support
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-2xl sm:text-3xl font-extrabold text-white">100% Digital</div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-1">
                Certificates
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-900 text-sm font-semibold">
            <Zap className="w-3.5 h-3.5" />
            <span>Platform Benefits</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            What designation unlocks
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Official recognition, visibility to investors, and access to support pathways for
            Ethiopian innovation enterprises.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:border-teal-500 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center font-extrabold mb-4 group-hover:scale-110 transition-transform">
                  0{idx + 1}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{tier.tier}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{tier.desc}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-800">
                <span>{tier.category}</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DESIGNATED SPOTLIGHT */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Verified registry
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Recently designated startups
            </h2>
          </div>
          <Link
            to="/directory"
            className="flex items-center gap-1.5 text-sm font-bold text-teal-800 hover:text-teal-950 hover:underline"
          >
            <span>View all ({designatedList.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {designatedList.slice(0, 3).map((app) => (
            <div
              key={app.id || app._id}
              className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:border-teal-500 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-800 text-xs font-bold">
                    {app.sector || "Tech"}
                  </span>
                  <StatusBadge status={app.status || "designated"} size="sm" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {app.legalName || app.name || app.companyName}
                  </h3>
                  {app.tradeName && (
                    <p className="text-sm text-teal-800 font-medium">&ldquo;{app.tradeName}&rdquo;</p>
                  )}
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {app.innovationDescription ||
                    app.problemStatement ||
                    app.oneLineDescription ||
                    app.description}
                </p>
                <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>Headquarters</span>
                    <span className="font-medium text-slate-800">
                      {app.headquarters || app.location || "Addis Ababa"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setPreviewCertApp(app)}
                  className="text-sm font-semibold text-teal-800 hover:underline flex items-center gap-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Certificate</span>
                </button>
                <Link
                  to={`/directory/${app.id || app._id}`}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <span>Full profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {designatedList.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">
              No designated startups to show yet. Apply to be among the first.
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-slate-950 border border-teal-500/30 text-white relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-sm font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Get started</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Start your designation journey
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Whether you are building a startup or running an incubator, MinT provides digital
              accreditation and a trusted national registry.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/register"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-teal-900/50 transition-all flex items-center gap-2"
              >
                <span>Apply as startup</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/builders"
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm backdrop-blur-md transition-all flex items-center gap-2"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Explore ecosystem builders</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LIFECYCLE */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 text-teal-800 text-xs font-bold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-4 h-4" />
                <span>Clear process</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                Transparent designation lifecycle
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6 text-sm sm:text-base">
                From application to certificate: a structured review with clear status updates and
                secure document handling.
              </p>
              <div className="space-y-3">
                {[
                  "Eligibility check and document submission",
                  "Review by MinT officers within a defined timeline",
                  "Decision: designate, request more info, or reject",
                  "Digital certificate and public registry listing",
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-6 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-sm font-bold text-slate-800">
                <span>Application steps</span>
              </div>
              {[
                { title: "1. Online submission", desc: "Company details, sector, and supporting documents." },
                { title: "2. Technical & legal review", desc: "MinT reviews eligibility and innovation value." },
                { title: "3. Designation decision", desc: "Approve, request more information, or reject." },
                { title: "4. Certificate issued", desc: "Digital certificate and registry visibility." },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center text-xs font-extrabold shrink-0 border border-teal-200">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{step.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ELIGIBILITY MODAL */}
      <Modal
        isOpen={quickCheckModal}
        onClose={() => setQuickCheckModal(false)}
        title="Eligibility check"
        subtitle="Quick self-check before you apply for designation"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Registration date</label>
              <input
                type="date"
                value={quickFormData.regDate}
                onChange={(e) => setQuickFormData({ ...quickFormData, regDate: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Sector</label>
              <select
                value={quickFormData.sector}
                onChange={(e) => setQuickFormData({ ...quickFormData, sector: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="FinTech">FinTech</option>
                <option value="AgriTech">AgriTech</option>
                <option value="HealthTech">HealthTech</option>
                <option value="CleanTech">CleanTech</option>
                <option value="EdTech">EdTech</option>
                <option value="LogisticsTech">LogisticsTech</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ethiopian ownership (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={quickFormData.ethiopianOwnershipPercent}
                onChange={(e) =>
                  setQuickFormData({
                    ...quickFormData,
                    ethiopianOwnershipPercent: Number(e.target.value),
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Full-time staff</label>
              <input
                type="number"
                value={quickFormData.fullTimeEmployees}
                onChange={(e) =>
                  setQuickFormData({
                    ...quickFormData,
                    fullTimeEmployees: Number(e.target.value),
                  })
                }
                className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <LiveEligibilityChecklist formData={quickFormData} track="startup" />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => setQuickCheckModal(false)}
              className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50"
            >
              Close
            </button>
            <Link
              to="/register"
              onClick={() => setQuickCheckModal(false)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 text-white text-sm font-bold flex items-center gap-1.5 shadow-md"
            >
              <span>Proceed to apply</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!previewCertApp}
        onClose={() => setPreviewCertApp(null)}
        title="Designation certificate"
        subtitle={
          previewCertApp?.legalName ||
          previewCertApp?.name ||
          previewCertApp?.companyName ||
          "Startup"
        }
        maxWidth="max-w-4xl"
      >
        {previewCertApp && <CertificateView application={previewCertApp} />}
      </Modal>
    </div>
  );
}
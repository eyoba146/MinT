import { Shield, Award, CheckCircle2, Printer } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Official designation certificate display.
 * Uses only real application/certificate fields — never invents legal data.
 */
export default function CertificateView({ application }) {
  if (!application) return null;

  const cert = application.certificate || {};
  const certificateNumber =
    cert.certificateNumber || application.certificateNumber || null;

  const issuedAt =
    cert.issuedAt ||
    cert.issueDate ||
    application.designatedAt ||
    application.verifiedAt ||
    null;

  const expiresAt =
    cert.expiresAt ||
    cert.expiryDate ||
    application.designationExpiresAt ||
    null;

  const legalName =
    application.legalName ||
    application.startupName ||
    application.companyName ||
    application.name ||
    "—";

  const tradeName = application.tradeName || null;
  const sector = application.sector || cert.sector || null;
  const growthStage =
    application.growthStage ||
    application.fundingStage ||
    cert.growthStage ||
    null;
  const tin = application.tin || null;
  const commercialRegNo =
    application.commercialRegNo || application.registrationNumber || null;
  const headquarters =
    application.headquarters || application.location || null;

  const statusLabel =
    application.status === "suspended"
      ? "Suspended"
      : application.status === "revoked"
        ? "Revoked"
        : "Active";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="relative p-8 sm:p-12 rounded-3xl bg-white border-4 border-double border-teal-700/30 text-slate-900 shadow-xl overflow-hidden print:shadow-none print:border-2">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
          <Shield className="w-96 h-96 text-slate-900" />
        </div>

        <div className="relative z-10 text-center space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 border border-teal-200 text-teal-800 mb-2">
              <Shield className="w-8 h-8" />
            </div>
            <div className="text-xs font-bold uppercase tracking-widest text-teal-800">
              Federal Democratic Republic of Ethiopia
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-extrabold tracking-wide uppercase text-slate-900">
              Ministry of Innovation and Technology
            </h2>
            <div className="text-xs font-medium text-slate-500">
              Startup Proclamation No. 1396/2025 · Digital Innovation Hub
            </div>
          </div>

          <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-teal-600 to-transparent mx-auto" />

          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              Certificate of Startup Designation
            </div>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              This certifies that the enterprise named below has been reviewed
              under Startup Proclamation No. 1396/2025 and is designated in the
              official MinT digital registry for the validity period stated on
              this certificate.
            </p>
          </div>

          <div className="py-4 px-6 rounded-2xl bg-slate-50 border border-slate-200 max-w-xl mx-auto">
            <div className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              {legalName}
            </div>
            {tradeName && (
              <div className="text-xs font-semibold text-teal-800 mt-1">
                Trade name: &ldquo;{tradeName}&rdquo;
              </div>
            )}
            <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {sector && (
                <span>
                  Sector: <strong className="text-slate-700">{sector}</strong>
                </span>
              )}
              {growthStage && (
                <span>
                  Stage:{" "}
                  <strong className="text-slate-700">{growthStage}</strong>
                </span>
              )}
              {tin && (
                <span>
                  TIN: <strong className="text-slate-700">{tin}</strong>
                </span>
              )}
            </div>
            {(commercialRegNo || headquarters) && (
              <div className="text-xs text-slate-500 mt-1 flex flex-wrap justify-center gap-x-3">
                {commercialRegNo && (
                  <span>
                    Reg. No:{" "}
                    <strong className="text-slate-700">{commercialRegNo}</strong>
                  </span>
                )}
                {headquarters && (
                  <span>
                    Location:{" "}
                    <strong className="text-slate-700">{headquarters}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left text-xs pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                Certificate No
              </div>
              <div className="font-mono font-bold text-slate-800 mt-0.5 break-all">
                {certificateNumber || "—"}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                Date of issuance
              </div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {formatDate(issuedAt)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                Valid until
              </div>
              <div className="font-semibold text-slate-800 mt-0.5">
                {formatDate(expiresAt)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                Registry status
              </div>
              <div
                className={`font-semibold mt-0.5 flex items-center gap-1 ${
                  statusLabel === "Active"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{statusLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-teal-700/20 max-w-2xl mx-auto">
            <div className="text-left text-xs text-slate-500 max-w-xs">
              <p>
                Issued digitally via the MinT Digital Innovation Hub.
                Authenticity is confirmed by certificate number in the official
                registry.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-teal-700/40 bg-teal-50 text-teal-800 text-center p-1">
              <Award className="w-6 h-6" />
              <span className="text-[7px] font-extrabold uppercase tracking-tight leading-tight mt-0.5">
                MinT Registry
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
        >
          <Printer className="w-3.5 h-3.5" />
          Print / Save as PDF
        </button>
      </div>
    </div>
  );
}
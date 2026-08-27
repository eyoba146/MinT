import { Link } from "react-router-dom";
import StatusBadge, { OfficialDesignationSeal } from "./common/StatusBadge";
import { MapPin, Users, Award, ArrowRight, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { isDesignated } from "../utils/status";

const SECTOR_STYLES = {
  FinTech: {
    bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-50 border-emerald-100 text-emerald-700",
    icon: "💳",
  },
  AgriTech: {
    bg: "bg-green-50 text-green-800 border-green-200",
    gradient: "from-green-500 to-emerald-600",
    iconBg: "bg-green-50 border-green-100 text-green-700",
    icon: "🌱",
  },
  CleanTech: {
    bg: "bg-cyan-50 text-cyan-800 border-cyan-200",
    gradient: "from-cyan-500 to-teal-600",
    iconBg: "bg-cyan-50 border-cyan-100 text-cyan-700",
    icon: "♻️",
  },
  EdTech: {
    bg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    gradient: "from-indigo-500 to-purple-600",
    iconBg: "bg-indigo-50 border-indigo-100 text-indigo-700",
    icon: "🎓",
  },
  HealthTech: {
    bg: "bg-rose-50 text-rose-800 border-rose-200",
    gradient: "from-rose-500 to-pink-600",
    iconBg: "bg-rose-50 border-rose-100 text-rose-700",
    icon: "🩺",
  },
  LogisticsTech: {
    bg: "bg-amber-50 text-amber-800 border-amber-200",
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-50 border-amber-100 text-amber-700",
    icon: "🚚",
  },
  DeepTech: {
    bg: "bg-purple-50 text-purple-800 border-purple-200",
    gradient: "from-purple-600 to-indigo-600",
    iconBg: "bg-purple-50 border-purple-100 text-purple-700",
    icon: "⚡",
  },
  default: {
    bg: "bg-teal-50 text-teal-800 border-teal-200",
    gradient: "from-teal-600 to-emerald-600",
    iconBg: "bg-teal-50 border-teal-100 text-teal-700",
    icon: "🇪🇹",
  },
};

export default function StartupCard({ startup, to, onInspectCert }) {
  if (!startup) return null;

  const id = startup._id || startup.id;
  const href = to || `/directory/${id}`;
  const designated = isDesignated(startup.status) || startup.status === "designated" || startup.status === "verified";
  const name = startup.legalName || startup.companyName || startup.name || "Ethiopian Venture";
  const desc = startup.innovationDescription || startup.problemStatement || startup.oneLineDescription || startup.description || "";
  const sector = startup.sector || "FinTech";
  const stage = startup.fundingStage || startup.stage || "Seed";
  const location = startup.headquarters || startup.location || "Addis Ababa";
  const teamSize = startup.fullTimeEmployees || startup.teamSize;

  const sectorStyle = SECTOR_STYLES[sector] || SECTOR_STYLES.default;

  return (
    <div className="group bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-xl hover:border-teal-400/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Accent top gradient stripe */}
      <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${sectorStyle.gradient}`} />

      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl shrink-0 group-hover:scale-105 transition-transform ${sectorStyle.iconBg}`}>
              {startup.logo || sectorStyle.icon}
            </div>
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${sectorStyle.bg}`}>
                {sector}
              </span>
              <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                Stage: <span className="text-slate-600">{stage}</span>
              </div>
            </div>
          </div>

          <StatusBadge status={startup.status || "designated"} size="sm" />
        </div>

        {/* Company Title */}
        <Link to={href} className="block mt-2">
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-teal-800 transition-colors line-clamp-1">
            {name}
          </h3>
          {startup.tradeName && (
            <div className="text-xs font-bold text-teal-800 mt-0.5">
              &ldquo;{startup.tradeName}&rdquo;
            </div>
          )}
        </Link>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
          {desc}
        </p>

        {/* Location & Team Metadata */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[140px]">{location}</span>
          </span>
          {teamSize != null && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>{teamSize} Staff</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        {startup.certificateNumber || startup.certificate?.certificateNumber ? (
          <span className="font-mono text-[10px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
            {startup.certificateNumber || startup.certificate.certificateNumber}
          </span>
        ) : (
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-teal-600" />
            <span>Proc. 1396/2025</span>
          </span>
        )}

        <Link
          to={href}
          className="font-bold text-teal-800 hover:text-teal-900 flex items-center gap-1 text-xs group-hover:translate-x-0.5 transition-transform"
        >
          <span>View Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { useDesignation } from "../../context/DesignationContext";
import AppShell from "../../components/AppShell";
import StartupCard from "../../components/StartupCard";
import StatusBadge from "../../components/common/StatusBadge";
import Modal from "../../components/common/Modal";
import CertificateView from "../../components/common/CertificateView";
import {
  Loader2,
  Building2,
  Search,
  Filter,
  ShieldCheck,
  Award,
  Sparkles,
  SlidersHorizontal,
  Grid,
  List,
  RefreshCw,
} from "lucide-react";

const ALL_SECTORS = [
  "All Sectors",
  "FinTech",
  "AgriTech",
  "CleanTech",
  "EdTech",
  "HealthTech",
  "LogisticsTech",
  "DeepTech",
];

const ALL_STAGES = ["All Stages", "Idea", "Pre-seed", "Seed", "Series A"];

export default function Directory({ embedded = false }) {
  const { user, isAuthenticated } = useAuth();
  const { applications } = useDesignation();
  const navigate = useNavigate();
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("All Sectors");
  const [selectedStage, setSelectedStage] = useState("All Stages");
  const [inspectCertApp, setInspectCertApp] = useState(null);

  const detailBase =
    embedded && user?.role === "investor"
      ? "/investor/directory"
      : embedded && user?.role === "citizen"
      ? "/citizen/directory"
      : "/directory";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiRequest("/startups");
        if (Array.isArray(res.data)) {
          setStartups(res.data);
        } else if (Array.isArray(applications) && applications.length > 0) {
          setStartups(applications);
        } else {
          setStartups([]);
        }
      } catch {
        setStartups(applications || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [applications]);

  const filteredStartups = startups.filter((item) => {
    const name = (item.legalName || item.companyName || item.name || "").toLowerCase();
    const trade = (item.tradeName || "").toLowerCase();
    const desc = (item.innovationDescription || item.oneLineDescription || item.description || "").toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesQuery = !q || name.includes(q) || trade.includes(q) || desc.includes(q);

    const matchesSector =
      selectedSector === "All Sectors" ||
      (item.sector && item.sector.toLowerCase() === selectedSector.toLowerCase());

    const stage = item.fundingStage || item.stage || "Seed";
    const matchesStage =
      selectedStage === "All Stages" ||
      stage.toLowerCase() === selectedStage.toLowerCase();

    return matchesQuery && matchesSector && matchesStage;
  });

  const body = (
    <div className="space-y-8">
      {/* Sovereign Hero Banner */}
      {!embedded && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 p-8 text-white shadow-xl border border-teal-900/50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>FDRE Ministry of Innovation & Technology</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Official National Designated Startup Registry
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Audited registry of Ethiopian tech enterprises officially designated under Proclamation No. 1396/2025 with statutory benefits, verified data rooms, and sovereign certificates.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by registered company name, trade name, or innovation keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Sector Filter */}
          <div className="sm:w-48">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-teal-500 text-slate-700"
            >
              {ALL_SECTORS.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Stage Filter */}
          <div className="sm:w-40">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-teal-500 text-slate-700"
            >
              {ALL_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {stg}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Sector Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">
            Sector Filter:
          </span>
          {ALL_SECTORS.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all ${
                selectedSector === sec
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sec}
            </button>
          ))}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
        <span>
          Showing <strong>{filteredStartups.length}</strong> designated entities
        </span>
        <span className="flex items-center gap-1 text-emerald-600 font-bold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Statutorily Certified Entities</span>
        </span>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
          <span className="text-xs text-slate-500 font-medium">Querying sovereign startup database...</span>
        </div>
      ) : filteredStartups.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
            <Building2 className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No designated startups found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Startups can apply for official MinT designation under Proclamation No. 1396/2025 to appear in this public registry.
          </p>
          {(searchQuery || selectedSector !== "All Sectors" || selectedStage !== "All Stages") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSector("All Sectors");
                setSelectedStage("All Stages");
              }}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors mt-2"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStartups.map((s) => (
            <StartupCard
              key={s._id || s.id}
              startup={s}
              to={`${detailBase}/${s._id || s.id}`}
              onInspectCert={() => setInspectCertApp(s)}
            />
          ))}
        </div>
      )}

      {/* Certificate Inspector Modal */}
      <Modal
        isOpen={!!inspectCertApp}
        onClose={() => setInspectCertApp(null)}
        title="MinT Official Designation Certificate"
        subtitle={`Verified statutory accreditation for ${inspectCertApp?.legalName || inspectCertApp?.name}`}
        maxWidth="max-w-4xl"
      >
        {inspectCertApp && <CertificateView application={inspectCertApp} />}
      </Modal>
    </div>
  );

  if (embedded || (isAuthenticated && (user?.role === "investor" || user?.role === "citizen"))) {
    return (
      <AppShell title="Designated Startups" subtitle="Official Proclamation No. 1396/2025 Sovereign Registry">
        {body}
      </AppShell>
    );
  }

  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">{body}</div>;
}

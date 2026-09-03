import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../utils/api";
import AppShell from "../../components/AppShell";
import AnalyticsCharts from "../../components/AnalyticsCharts";
import {
  Building2,
  CheckCircle,
  Users,
  Loader2,
  Inbox,
  Network,
  AlertTriangle,
  TrendingUp,
  Award,
  ShieldCheck,
  DollarSign,
  Zap,
  Globe2,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileText,
  Briefcase,
  Rocket,
} from "lucide-react";

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [connectionReport, setConnectionReport] = useState(null);
  const [connectionReportLoading, setConnectionReportLoading] = useState(false);
  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await apiRequest("/startups/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load admin analytics", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const loadConnectionReport = async () => {
    setConnectionReportLoading(true);
    try {
      const res = await apiRequest("/startups/admin/connection-report");
      setConnectionReport(res.data);
    } catch (err) {
      console.error("Failed to load connection report", err);
    } finally {
      setConnectionReportLoading(false);
    }
  };
  const downloadConnectionReport = async (format) => {
    const token = localStorage.getItem("dih_token");
    if (!token) return;

    const url = `http://localhost:5000/api/startups/admin/export/connection-report?format=${format}`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `connection-report.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(err);
    }
  };
  useEffect(() => {
    loadData();
    loadConnectionReport();
  }, []);
  if (loading) {
    return (
      <AppShell title="National Innovation Analytics">
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Aggregating sovereign ecosystem metrics...
          </p>
        </div>
      </AppShell>
    );
  }

  // Derive calculated metrics
  const total = stats?.totalStartups || 0;
  const verified = stats?.designated || 0; // was stats?.verified
  const pending =
    (stats?.submitted || 0) +
    (stats?.underReview || 0) +
    (stats?.clarificationNeeded || 0); // was stats?.pending
  const overdue = stats?.overdue || 0;
  const investors = stats?.totalInvestors || 0;
  const founders = stats?.totalFounders || 0;
  const builders = stats?.totalBuilders || 0;
  const designatedBuilders = stats?.designatedBuilders || 0;

  const verificationRate = total > 0 ? Math.round((verified / total) * 100) : 0;
  const slaCompliance =
    total > 0
      ? Math.max(0, 100 - Math.round((overdue / (total || 1)) * 100))
      : 100;

  return (
    <AppShell
      title="National Innovation Analytics"
      subtitle={`Proclamation No. 1396/2025 Sovereign Monitoring & Intelligence`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs transition-all active:scale-95"
            title="Refresh analytics data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-teal-600" : "text-slate-400"}`}
            />
            <span className="hidden sm:inline">Refresh Data</span>
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* ===================== HERO STATUTORY INTELLIGENCE BANNER ===================== */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-teal-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-teal-900/50">
          {/* Ambient background glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-400/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>FDRE MinT Oversight Console</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Proclamation 1396/2025</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ethiopian Sovereign Startup Ecosystem
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Real-time tracking of statutory venture designations, tax
                holiday claims, foreign exchange priority allocations, and
                multi-regional innovation density.
              </p>
            </div>

            {/* Quick KPI Badge Card */}
            <div className="grid grid-cols-2 gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[260px]">
              <div className="space-y-0.5">
                <div className="text-[10px] text-teal-200 font-bold uppercase tracking-wider">
                  Designation Rate
                </div>
                <div className="text-2xl font-black text-white flex items-baseline gap-1">
                  <span>{verificationRate}%</span>
                  <span className="text-[10px] font-semibold text-emerald-400">
                    Verified
                  </span>
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] text-amber-200 font-bold uppercase tracking-wider">
                  Review SLA
                </div>
                <div className="text-2xl font-black text-white flex items-baseline gap-1">
                  <span>{slaCompliance}%</span>
                  <span className="text-[10px] font-semibold text-teal-300">
                    On Track
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter & View Tabs */}
          <div className="relative z-10 mt-6 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === "overview"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Overview & Distribution
              </button>
              <button
                onClick={() => setActiveTab("fiscal")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === "fiscal"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Fiscal & Sovereign Incentives
              </button>
              <button
                onClick={() => setActiveTab("deal")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === "deal"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Deal Analytics
              </button>
              <button
                onClick={() => setActiveTab("stakeholders")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === "stakeholders"
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Stakeholder Network
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>
                Statutory Period: <strong>2025/2026 Fiscal Cycle</strong>
              </span>
            </div>
          </div>
        </div>

        {/* ===================== FANTASTIC COLORFUL STAT CARDS ===================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Startups Card (Indigo) */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-white to-indigo-50/50 rounded-3xl border border-indigo-200/80 p-5 shadow-sm hover:shadow-lg hover:border-indigo-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                Registered
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {total}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">
              Total Registered Ventures
            </div>
            <div className="mt-3 pt-2.5 border-t border-indigo-100/80 flex items-center justify-between text-[11px] text-indigo-700 font-semibold">
              <span>Under Proclamation 1396</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Designated Startups Card (Emerald/Teal) */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-teal-500/10 via-white to-emerald-50/50 rounded-3xl border border-teal-200/80 p-5 shadow-sm hover:shadow-lg hover:border-teal-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white flex items-center justify-center shadow-md shadow-teal-600/30 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                Certified
              </span>
            </div>
            <div className="text-2xl font-black text-teal-900 tracking-tight">
              {verified}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">
              Designated Sovereign Startups
            </div>
            <div className="mt-3 pt-2.5 border-t border-teal-100/80 flex items-center justify-between text-[11px] text-teal-800 font-semibold">
              <span>{verificationRate}% Compliance Rate</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </div>
          </div>

          {/* Review Queue (Amber) */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-white to-amber-50/50 rounded-3xl border border-amber-200/80 p-5 shadow-sm hover:shadow-lg hover:border-amber-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 group-hover:scale-110 transition-transform">
                <Inbox className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                Pending
              </span>
            </div>
            <div className="text-2xl font-black text-amber-900 tracking-tight">
              {pending}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">
              In-Review Filing Queue
            </div>
            <div className="mt-3 pt-2.5 border-t border-amber-100/80 flex items-center justify-between text-[11px] text-amber-800 font-semibold">
              <span>Active Ministerial Review</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Overdue Reviews (Rose) */}
          <div className="group relative overflow-hidden bg-gradient-to-br from-rose-500/10 via-white to-rose-50/50 rounded-3xl border border-rose-200/80 p-5 shadow-sm hover:shadow-lg hover:border-rose-400 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md shadow-rose-600/30 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                Action Required
              </span>
            </div>
            <div className="text-2xl font-black text-rose-900 tracking-tight">
              {overdue}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-0.5">
              Overdue SLA Reviews
            </div>
            <div className="mt-3 pt-2.5 border-t border-rose-100/80 flex items-center justify-between text-[11px] text-rose-700 font-semibold">
              <span>Needs Directorate Attention</span>
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Secondary Stakeholder Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">
                {investors}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Accredited Investors
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Rocket className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">
                {founders}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Registered Founders
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">
                {builders}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Ecosystem Builders
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-black text-slate-900">
                {designatedBuilders}
              </div>
              <div className="text-[11px] text-slate-500 font-semibold">
                Accredited Hubs
              </div>
            </div>
          </div>
        </div>

        {/* ===================== TABBED CONTENT: CHARTS & INTELLIGENCE ===================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <AnalyticsCharts charts={stats?.charts} />
          </div>
        )}

        {activeTab === "fiscal" && (
          <div className="space-y-6">
            {/* Fiscal Incentives Detail Card */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-50 rounded-3xl border border-amber-200 p-6 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Tier 1: Tax Holiday
                </div>
                <div className="text-2xl font-black text-slate-900">
                  3-Year Relief
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  100% corporate income tax exemption on innovative tech
                  turnover under Section 12(1).
                </p>
                <div className="pt-3 border-t border-amber-200/60 text-[11px] font-bold text-amber-700">
                  {verified} Verified Enterprises Eligible
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-500/10 via-white to-teal-50 rounded-3xl border border-teal-200 p-6 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Tier 2: Priority FX
                </div>
                <div className="text-2xl font-black text-slate-900">
                  Central Bank Priority
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Fast-track foreign exchange lane with National Bank of
                  Ethiopia for international cloud tooling & software licenses.
                </p>
                <div className="pt-3 border-t border-teal-200/60 text-[11px] font-bold text-teal-700">
                  Priority Directive in Effect
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500/10 via-white to-indigo-50 rounded-3xl border border-indigo-200 p-6 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                  Tier 3: Patent & IP Grant
                </div>
                <div className="text-2xl font-black text-slate-900">
                  100% Fee Subsidy
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accelerated patent and utility model filing via Ethiopian
                  Intellectual Property Authority with full state fee coverage.
                </p>
                <div className="pt-3 border-t border-indigo-200/60 text-[11px] font-bold text-indigo-700">
                  EIPA Fast-Track Active
                </div>
              </div>
            </div>

            <AnalyticsCharts charts={stats?.charts} />
          </div>
        )}

        {activeTab === "stakeholders" && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
              <h2 className="text-base font-extrabold text-slate-900 mb-2">
                Stakeholder Growth & Interaction Matrix
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Breakdown of active users, review queue distribution, and
                builder ecosystem density across all regional hubs.
              </p>
              <AnalyticsCharts charts={stats?.charts} />
            </div>
          </div>
        )}
        {activeTab === "deal" && (
          <div className="space-y-6">
            {connectionReportLoading ? (
              <div className="min-h-[30vh] flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : connectionReport ? (
              <>
                {/* Summary Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase">
                      Total Connections
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {connectionReport.totalConnections}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase">
                      Active
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {connectionReport.activeConnections}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase">
                      Closed
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {connectionReport.closedConnections}
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <div className="text-xs font-bold text-slate-500 uppercase">
                      Declined
                    </div>
                    <div className="text-2xl font-black text-slate-900">
                      {connectionReport.declinedConnections}
                    </div>
                  </div>
                </div>

                {/* Download Buttons */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                  <h2 className="text-base font-extrabold text-slate-900">
                    Export Connection Report
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadConnectionReport("csv")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                    >
                      <FileText className="w-4 h-4" />
                      CSV
                    </button>
                    <button
                      onClick={() => downloadConnectionReport("xlsx")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-xs font-bold"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </button>
                    <button
                      onClick={() => downloadConnectionReport("pdf")}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold"
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-slate-500 text-sm">
                No connection data available.
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

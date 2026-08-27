import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Building2,
  Users,
  Globe,
  Sparkles,
  Layers,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

const VIBRANT_COLORS = [
  "#0d9488", // Teal
  "#6366f1", // Indigo
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#ec4899", // Pink
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#3b82f6", // Blue
  "#ef4444", // Rose
];

const SECTOR_GRADIENTS = {
  FinTech: { from: "#0d9488", to: "#10b981" },
  AgriTech: { from: "#16a34a", to: "#84cc16" },
  CleanTech: { from: "#06b6d4", to: "#0284c7" },
  EdTech: { from: "#6366f1", to: "#8b5cf6" },
  HealthTech: { from: "#ec4899", to: "#f43f5e" },
  LogisticsTech: { from: "#f59e0b", to: "#ea580c" },
};

function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-2xl shadow-xl text-white text-xs">
        <div className="font-bold text-teal-300 mb-0.5">{label || data.name}</div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color || data.fill || "#0d9488" }} />
          <span className="text-slate-300 font-medium">{data.name || "Value"}:</span>
          <span className="font-black text-white text-sm">{data.value}</span>
        </div>
      </div>
    );
  }
  return null;
}

function ChartCard({ title, subtitle, icon: Icon, badge, color = "teal", children }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
      {/* Decorative colored top line */}
      <div
        className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
          color === "teal"
            ? "from-teal-500 to-emerald-400"
            : color === "indigo"
            ? "from-indigo-500 to-purple-500"
            : color === "amber"
            ? "from-amber-500 to-orange-500"
            : "from-purple-500 to-pink-500"
        }`}
      />

      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            {Icon && (
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs ${
                  color === "teal"
                    ? "bg-teal-50 text-teal-700"
                    : color === "indigo"
                    ? "bg-indigo-50 text-indigo-700"
                    : color === "amber"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-purple-50 text-purple-700"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
            )}
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{title}</h3>
          </div>
          {subtitle && <p className="text-[11px] text-slate-500 mt-0.5 ml-9">{subtitle}</p>}
        </div>

        {badge && (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold shrink-0">
            {badge}
          </span>
        )}
      </div>

      <div className="h-64 w-full pt-2">{children}</div>
    </div>
  );
}

export default function AnalyticsCharts({ charts }) {
  if (!charts) return null;

  const {
    statusChart = [],
    sectorChart = [],
    countryChart = [],
    usersByRole = [],
    applicationsOverTime = [],
    opportunityByStatus = [],
    builderByType = [],
    builderByStatus = [],
  } = charts;

  const roleData = usersByRole.filter((d) => d.value > 0);
  const statusData = statusChart.filter((d) => d.value > 0);
  const sectorData = sectorChart.filter((d) => d.value > 0);
  const countryData = countryChart.filter((d) => d.value > 0);
  const oppData = opportunityByStatus.filter((d) => d.value > 0);
  const builderTypeData = builderByType.filter((d) => d.value > 0);
  const builderStatusData = builderByStatus.filter((d) => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Applications Throughput Over Time (Gradient Area) */}
      <ChartCard
        title="Application Inflow & Designation Velocity"
        subtitle="Monthly venture filings submitted to MinT"
        icon={TrendingUp}
        color="teal"
        badge="Live Velocity"
      >
        {applicationsOverTime.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <TrendingUp className="w-8 h-8 opacity-30 text-teal-600" />
            <p className="text-xs font-semibold">No timeline records registered yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={applicationsOverTime} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="areaTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#cbd5e1" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                name="Applications"
                stroke="#0d9488"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#areaTeal)"
                dot={{ r: 4, fill: "#0d9488", strokeWidth: 2, stroke: "#ffffff" }}
                activeDot={{ r: 6, fill: "#0f766e" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 2. Startups by Sector (Vibrant Horizontal Bars) */}
      <ChartCard
        title="Venture Sector & Domain Breakdown"
        subtitle="Distribution across Ethiopian strategic tech sectors"
        icon={Layers}
        color="indigo"
        badge="Strategic Sectors"
      >
        {sectorData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Layers className="w-8 h-8 opacity-30 text-indigo-600" />
            <p className="text-xs font-semibold">No sector distribution data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 20, left: 15, bottom: 5 }}>
              <defs>
                <linearGradient id="barIndigo" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis
                type="category"
                dataKey="name"
                width={85}
                tick={{ fontSize: 11, fill: "#334155", fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar dataKey="value" name="Startups" fill="url(#barIndigo)" radius={[0, 8, 8, 0]}>
                {sectorData.map((entry, index) => (
                  <Cell
                    key={`cell-sec-${index}`}
                    fill={VIBRANT_COLORS[index % VIBRANT_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 3. Startups by Statutory Status (Donut Pie) */}
      <ChartCard
        title="Statutory Review Pipeline Status"
        subtitle="Proclamation No. 1396/2025 designation lifecycle"
        icon={ShieldCheck}
        color="amber"
        badge="Lifecycle Stages"
      >
        {statusData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <ShieldCheck className="w-8 h-8 opacity-30 text-amber-500" />
            <p className="text-xs font-semibold">No status distribution data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
              >
                {statusData.map((entry, i) => (
                  <Cell
                    key={`cell-st-${i}`}
                    fill={VIBRANT_COLORS[i % VIBRANT_COLORS.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-[11px] font-bold text-slate-700">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 4. Active Stakeholders by Persona Role */}
      <ChartCard
        title="Platform Stakeholder Distribution"
        subtitle="Founders, Investors, Reviewers & Ecosystem Builders"
        icon={Users}
        color="purple"
        badge="User Personas"
      >
        {roleData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <Users className="w-8 h-8 opacity-30 text-purple-600" />
            <p className="text-xs font-semibold">No stakeholder roles data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={roleData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <defs>
                <linearGradient id="barTeal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                interval={0}
                angle={-18}
                textAnchor="end"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar dataKey="value" name="Active Users" radius={[8, 8, 0, 0]}>
                {roleData.map((_, i) => (
                  <Cell key={`cell-r-${i}`} fill={VIBRANT_COLORS[(i + 2) % VIBRANT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* 5. Ecosystem Builders by Type */}
      {builderTypeData.length > 0 && (
        <ChartCard
          title="Ecosystem Builders & Hub Typology"
          subtitle="Incubators, Accelerators & University Tech Labs"
          icon={Building2}
          color="teal"
          badge="Hub Types"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={builderTypeData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#475569", fontWeight: 600 }}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomChartTooltip />} />
              <Bar dataKey="value" name="Builders" fill="#8b5cf6" radius={[8, 8, 0, 0]}>
                {builderTypeData.map((_, i) => (
                  <Cell key={`cell-bt-${i}`} fill={VIBRANT_COLORS[(i + 5) % VIBRANT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* 6. Ecosystem Builders Accreditation Status */}
      {builderStatusData.length > 0 && (
        <ChartCard
          title="Builder Accreditation Lifecycle"
          subtitle="MinT verified vs pending incubation hubs"
          icon={CheckCircle2}
          color="indigo"
          badge="Accreditation"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={builderStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {builderStatusData.map((_, i) => (
                  <Cell
                    key={`cell-bs-${i}`}
                    fill={VIBRANT_COLORS[(i + 3) % VIBRANT_COLORS.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-[11px] font-bold text-slate-700">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* 7. Opportunities by Status */}
      {oppData.length > 0 && (
        <ChartCard
          title="Opportunities & Calls Status"
          subtitle="Published scholarships, grants & internships"
          icon={Sparkles}
          color="amber"
          badge="Calls Pipeline"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={oppData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
              >
                {oppData.map((_, i) => (
                  <Cell
                    key={`cell-op-${i}`}
                    fill={VIBRANT_COLORS[(i + 1) % VIBRANT_COLORS.length]}
                    stroke="#ffffff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomChartTooltip />} />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value) => <span className="text-[11px] font-bold text-slate-700">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}

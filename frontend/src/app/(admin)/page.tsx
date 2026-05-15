"use client";
import { useEffect, useState } from "react";
import api, { DashboardData } from "@/lib/api";
import { STAGE_LABELS } from "@/lib/utils";
import { Users, Clock, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const STAGE_CHART_COLORS: Record<string, string> = {
  Lead: "#94a3b8",
  Onboarded: "#60a5fa",
  Active: "#34d399",
  Returning: "#fbbf24",
  Alumni: "#a78bfa",
  Ambassador: "#fb923c",
};

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5 leading-none">
          {value.toLocaleString()}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="card px-3 py-2 text-sm shadow-md">
        <p className="font-medium text-slate-700">{label}</p>
        <p className="text-primary-600 font-semibold">{payload[0].value} volunteers</p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>("/dashboard").then((r) => setData(r.data));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stageChartData = Object.entries(data.stage_breakdown).map(([stage, count]) => ({
    stage: STAGE_LABELS[stage] || stage,
    count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your volunteer program</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Volunteers"    value={data.total_volunteers}     icon={Users}         color="bg-blue-50 text-blue-600" />
        <StatCard label="Active Volunteers"   value={data.active_volunteers}    icon={TrendingUp}    color="bg-emerald-50 text-emerald-600" />
        <StatCard label="Hours Logged"        value={data.total_hours_logged}   icon={Clock}         color="bg-violet-50 text-violet-600"    sub="cumulative" />
        <StatCard label="Onboarding Complete" value={data.onboarding_completed} icon={CheckCircle}   color="bg-primary-50 text-primary-600" />
      </div>

      {data.pending_compliance > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
          <span>
            <strong>{data.pending_compliance}</strong> volunteer{data.pending_compliance !== 1 ? "s" : ""} have incomplete onboarding.{" "}
            <a href="/onboarding" className="underline font-medium hover:text-amber-900">Review →</a>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Volunteers by Stage</h2>
          {stageChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stageChartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="count" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No data yet — add volunteers to see the chart.
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Stage Breakdown</h2>
          <div className="space-y-2.5">
            {stageChartData.length === 0 ? (
              <p className="text-slate-400 text-sm">No volunteers yet.</p>
            ) : (
              stageChartData.map(({ stage, count }) => {
                const pct = data.total_volunteers > 0
                  ? Math.round((count / data.total_volunteers) * 100)
                  : 0;
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">{stage}</span>
                      <span className="text-slate-400">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

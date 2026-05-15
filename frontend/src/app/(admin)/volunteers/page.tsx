"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api, { Volunteer, JourneyStage } from "@/lib/api";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/utils";
import { Search, SlidersHorizontal, Plus, ArrowRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const STAGES: JourneyStage[] = ["lead", "onboarded", "active", "returning", "alumni", "ambassador"];

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [pending, setPending] = useState<Volunteer[]>([]);
  const [search, setSearch]           = useState("");
  const [stageFilter, setStageFilter] = useState<JourneyStage | "">("");
  const [loading, setLoading]         = useState(true);

  const loadData = (s: string, stage: string) => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (s)     params.search = s;
    if (stage) params.stage  = stage;
    api.get<Volunteer[]>("/volunteers", { params })
      .then((r) => setVolunteers(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get<Volunteer[]>("/volunteers/pending").then((r) => setPending(r.data));
    loadData("", "");
  }, []);

  useEffect(() => { loadData(search, stageFilter); }, [search, stageFilter]);

  const approve = async (id: string) => {
    await api.patch(`/volunteers/${id}/approve`);
    setPending((p) => p.filter((v) => v.id !== id));
    loadData(search, stageFilter);
  };

  const reject = async (id: string) => {
    await api.patch(`/volunteers/${id}/reject`);
    setPending((p) => p.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Pending approvals banner */}
      {pending.length > 0 && (
        <div className="card overflow-hidden border border-amber-200">
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Pending Approvals ({pending.length})</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pending.map((v) => (
              <div key={v.id} className="px-4 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{v.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{v.email || v.phone || "No contact"}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve(v.id)}
                    className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => reject(v.id)}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Volunteers</h1>
          <p className="text-slate-500 text-sm mt-0.5 hidden sm:block">
            {volunteers.length} volunteer{volunteers.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link href="/volunteers/new" className="btn-primary flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Volunteer</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
        <div className="relative flex-shrink-0">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as JourneyStage | "")}
            className="input pl-9 pr-8 appearance-none w-36 sm:w-44"
          >
            <option value="">All stages</option>
            {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && volunteers.length === 0 && (
          <div className="card p-10 text-center text-slate-400">
            <p>No volunteers found.</p>
            {(search || stageFilter) && (
              <button onClick={() => { setSearch(""); setStageFilter(""); }} className="text-primary-600 text-sm mt-2">
                Clear filters
              </button>
            )}
          </div>
        )}
        {!loading && volunteers.map((v) => (
          <Link key={v.id} href={`/volunteers/${v.id}`} className="card p-4 block active:bg-slate-50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900 truncate">{v.name}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{v.email || v.phone || "—"}</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${STAGE_COLORS[v.current_stage]}`}>
                {STAGE_LABELS[v.current_stage]}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2.5 text-xs text-slate-400">
              {(v.district || v.state) && (
                <span>{[v.district, v.state].filter(Boolean).join(", ")}</span>
              )}
              {v.volunteer_type && (
                <span className="capitalize">{v.volunteer_type.replace("_", "-")}</span>
              )}
              <span className="ml-auto font-medium text-slate-600">{v.cumulative_hours}h</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Name", "Contact", "Location", "Type", "Stage", "Hours", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50/70">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                </td>
              </tr>
            )}
            {!loading && volunteers.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-400">
                  <p>No volunteers found.</p>
                  {(search || stageFilter) && (
                    <button onClick={() => { setSearch(""); setStageFilter(""); }} className="text-primary-600 text-sm mt-1 hover:underline">
                      Clear filters
                    </button>
                  )}
                </td>
              </tr>
            )}
            {!loading && volunteers.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/60 transition-colors group">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-900">{v.name}</p>
                  {v.email && <p className="text-xs text-slate-400 mt-0.5">{v.email}</p>}
                </td>
                <td className="px-4 py-3 text-slate-500">{v.phone || v.email || "—"}</td>
                <td className="px-4 py-3 text-slate-500">
                  {[v.district, v.state].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  {v.volunteer_type ? (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md capitalize">
                      {v.volunteer_type.replace("_", "-")}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[v.current_stage]}`}>
                    {STAGE_LABELS[v.current_stage]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 font-medium">{v.cumulative_hours}h</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/volunteers/${v.id}`}
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

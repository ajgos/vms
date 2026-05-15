"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api, { OnboardingChecklist, Volunteer } from "@/lib/api";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

type EnrichedChecklist = OnboardingChecklist & { volunteerName?: string };

export default function OnboardingPage() {
  const [checklists, setChecklists] = useState<EnrichedChecklist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<OnboardingChecklist[]>("/onboarding"),
      api.get<Volunteer[]>("/volunteers", { params: { limit: 500 } }),
    ]).then(([cRes, vRes]) => {
      const nameMap = Object.fromEntries(vRes.data.map((v) => [v.id, v.name]));
      setChecklists(cRes.data.map((c) => ({ ...c, volunteerName: nameMap[c.volunteer_id] })));
    }).finally(() => setLoading(false));
  }, []);

  const pending   = checklists.filter((c) => !c.is_complete);
  const completed = checklists.filter((c) =>  c.is_complete);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Onboarding</h1>
        <p className="text-slate-500 text-sm mt-1">Track volunteer onboarding compliance</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="card p-3 md:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{pending.length}</p>
            <p className="text-xs text-slate-400 leading-tight">Pending</p>
          </div>
        </div>
        <div className="card p-3 md:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-slate-900">{completed.length}</p>
            <p className="text-xs text-slate-400 leading-tight">Completed</p>
          </div>
        </div>
        <div className="card p-3 md:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 text-center sm:text-left">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs md:text-sm font-bold">%</span>
          </div>
          <div>
            <p className="text-xl md:text-2xl font-bold text-slate-900">
              {checklists.length > 0 ? Math.round((completed.length / checklists.length) * 100) : 0}%
            </p>
            <p className="text-xs text-slate-400 leading-tight">Done</p>
          </div>
        </div>
      </div>

      {/* Pending section */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Needs Attention ({pending.length})
          </h2>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-2">
            {pending.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{c.volunteerName || "Unknown"}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{c.volunteer_id.slice(0, 8)}…</p>
                  </div>
                  <Link href={`/volunteers/${c.volunteer_id}`} className="text-primary-600 text-xs font-medium flex-shrink-0">
                    View →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <MiniPill label="Orientation" done={c.orientation_completed} />
                  <MiniPill label="Agreement" done={c.agreement_signed} />
                  <MiniPill label="ID Proof" done={c.id_proof_submitted} />
                </div>
                <div className="mt-2">
                  <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                    Missing: {c.pending_items.join(", ")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Volunteer", "Orientation", "Agreement", "ID Proof", "Missing", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pending.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-medium text-slate-800">{c.volunteerName || "Unknown"}</p>
                      <p className="text-xs text-slate-400 font-mono">{c.volunteer_id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-5 py-3"><StatusPill done={c.orientation_completed} /></td>
                    <td className="px-5 py-3"><StatusPill done={c.agreement_signed} /></td>
                    <td className="px-5 py-3"><StatusPill done={c.id_proof_submitted} /></td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                        {c.pending_items.join(", ")}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/volunteers/${c.volunteer_id}`} className="text-primary-600 hover:underline text-xs font-medium whitespace-nowrap">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Completed section */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Completed ({completed.length})
          </h2>

          {/* Mobile: cards */}
          <div className="md:hidden space-y-2">
            {completed.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-slate-900 truncate flex-1 min-w-0">{c.volunteerName || "Unknown"}</p>
                  <Link href={`/volunteers/${c.volunteer_id}`} className="text-primary-600 text-xs font-medium flex-shrink-0">
                    View →
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <MiniPill label="Orientation" done={c.orientation_completed} />
                  <MiniPill label="Agreement" done={c.agreement_signed} />
                  <MiniPill label="ID Proof" done={c.id_proof_submitted} />
                </div>
                {c.onboarding_completed_at && (
                  <p className="text-xs text-slate-400 mt-2">
                    Completed {new Date(c.onboarding_completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Volunteer", "Orientation", "Agreement", "ID Proof", "Completed On", ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completed.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{c.volunteerName || "Unknown"}</td>
                    <td className="px-5 py-3"><StatusPill done={c.orientation_completed} /></td>
                    <td className="px-5 py-3"><StatusPill done={c.agreement_signed} /></td>
                    <td className="px-5 py-3"><StatusPill done={c.id_proof_submitted} /></td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {c.onboarding_completed_at ? new Date(c.onboarding_completed_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/volunteers/${c.volunteer_id}`} className="text-primary-600 hover:underline text-xs font-medium whitespace-nowrap">
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && checklists.length === 0 && (
        <div className="card p-16 text-center text-slate-400">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No onboarding records yet.</p>
          <p className="text-sm mt-1">Records are created automatically when volunteers are added.</p>
        </div>
      )}
    </div>
  );
}

function StatusPill({ done }: { done: boolean }) {
  return done ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> Done
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> Pending
    </span>
  );
}

function MiniPill({ label, done }: { label: string; done: boolean }) {
  return done ? (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
      <CheckCircle2 className="w-3 h-3" /> {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
      <XCircle className="w-3 h-3" /> {label}
    </span>
  );
}

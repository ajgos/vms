"use client";
import { useEffect, useState } from "react";
import api, { ActivityLog, Volunteer, ActivityMode } from "@/lib/api";
import { Plus, X, ClipboardList } from "lucide-react";

const MODE_COLORS: Record<string, string> = {
  online:  "bg-blue-50 text-blue-700",
  offline: "bg-slate-100 text-slate-600",
  hybrid:  "bg-violet-50 text-violet-700",
};

export default function ActivitiesPage() {
  const [logs,       setLogs]       = useState<ActivityLog[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [showForm,   setShowForm]   = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({
    volunteer_id: "", activity_name: "", date: "",
    hours_logged: "", mode: "", location: "", notes: "",
  });

  const volunteerMap = Object.fromEntries(volunteers.map((v) => [v.id, v.name]));

  useEffect(() => {
    api.get<ActivityLog[]>("/activity-logs").then((r) => setLogs(r.data));
    api.get<Volunteer[]>("/volunteers", { params: { limit: 500 } }).then((r) => setVolunteers(r.data));
  }, []);

  const set = (f: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post("/activity-logs", {
        ...form,
        hours_logged: Number(form.hours_logged),
        mode: form.mode || undefined,
      });
      const res = await api.get<ActivityLog[]>("/activity-logs");
      setLogs(res.data);
      setShowForm(false);
      setForm({ volunteer_id: "", activity_name: "", date: "", hours_logged: "", mode: "", location: "", notes: "" });
    } finally {
      setSaving(false);
    }
  };

  const totalHours = logs.reduce((sum, l) => sum + l.hours_logged, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
          <p className="text-slate-500 text-sm mt-0.5">{logs.length} sessions · {totalHours}h total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={showForm ? "btn-secondary flex items-center gap-2" : "btn-primary flex items-center gap-2"}>
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Log Activity</>}
        </button>
      </div>

      {showForm && (
        <div className="card p-4 md:p-5">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">New Activity Entry</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Volunteer *</label>
              <select required className="input" value={form.volunteer_id} onChange={set("volunteer_id")}>
                <option value="">Select volunteer…</option>
                {volunteers.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Activity Name *</label>
              <input required className="input" value={form.activity_name} onChange={set("activity_name")} placeholder="e.g. Community Workshop" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Date & Time *</label>
              <input type="datetime-local" required className="input" value={form.date} onChange={set("date")} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Hours *</label>
              <input type="number" required min={0.5} step={0.5} className="input" value={form.hours_logged} onChange={set("hours_logged")} placeholder="2" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Mode</label>
              <select className="input" value={form.mode} onChange={set("mode")}>
                <option value="">Select</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Location</label>
              <input className="input" value={form.location} onChange={set("location")} placeholder="e.g. Delhi" />
            </div>
            <div className="col-span-1 sm:col-span-2 flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save Entry"}</button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile: card list */}
      <div className="md:hidden space-y-2">
        {logs.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No activity logged yet.</p>
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900 flex-1 min-w-0 truncate">{log.activity_name || "—"}</p>
              <span className="font-bold text-slate-700 flex-shrink-0">{log.hours_logged}h</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-slate-500">{new Date(log.date).toLocaleDateString()}</span>
              {log.mode && (
                <span className={`text-xs px-2 py-0.5 rounded-md font-medium capitalize ${MODE_COLORS[log.mode] || "bg-slate-100 text-slate-600"}`}>
                  {log.mode}
                </span>
              )}
              {log.location && <span className="text-xs text-slate-400">{log.location}</span>}
            </div>
            {log.volunteer_id && (
              <a href={`/volunteers/${log.volunteer_id}`} className="text-primary-600 text-xs mt-2 inline-block">
                {volunteerMap[log.volunteer_id] || "View volunteer"} →
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Activity", "Volunteer", "Date", "Hours", "Mode", "Location"].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/70">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>No activity logged yet.</p>
                </td>
              </tr>
            )}
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-5 py-3 font-medium text-slate-800">{log.activity_name || "—"}</td>
                <td className="px-5 py-3">
                  <a href={`/volunteers/${log.volunteer_id}`} className="text-primary-600 hover:underline text-sm">
                    {volunteerMap[log.volunteer_id] || "View"}
                  </a>
                </td>
                <td className="px-5 py-3 text-slate-500">{new Date(log.date).toLocaleDateString()}</td>
                <td className="px-5 py-3 font-semibold text-slate-700">{log.hours_logged}h</td>
                <td className="px-5 py-3">
                  {log.mode ? (
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium capitalize ${MODE_COLORS[log.mode] || "bg-slate-100 text-slate-600"}`}>
                      {log.mode}
                    </span>
                  ) : "—"}
                </td>
                <td className="px-5 py-3 text-slate-500">{log.location || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

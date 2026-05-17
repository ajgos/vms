"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { Project } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", description: "", program: "", status: "draft",
    start_date: "", end_date: "", location: "", mode: "",
    capacity: "", skills: "", effort_approval: "auto",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Project>(`/projects/${id}`).then((r) => {
      const p = r.data;
      setForm({
        name: p.name,
        description: p.description || "",
        program: p.program || "",
        status: p.status,
        start_date: p.start_date ? p.start_date.slice(0, 16) : "",
        end_date: p.end_date ? p.end_date.slice(0, 16) : "",
        location: p.location || "",
        mode: p.mode || "",
        capacity: p.capacity != null ? String(p.capacity) : "",
        skills: p.skills.join(", "),
        effort_approval: p.effort_approval || "auto",
      });
      setLoading(false);
    });
  }, [id]);

  const set = (f: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.patch(`/projects/${id}`, {
        name: form.name,
        description: form.description || undefined,
        program: form.program || undefined,
        status: form.status,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        location: form.location || undefined,
        mode: form.mode || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        effort_approval: form.effort_approval,
      });
      router.push(`/projects/${id}`);
    } catch {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href={`/projects/${id}`} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Edit Project</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-4 md:p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Basic Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Project Name <span className="text-red-400">*</span></label>
              <input required className="input" value={form.name} onChange={set("name")} placeholder="e.g. Rural Education Drive" />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Description</label>
              <textarea className="input min-h-[80px]" value={form.description} onChange={set("description")} placeholder="What is this project about?" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Program / Category</label>
              <input className="input" value={form.program} onChange={set("program")} placeholder="e.g. Education, Health" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
              <select className="input" value={form.status} onChange={set("status")}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-4 md:p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Schedule &amp; Location</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Start Date</label>
              <input type="datetime-local" className="input" value={form.start_date} onChange={set("start_date")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">End Date</label>
              <input type="datetime-local" className="input" value={form.end_date} onChange={set("end_date")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Location</label>
              <input className="input" value={form.location} onChange={set("location")} placeholder="e.g. Delhi NCR" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Mode</label>
              <select className="input" value={form.mode} onChange={set("mode")}>
                <option value="">Select</option>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-4 md:p-6 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Requirements</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Capacity (max volunteers)</label>
              <input type="number" className="input" value={form.capacity} onChange={set("capacity")} placeholder="e.g. 20" min={1} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Effort Approval</label>
              <select className="input" value={form.effort_approval} onChange={set("effort_approval")}>
                <option value="auto">Auto-approve (no review needed)</option>
                <option value="manual">Manual (admin reviews each log)</option>
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Required Skills <span className="text-slate-400 font-normal">(comma-separated)</span></label>
              <input className="input" value={form.skills} onChange={set("skills")} placeholder="Teaching, Communication, Design" />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link href={`/projects/${id}`} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Link>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

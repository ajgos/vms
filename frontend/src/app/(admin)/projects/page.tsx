"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api, { Project, ProjectStatus } from "@/lib/api";
import { Plus, FolderKanban, Calendar, MapPin, Users } from "lucide-react";

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft:  "bg-slate-100 text-slate-600",
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-red-50 text-red-600",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Project[]>("/projects").then((r) => setProjects(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <p className="text-slate-500 text-sm mt-0.5">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/projects/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && projects.length === 0 && (
        <div className="card p-16 text-center text-slate-400">
          <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No projects yet.</p>
          <p className="text-sm mt-1">Create your first project to get started.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="card p-5 block hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-semibold text-slate-900 flex-1 min-w-0 truncate">{p.name}</h2>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 capitalize ${STATUS_COLORS[p.status]}`}>
                {p.status}
              </span>
            </div>
            {p.description && (
              <p className="text-sm text-slate-500 line-clamp-2 mb-3">{p.description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              {p.program && <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md">{p.program}</span>}
              {(p.start_date || p.end_date) && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {p.start_date ? new Date(p.start_date).toLocaleDateString() : ""}
                  {p.start_date && p.end_date ? " — " : ""}
                  {p.end_date ? new Date(p.end_date).toLocaleDateString() : ""}
                </span>
              )}
              {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>}
              <span className="flex items-center gap-1 ml-auto">
                <Users className="w-3 h-3" />
                {p.application_count}{p.capacity ? `/${p.capacity}` : ""} applied
              </span>
            </div>
            {p.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {p.skills.slice(0, 4).map((s) => (
                  <span key={s} className="bg-slate-100 text-slate-500 text-xs px-1.5 py-0.5 rounded">{s}</span>
                ))}
                {p.skills.length > 4 && <span className="text-xs text-slate-400">+{p.skills.length - 4}</span>}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

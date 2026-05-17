"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { Project, ProjectApplication, ProjectDocument, EffortLog, VolunteerSuggestion } from "@/lib/api";
import {
  ArrowLeft, Calendar, MapPin, Users, CheckCircle2, XCircle,
  Clock, Pencil, FileText, ExternalLink, Trash2, Upload, Activity,
  Sparkles, Link2, X, Check,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  draft:  "bg-slate-100 text-slate-600",
  active: "bg-emerald-50 text-emerald-700",
  closed: "bg-red-50 text-red-600",
};
const APP_COLORS: Record<string, string> = {
  pending:  "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [applications, setApplications] = useState<ProjectApplication[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [effortLogs, setEffortLogs] = useState<EffortLog[]>([]);
  const [editing, setEditing] = useState(false);
  const [statusValue, setStatusValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [suggestions, setSuggestions] = useState<VolunteerSuggestion[] | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState<Set<string>>(new Set());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<Project>(`/projects/${id}`).then((r) => {
      setProject(r.data);
      setStatusValue(r.data.status);
    });
    api.get<ProjectApplication[]>(`/projects/${id}/applications`).then((r) => setApplications(r.data));
    api.get<ProjectDocument[]>(`/projects/${id}/documents`).then((r) => setDocuments(r.data));
    api.get<EffortLog[]>(`/projects/${id}/logs`).then((r) => setEffortLogs(r.data));
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    if (!project) return;
    const res = await api.patch<Project>(`/projects/${id}`, { status: newStatus });
    setProject(res.data);
    setStatusValue(res.data.status);
  };

  const reviewApp = async (appId: string, status: "approved" | "rejected") => {
    const res = await api.patch<ProjectApplication>(`/projects/${id}/applications/${appId}`, { status });
    setApplications((prev) => prev.map((a) => a.id === appId ? res.data : a));
  };

  const uploadDocument = async (file: File) => {
    setUploadError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api.post<ProjectDocument>(`/projects/${id}/documents`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDocuments((prev) => [res.data, ...prev]);
    } catch {
      setUploadError("Upload failed. Max 10 MB. PDF, JPG, PNG, WebP, Word or Excel.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteDocument = async (docId: string) => {
    await api.delete(`/projects/${id}/documents/${docId}`);
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const reviewLog = async (logId: string, status: "approved" | "rejected") => {
    const res = await api.patch<EffortLog>(`/projects/${id}/logs/${logId}`, { status });
    setEffortLogs((prev) => prev.map((l) => l.id === logId ? res.data : l));
  };

  const loadSuggestions = async () => {
    if (suggestions !== null) return;
    setLoadingSuggestions(true);
    try {
      const res = await api.get<VolunteerSuggestion[]>(`/projects/${id}/suggestions`);
      setSuggestions(res.data);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleVolunteer = (vid: string) => {
    setSelectedVolunteers((prev) => {
      const next = new Set(prev);
      next.has(vid) ? next.delete(vid) : next.add(vid);
      return next;
    });
  };

  const toggleAll = () => {
    if (!suggestions) return;
    if (selectedVolunteers.size === suggestions.length) {
      setSelectedVolunteers(new Set());
    } else {
      setSelectedVolunteers(new Set(suggestions.map((s) => s.id)));
    }
  };

  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/register?project=${id}`
    : `/register?project=${id}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pending = applications.filter((a) => a.status === "pending");
  const reviewed = applications.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors flex-shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{project.name}</h1>
            {project.program && <p className="text-sm text-slate-500 mt-0.5">{project.program}</p>}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 capitalize ${STATUS_COLORS[project.status]}`}>
          {project.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Project details */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Details</h2>
            {project.description && <p className="text-sm text-slate-600">{project.description}</p>}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              {(project.start_date || project.end_date) && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>
                    {project.start_date ? new Date(project.start_date).toLocaleDateString() : ""}
                    {project.start_date && project.end_date ? " — " : ""}
                    {project.end_date ? new Date(project.end_date).toLocaleDateString() : ""}
                  </span>
                </div>
              )}
              {project.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>{project.location}</span>
                </div>
              )}
              {project.mode && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md capitalize">{project.mode}</span>
              )}
            </div>
            {project.skills.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills.map((s) => (
                    <span key={s} className="bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Pending applications */}
          {pending.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-700">Pending Review ({pending.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {pending.map((app) => (
                  <div key={app.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/volunteers/${app.volunteer_id}`} className="font-medium text-slate-800 hover:text-primary-600 truncate block transition-colors">
                        {app.volunteer_name || "Volunteer"}
                      </Link>
                      {app.message && <p className="text-xs text-slate-500 mt-0.5 truncate">{app.message}</p>}
                      <p className="text-xs text-slate-400 mt-0.5">{new Date(app.applied_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => reviewApp(app.id, "approved")}
                        className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => reviewApp(app.id, "rejected")}
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

          {/* Reviewed applications */}
          {reviewed.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">Reviewed ({reviewed.length})</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {reviewed.map((app) => (
                  <div key={app.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <Link href={`/volunteers/${app.volunteer_id}`} className="font-medium text-slate-800 hover:text-primary-600 truncate block transition-colors">
                        {app.volunteer_name || "Volunteer"}
                      </Link>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize flex-shrink-0 ${APP_COLORS[app.status]}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {applications.length === 0 && (
            <div className="card p-10 text-center text-slate-400 text-sm">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>No applications yet.</p>
            </div>
          )}

          {/* Documents */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700">Documents ({documents.length})</h2>
              </div>
              <label className={`flex items-center gap-1.5 text-xs font-medium cursor-pointer px-3 py-1.5 rounded-lg border transition-colors ${uploading ? "opacity-50 cursor-not-allowed border-slate-200 text-slate-400" : "border-primary-200 text-primary-600 hover:bg-primary-50"}`}>
                <Upload className="w-3.5 h-3.5" />
                {uploading ? "Uploading…" : "Upload"}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDocument(f); }}
                />
              </label>
            </div>
            {uploadError && (
              <div className="px-5 py-2 text-xs text-red-500 bg-red-50">{uploadError}</div>
            )}
            {documents.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No documents uploaded yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => {
                  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
                  return (
                    <div key={doc.id} className="px-5 py-3 flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium truncate">{doc.name}</p>
                        <p className="text-xs text-slate-400">{new Date(doc.uploaded_at).toLocaleDateString()}</p>
                      </div>
                      <a
                        href={`${API_URL}${doc.file_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="View"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Effort Logs */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700">Effort Logs ({effortLogs.length})</h2>
              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${project.effort_approval === "auto" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {project.effort_approval === "auto" ? "Auto-approve" : "Manual review"}
              </span>
            </div>
            {effortLogs.length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">No effort logged yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {effortLogs.map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-slate-800">{log.volunteer_name || "Volunteer"}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${log.status === "approved" ? "bg-emerald-50 text-emerald-700" : log.status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                          {log.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.date).toLocaleDateString()} · <strong>{log.hours}h</strong>
                        {log.description && ` · ${log.description}`}
                      </p>
                    </div>
                    {log.status === "pending" && project.effort_approval === "manual" && (
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => reviewLog(log.id, "approved")}
                          className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => reviewLog(log.id, "rejected")}
                          className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Manage</h2>
            <div>
              <p className="text-xs text-slate-400 mb-2">Status</p>
              <select
                value={statusValue}
                onChange={(e) => updateStatus(e.target.value)}
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="active">Active (accepting applications)</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                <p className="text-xs text-slate-400 mt-0.5">Total applied</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-slate-900">{project.capacity ?? "∞"}</p>
                <p className="text-xs text-slate-400 mt-0.5">Capacity</p>
              </div>
            </div>
            <Link href={`/projects/${id}/edit`} className="btn-secondary w-full flex items-center justify-center gap-2">
              <Pencil className="w-3.5 h-3.5" /> Edit Project
            </Link>
          </div>

          {/* Invite Volunteers */}
          <div className="card p-5 space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invite Volunteers</h2>
            <p className="text-xs text-slate-500">Find matching volunteers or copy the registration link to share.</p>
            <button
              onClick={() => { loadSuggestions(); }}
              disabled={loadingSuggestions}
              className="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {loadingSuggestions ? "Loading…" : suggestions === null ? "Find Matching Volunteers" : `${suggestions.length} suggestion${suggestions.length !== 1 ? "s" : ""}`}
            </button>
            {suggestions !== null && suggestions.length > 0 && (
              <button
                onClick={() => setShowInviteModal(true)}
                disabled={selectedVolunteers.size === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Link2 className="w-3.5 h-3.5" />
                Invite Selected ({selectedVolunteers.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Suggestions panel — full width below the grid */}
      {suggestions !== null && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-primary-500" />
            <h2 className="text-sm font-semibold text-slate-700">Volunteer Suggestions</h2>
            <span className="text-xs text-slate-400">{suggestions.length} matched</span>
            {suggestions.length > 0 && (
              <button
                onClick={toggleAll}
                className="ml-auto text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                {selectedVolunteers.size === suggestions.length ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>
          {suggestions.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-400 text-sm">
              No matching volunteers found. Add skills, location, or program to the project to get suggestions.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {suggestions.map((v) => (
                <label key={v.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedVolunteers.has(v.id)}
                    onChange={() => toggleVolunteer(v.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-800">{v.name}</p>
                      <span className="text-xs text-slate-400">{v.email || v.phone || ""}</span>
                    </div>
                    {v.district && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{v.district}
                        {v.preferred_district && v.preferred_district !== v.district && ` · prefers ${v.preferred_district}`}
                      </p>
                    )}
                    {v.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {v.skills.slice(0, 5).map((s) => (
                          <span key={s} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {v.match_reasons.map((r) => (
                        <span key={r} className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">{r}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary-600 flex-shrink-0 mt-0.5">{v.match_score}pt</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Invite Volunteers</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Share this link with {selectedVolunteers.size} selected volunteer{selectedVolunteers.size !== 1 ? "s" : ""}.
                </p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Registration Link</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 truncate">
                  {inviteLink}
                </code>
                <button
                  onClick={copyLink}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors flex-shrink-0 ${copied ? "bg-emerald-50 text-emerald-700" : "bg-primary-50 text-primary-700 hover:bg-primary-100"}`}
                >
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Link2 className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </div>

            <div className="bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700 space-y-1">
              <p className="font-medium">Selected volunteers ({selectedVolunteers.size}):</p>
              <p className="text-amber-600">
                {suggestions?.filter((s) => selectedVolunteers.has(s.id)).map((s) => s.name).join(", ")}
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Email and WhatsApp delivery will be available in a future update. For now, copy the link and share manually.
            </p>

            <button onClick={() => setShowInviteModal(false)} className="btn-secondary w-full">
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

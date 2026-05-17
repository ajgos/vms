"use client";
import { useEffect, useState } from "react";
import api, { Project, ProjectApplication, ProjectDocument, EffortLog } from "@/lib/api";
import { FolderKanban, Calendar, MapPin, Users, CheckCircle2, Clock, FileText, ExternalLink, ChevronDown, ChevronUp, Activity } from "lucide-react";

const MODE_COLORS: Record<string, string> = {
  online:  "bg-blue-50 text-blue-700",
  offline: "bg-slate-100 text-slate-600",
  hybrid:  "bg-violet-50 text-violet-700",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VolunteerProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Record<string, ProjectApplication>>({});
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState<Record<string, string>>({});
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [documents, setDocuments] = useState<Record<string, ProjectDocument[]>>({});
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [effortLogs, setEffortLogs] = useState<Record<string, EffortLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<Record<string, boolean>>({});
  const [logForm, setLogForm] = useState<Record<string, { date: string; hours: string; description: string }>>({});
  const [submittingLog, setSubmittingLog] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<Project[]>("/projects"),
      api.get<ProjectApplication[]>("/projects/my-applications").catch(() => ({ data: [] as ProjectApplication[] })),
    ]).then(([pRes, aRes]) => {
      setProjects(pRes.data);
      const appMap = Object.fromEntries(aRes.data.map((a) => [a.project_id, a]));
      setApplications(appMap);
    }).finally(() => setLoading(false));
  }, []);

  const apply = async (projectId: string) => {
    setApplying(projectId);
    try {
      const res = await api.post<ProjectApplication>(`/projects/${projectId}/apply`, {
        message: message[projectId] || undefined,
      });
      setApplications((prev) => ({ ...prev, [projectId]: res.data }));
      setMessage((prev) => ({ ...prev, [projectId]: "" }));
    } finally {
      setApplying(null);
    }
  };

  const toggleDocs = async (projectId: string) => {
    const nowExpanded = !expandedDocs[projectId];
    setExpandedDocs((prev) => ({ ...prev, [projectId]: nowExpanded }));
    if (nowExpanded && !documents[projectId]) {
      setLoadingDocs((prev) => ({ ...prev, [projectId]: true }));
      try {
        const res = await api.get<ProjectDocument[]>(`/projects/${projectId}/documents`);
        setDocuments((prev) => ({ ...prev, [projectId]: res.data }));
      } finally {
        setLoadingDocs((prev) => ({ ...prev, [projectId]: false }));
      }
    }
  };

  const toggleLogs = async (projectId: string) => {
    const nowExpanded = !expandedLogs[projectId];
    setExpandedLogs((prev) => ({ ...prev, [projectId]: nowExpanded }));
    if (nowExpanded && !effortLogs[projectId]) {
      setLoadingLogs((prev) => ({ ...prev, [projectId]: true }));
      try {
        const res = await api.get<EffortLog[]>(`/projects/${projectId}/logs`);
        setEffortLogs((prev) => ({ ...prev, [projectId]: res.data }));
      } finally {
        setLoadingLogs((prev) => ({ ...prev, [projectId]: false }));
      }
    }
  };

  const submitLog = async (projectId: string) => {
    const form = logForm[projectId];
    if (!form?.date || !form?.hours) return;
    setSubmittingLog(projectId);
    try {
      const res = await api.post<EffortLog>(`/projects/${projectId}/logs`, {
        date: form.date,
        hours: parseFloat(form.hours),
        description: form.description || undefined,
      });
      setEffortLogs((prev) => ({ ...prev, [projectId]: [res.data, ...(prev[projectId] || [])] }));
      setLogForm((prev) => ({ ...prev, [projectId]: { date: "", hours: "", description: "" } }));
    } finally {
      setSubmittingLog(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Active Projects</h1>
        <p className="text-slate-500 text-sm mt-0.5">Find projects that match your skills and interests</p>
      </div>

      {projects.length === 0 && (
        <div className="card p-16 text-center text-slate-400">
          <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No active projects at the moment.</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}

      <div className="space-y-4">
        {projects.map((p) => {
          const myApp = applications[p.id];
          const isFull = p.capacity != null && p.application_count >= p.capacity;
          const isApproved = myApp?.status === "approved";
          const lf = logForm[p.id] || { date: "", hours: "", description: "" };

          return (
            <div key={p.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-900">{p.name}</h2>
                  {p.program && (
                    <span className="inline-block mt-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md">{p.program}</span>
                  )}
                </div>
                {myApp ? (
                  <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${myApp.status === "approved" ? "bg-emerald-50 text-emerald-700" : myApp.status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                    {myApp.status === "pending" && <Clock className="w-3 h-3" />}
                    {myApp.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                    <span className="capitalize">{myApp.status}</span>
                  </span>
                ) : isFull ? (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full flex-shrink-0">Full</span>
                ) : null}
              </div>

              {p.description && <p className="text-sm text-slate-600">{p.description}</p>}

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {(p.start_date || p.end_date) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {p.start_date ? new Date(p.start_date).toLocaleDateString() : ""}
                    {p.start_date && p.end_date ? " — " : ""}
                    {p.end_date ? new Date(p.end_date).toLocaleDateString() : ""}
                  </span>
                )}
                {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>}
                {p.mode && <span className={`px-2 py-0.5 rounded-md font-medium capitalize ${MODE_COLORS[p.mode] || ""}`}>{p.mode}</span>}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {p.application_count}{p.capacity ? `/${p.capacity}` : ""} applied
                </span>
              </div>

              {p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <span key={s} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>
              )}

              {isApproved && (
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  {/* Documents */}
                  <button
                    onClick={() => toggleDocs(p.id)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-primary-600 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Project Documents
                    {expandedDocs[p.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {expandedDocs[p.id] && (
                    <div className="space-y-2 pl-1">
                      {loadingDocs[p.id] ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" /> Loading…
                        </div>
                      ) : documents[p.id]?.length === 0 ? (
                        <p className="text-xs text-slate-400">No documents uploaded yet.</p>
                      ) : (
                        documents[p.id]?.map((doc) => (
                          <a key={doc.id} href={`${API_URL}${doc.file_url}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-primary-50 transition-colors group">
                            <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary-500 flex-shrink-0" />
                            <span className="text-sm text-slate-700 group-hover:text-primary-700 flex-1 min-w-0 truncate">{doc.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-500 flex-shrink-0" />
                          </a>
                        ))
                      )}
                    </div>
                  )}

                  {/* Effort Logs */}
                  <button
                    onClick={() => toggleLogs(p.id)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-primary-600 transition-colors"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Log Effort / My Hours
                    {expandedLogs[p.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                  {expandedLogs[p.id] && (
                    <div className="pl-1 space-y-4">
                      {/* Log form */}
                      <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Add New Entry</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Date</label>
                            <input
                              type="date"
                              className="input text-sm"
                              value={lf.date}
                              onChange={(e) => setLogForm((f) => ({ ...f, [p.id]: { ...lf, date: e.target.value } }))}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">Hours</label>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              className="input text-sm"
                              placeholder="e.g. 2.5"
                              value={lf.hours}
                              onChange={(e) => setLogForm((f) => ({ ...f, [p.id]: { ...lf, hours: e.target.value } }))}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-xs text-slate-500 mb-1">Description (optional)</label>
                            <input
                              className="input text-sm"
                              placeholder="What did you work on?"
                              value={lf.description}
                              onChange={(e) => setLogForm((f) => ({ ...f, [p.id]: { ...lf, description: e.target.value } }))}
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => submitLog(p.id)}
                          disabled={!lf.date || !lf.hours || submittingLog === p.id}
                          className="btn-primary text-sm"
                        >
                          {submittingLog === p.id ? "Logging…" : "Log Hours"}
                        </button>
                        {p.effort_approval === "manual" && (
                          <p className="text-xs text-slate-400">Your entries will be reviewed by an admin before being approved.</p>
                        )}
                      </div>

                      {/* Existing logs */}
                      {loadingLogs[p.id] ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" /> Loading…
                        </div>
                      ) : (effortLogs[p.id] || []).length === 0 ? (
                        <p className="text-xs text-slate-400">No entries logged yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {(effortLogs[p.id] || []).map((log) => (
                            <div key={log.id} className="flex items-start gap-3 bg-white border border-slate-100 rounded-lg px-3 py-2.5">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-slate-500">
                                  {new Date(log.date).toLocaleDateString()} · <strong className="text-slate-700">{log.hours}h</strong>
                                  {log.description && ` · ${log.description}`}
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${log.status === "approved" ? "bg-emerald-50 text-emerald-700" : log.status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                                {log.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {!myApp && !isFull && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <input
                    className="input text-sm"
                    placeholder="Optional message to the organiser…"
                    value={message[p.id] || ""}
                    onChange={(e) => setMessage((m) => ({ ...m, [p.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => apply(p.id)}
                    disabled={applying === p.id}
                    className="btn-primary"
                  >
                    {applying === p.id ? "Applying…" : "Apply to Project"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


const MODE_COLORS: Record<string, string> = {
  online:  "bg-blue-50 text-blue-700",
  offline: "bg-slate-100 text-slate-600",
  hybrid:  "bg-violet-50 text-violet-700",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VolunteerProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [applications, setApplications] = useState<Record<string, ProjectApplication>>({});
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [message, setMessage] = useState<Record<string, string>>({});
  const [expandedDocs, setExpandedDocs] = useState<Record<string, boolean>>({});
  const [documents, setDocuments] = useState<Record<string, ProjectDocument[]>>({});
  const [loadingDocs, setLoadingDocs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    Promise.all([
      api.get<Project[]>("/projects"),
      api.get<ProjectApplication[]>("/projects/my-applications").catch(() => ({ data: [] as ProjectApplication[] })),
    ]).then(([pRes, aRes]) => {
      setProjects(pRes.data);
      const appMap = Object.fromEntries(aRes.data.map((a) => [a.project_id, a]));
      setApplications(appMap);
    }).finally(() => setLoading(false));
  }, []);

  const apply = async (projectId: string) => {
    setApplying(projectId);
    try {
      const res = await api.post<ProjectApplication>(`/projects/${projectId}/apply`, {
        message: message[projectId] || undefined,
      });
      setApplications((prev) => ({ ...prev, [projectId]: res.data }));
      setMessage((prev) => ({ ...prev, [projectId]: "" }));
    } finally {
      setApplying(null);
    }
  };

  const toggleDocs = async (projectId: string) => {
    const nowExpanded = !expandedDocs[projectId];
    setExpandedDocs((prev) => ({ ...prev, [projectId]: nowExpanded }));
    if (nowExpanded && !documents[projectId]) {
      setLoadingDocs((prev) => ({ ...prev, [projectId]: true }));
      try {
        const res = await api.get<ProjectDocument[]>(`/projects/${projectId}/documents`);
        setDocuments((prev) => ({ ...prev, [projectId]: res.data }));
      } finally {
        setLoadingDocs((prev) => ({ ...prev, [projectId]: false }));
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Active Projects</h1>
        <p className="text-slate-500 text-sm mt-0.5">Find projects that match your skills and interests</p>
      </div>

      {projects.length === 0 && (
        <div className="card p-16 text-center text-slate-400">
          <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No active projects at the moment.</p>
          <p className="text-sm mt-1">Check back soon!</p>
        </div>
      )}

      <div className="space-y-4">
        {projects.map((p) => {
          const myApp = applications[p.id];
          const isFull = p.capacity != null && p.application_count >= p.capacity;
          const isApproved = myApp?.status === "approved";

          return (
            <div key={p.id} className="card p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-900">{p.name}</h2>
                  {p.program && (
                    <span className="inline-block mt-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md">{p.program}</span>
                  )}
                </div>
                {myApp ? (
                  <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${myApp.status === "approved" ? "bg-emerald-50 text-emerald-700" : myApp.status === "rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`}>
                    {myApp.status === "pending" && <Clock className="w-3 h-3" />}
                    {myApp.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                    <span className="capitalize">{myApp.status}</span>
                  </span>
                ) : isFull ? (
                  <span className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full flex-shrink-0">Full</span>
                ) : null}
              </div>

              {p.description && <p className="text-sm text-slate-600">{p.description}</p>}

              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                {(p.start_date || p.end_date) && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {p.start_date ? new Date(p.start_date).toLocaleDateString() : ""}
                    {p.start_date && p.end_date ? " — " : ""}
                    {p.end_date ? new Date(p.end_date).toLocaleDateString() : ""}
                  </span>
                )}
                {p.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>}
                {p.mode && <span className={`px-2 py-0.5 rounded-md font-medium capitalize ${MODE_COLORS[p.mode] || ""}`}>{p.mode}</span>}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {p.application_count}{p.capacity ? `/${p.capacity}` : ""} applied
                </span>
              </div>

              {p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.skills.map((s) => (
                    <span key={s} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>
              )}

              {isApproved && (
                <div className="border-t border-slate-100 pt-3">
                  <button
                    onClick={() => toggleDocs(p.id)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-primary-600 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Project Documents
                    {expandedDocs[p.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {expandedDocs[p.id] && (
                    <div className="mt-3 space-y-2">
                      {loadingDocs[p.id] ? (
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <div className="w-3 h-3 border border-slate-300 border-t-transparent rounded-full animate-spin" />
                          Loading…
                        </div>
                      ) : documents[p.id]?.length === 0 ? (
                        <p className="text-xs text-slate-400">No documents uploaded yet.</p>
                      ) : (
                        documents[p.id]?.map((doc) => (
                          <a
                            key={doc.id}
                            href={`${API_URL}${doc.file_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-primary-50 transition-colors group"
                          >
                            <FileText className="w-4 h-4 text-slate-400 group-hover:text-primary-500 flex-shrink-0" />
                            <span className="text-sm text-slate-700 group-hover:text-primary-700 flex-1 min-w-0 truncate">{doc.name}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary-500 flex-shrink-0" />
                          </a>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {!myApp && !isFull && (
                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <input
                    className="input text-sm"
                    placeholder="Optional message to the organiser…"
                    value={message[p.id] || ""}
                    onChange={(e) => setMessage((m) => ({ ...m, [p.id]: e.target.value }))}
                  />
                  <button
                    onClick={() => apply(p.id)}
                    disabled={applying === p.id}
                    className="btn-primary"
                  >
                    {applying === p.id ? "Applying…" : "Apply to Project"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

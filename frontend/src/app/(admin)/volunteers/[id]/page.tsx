"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import api, { Volunteer, OnboardingChecklist, ActivityLog, JourneyStage } from "@/lib/api";
import { STAGE_COLORS, STAGE_LABELS } from "@/lib/utils";
import {
  ArrowLeft, Pencil, MapPin, GraduationCap, Briefcase, Clock,
  CheckCircle2, XCircle, Calendar, Activity, Upload, FileText, ExternalLink,
  FolderKanban,
} from "lucide-react";

const STAGES: JourneyStage[] = ["lead", "onboarded", "active", "returning", "alumni", "ambassador"];

const MODE_COLORS: Record<string, string> = {
  online:  "bg-blue-50 text-blue-700",
  offline: "bg-slate-100 text-slate-600",
  hybrid:  "bg-violet-50 text-violet-700",
};

interface StaffedProject {
  application_id: string;
  project_id: string;
  project_name: string;
  program?: string;
  project_status: string;
  application_status: string;
  applied_at: string;
  start_date?: string;
  end_date?: string;
}

export default function VolunteerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [volunteer,  setVolunteer]  = useState<Volunteer | null>(null);
  const [onboarding, setOnboarding] = useState<OnboardingChecklist | null>(null);
  const [logs,       setLogs]       = useState<ActivityLog[]>([]);
  const [projects,   setProjects]   = useState<StaffedProject[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Volunteer>(`/volunteers/${id}`),
      api.get<OnboardingChecklist>(`/onboarding/${id}`),
      api.get<ActivityLog[]>("/activity-logs", { params: { volunteer_id: id } }),
      api.get<StaffedProject[]>(`/volunteers/${id}/projects`),
    ]).then(([vRes, oRes, lRes, pRes]) => {
      setVolunteer(vRes.data);
      setOnboarding(oRes.data);
      setLogs(lRes.data);
      setProjects(pRes.data);
    });
  }, [id]);

  const updateStage = async (stage: JourneyStage) => {
    const res = await api.patch<Volunteer>(`/volunteers/${id}/stage`, { stage });
    setVolunteer(res.data);
  };

  const toggleOnboarding = async (field: string, value: boolean) => {
    const now = new Date().toISOString();
    const dateField = `${field}_at` as string;
    const payload: Record<string, boolean | string | null> = {
      [field]: value,
      [dateField]: value ? now : null,
    };
    const res = await api.patch<OnboardingChecklist>(`/onboarding/${id}`, payload);
    setOnboarding(res.data);
  };

  const uploadIdProof = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<OnboardingChecklist>(`/onboarding/${id}/upload-id-proof`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setOnboarding(res.data);
  };

  if (!volunteer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = volunteer.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const location = [volunteer.village, volunteer.block, volunteer.district, volunteer.state].filter(Boolean).join(", ");

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-slate-900 truncate">{volunteer.name}</h1>
              <p className="text-sm text-slate-500 truncate">{volunteer.email || volunteer.phone || "No contact"}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 hidden sm:inline ${STAGE_COLORS[volunteer.current_stage]}`}>
            {STAGE_LABELS[volunteer.current_stage]}
          </span>
        </div>
        <Link href={`/volunteers/${id}/edit`} className="btn-secondary flex items-center gap-2 flex-shrink-0">
          <Pencil className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </Link>
      </div>
      {/* Stage badge on mobile */}
      <div className="sm:hidden px-1">
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STAGE_COLORS[volunteer.current_stage]}`}>
          {STAGE_LABELS[volunteer.current_stage]}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Profile */}
        <div className="card p-5 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Profile</h2>

          {location && (
            <InfoRow icon={MapPin} label="Location" value={location} />
          )}
          {volunteer.qualification && (
            <InfoRow icon={GraduationCap} label="Qualification" value={`${volunteer.qualification}${volunteer.field_of_study ? ` — ${volunteer.field_of_study}` : ""}`} />
          )}
          {volunteer.occupation && (
            <InfoRow icon={Briefcase} label="Occupation" value={volunteer.occupation} />
          )}
          {volunteer.hours_per_month && (
            <InfoRow icon={Clock} label="Availability" value={`${volunteer.hours_per_month}h/month${volunteer.availability ? ` · ${volunteer.availability}` : ""}`} />
          )}

          {volunteer.skills.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {volunteer.skills.map((s) => (
                  <span key={s} className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-md">{s}</span>
                ))}
              </div>
            </div>
          )}
          {volunteer.languages.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Languages</p>
              <div className="flex flex-wrap gap-1.5">
                {volunteer.languages.map((l) => (
                  <span key={l} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-md">{l}</span>
                ))}
              </div>
            </div>
          )}
          {volunteer.interests.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {volunteer.interests.map((i) => (
                  <span key={i} className="bg-primary-50 text-primary-700 text-xs px-2 py-0.5 rounded-md">{i}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Journey */}
        <div className="card p-5 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Journey</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{volunteer.cumulative_hours}</p>
              <p className="text-xs text-slate-400 mt-0.5">Total Hours</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
              <p className="text-xs text-slate-400 mt-0.5">Sessions</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 mb-2">Update Stage</p>
            <select
              onChange={(e) => updateStage(e.target.value as JourneyStage)}
              value={volunteer.current_stage}
              className="input"
            >
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </select>
          </div>

          <div className="space-y-2 text-sm">
            {volunteer.last_active_date && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Last Active</span>
                <span className="text-slate-700 text-xs font-medium">{new Date(volunteer.last_active_date).toLocaleDateString()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400 text-xs">Joined</span>
              <span className="text-slate-700 text-xs font-medium">{new Date(volunteer.created_at).toLocaleDateString()}</span>
            </div>
            {volunteer.volunteer_type && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-xs">Volunteer Type</span>
                <span className="text-slate-700 text-xs font-medium capitalize">{volunteer.volunteer_type.replace("_", "-")}</span>
              </div>
            )}
          </div>
        </div>

        {/* Onboarding */}
        <div className="card p-5 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Onboarding</h2>
          {onboarding ? (
            <>
              <div className="space-y-1">
                <CheckRow
                  label="Orientation completed"
                  done={onboarding.orientation_completed}
                  date={onboarding.orientation_completed_at}
                  onToggle={() => toggleOnboarding("orientation_completed", !onboarding.orientation_completed)}
                />
                <CheckRow
                  label="Agreement signed"
                  done={onboarding.agreement_signed}
                  date={onboarding.agreement_signed_at}
                  onToggle={() => toggleOnboarding("agreement_signed", !onboarding.agreement_signed)}
                />
                <CheckRow
                  label="ID proof submitted"
                  done={onboarding.id_proof_submitted}
                  date={onboarding.id_proof_submitted_at}
                  onToggle={() => toggleOnboarding("id_proof_submitted", !onboarding.id_proof_submitted)}
                />
                <IdProofUpload
                  fileUrl={onboarding.id_proof_file_url}
                  onUpload={uploadIdProof}
                />
              </div>
              <div className={`rounded-lg px-3 py-2.5 text-xs font-medium ${onboarding.is_complete ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {onboarding.is_complete
                  ? "✓ Onboarding complete"
                  : `Pending: ${onboarding.pending_items.join(", ")}`}
              </div>
            </>
          ) : (
            <p className="text-slate-400 text-sm">No onboarding record.</p>
          )}
        </div>
      </div>

      {/* Documents */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Documents</h2>
        </div>
        {onboarding?.id_proof_file_url ? (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
            <FileText className="w-5 h-5 text-primary-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700">ID Proof</p>
              <p className="text-xs text-slate-400">Uploaded during onboarding</p>
            </div>
            <a
              href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${onboarding.id_proof_file_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View
            </a>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No documents uploaded yet.</p>
        )}
      </div>

      {/* Staffed Projects */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Staffed Projects</h2>
          <span className="text-xs text-slate-400 ml-auto">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
        </div>
        {projects.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">Not assigned to any projects yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {projects.map((p) => (
              <Link
                key={p.application_id}
                href={`/projects/${p.project_id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 group-hover:text-primary-600 truncate transition-colors">
                    {p.project_name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {p.program && (
                      <span className="text-xs text-slate-400">{p.program}</span>
                    )}
                    {(p.start_date || p.end_date) && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {p.start_date ? new Date(p.start_date).toLocaleDateString() : ""}
                        {p.start_date && p.end_date ? " — " : ""}
                        {p.end_date ? new Date(p.end_date).toLocaleDateString() : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    p.application_status === "approved" ? "bg-emerald-50 text-emerald-700" :
                    p.application_status === "rejected" ? "bg-red-50 text-red-600" :
                    "bg-amber-50 text-amber-700"
                  }`}>
                    {p.application_status}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    p.project_status === "active" ? "bg-teal-50 text-teal-700" :
                    p.project_status === "closed" ? "bg-slate-100 text-slate-500" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {p.project_status}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Activity Logs */}
      <div className="card overflow-hidden">
        <div className="px-4 md:px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700">Activity Log</h2>
          <span className="text-xs text-slate-400 ml-auto">{logs.length} session{logs.length !== 1 ? "s" : ""}</span>
        </div>
        {logs.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">No activity logged yet.</div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {logs.map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-slate-800 flex-1 min-w-0 truncate">{log.activity_name || "—"}</p>
                    <span className="font-bold text-slate-700 flex-shrink-0">{log.hours_logged}h</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs text-slate-500">{new Date(log.date).toLocaleDateString()}</span>
                    {log.mode && (
                      <span className={`text-xs px-2 py-0.5 rounded-md font-medium capitalize ${MODE_COLORS[log.mode] || "bg-slate-100 text-slate-600"}`}>
                        {log.mode}
                      </span>
                    )}
                    {log.location && <span className="text-xs text-slate-400">{log.location}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Activity", "Date", "Hours", "Mode", "Location"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-medium text-slate-800">{log.activity_name || "—"}</td>
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
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex gap-2.5">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" strokeWidth={1.5} />
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function CheckRow({ label, done, date, onToggle }: {
  label: string; done: boolean; date?: string | null; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors text-left group"
    >
      {done
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        : <XCircle className="w-4 h-4 text-slate-300 group-hover:text-slate-400 flex-shrink-0 transition-colors" />}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${done ? "text-slate-700" : "text-slate-400"}`}>{label}</p>
        {done && date && (
          <p className="text-[11px] text-slate-400">{new Date(date).toLocaleDateString()}</p>
        )}
      </div>
    </button>
  );
}

function IdProofUpload({ fileUrl, onUpload }: {
  fileUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      setError("Upload failed. Max 5 MB. PDF, JPG or PNG only.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  return (
    <div className="px-2 py-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" /> ID Proof Document
        </span>
        <label className={`flex items-center gap-1.5 text-xs cursor-pointer px-2.5 py-1 rounded-md border transition-colors ${uploading ? "opacity-50 cursor-not-allowed border-slate-200 text-slate-400" : "border-primary-200 text-primary-600 hover:bg-primary-50"}`}>
          <Upload className="w-3 h-3" />
          {uploading ? "Uploading…" : fileUrl ? "Re-upload" : "Upload file"}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={uploading}
            onChange={handleChange}
          />
        </label>
      </div>

      {fileUrl && (
        <a
          href={`${API_URL}${fileUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 hover:underline"
        >
          <ExternalLink className="w-3 h-3" /> View uploaded document
        </a>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      <p className="text-[11px] text-slate-400">PDF, JPG or PNG · max 5 MB</p>
    </div>
  );
}

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Types
export type VolunteerType = "remote" | "on_ground" | "hybrid";
export type JourneyStage =
  | "lead"
  | "onboarded"
  | "active"
  | "returning"
  | "alumni"
  | "ambassador";
export type ActivityMode = "online" | "offline" | "hybrid";
export type ProjectStatus = "draft" | "active" | "closed";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type EffortApproval = "auto" | "manual";
export type EffortLogStatus = "pending" | "approved" | "rejected";

export interface Volunteer {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  village?: string;
  block?: string;
  district?: string;
  state?: string;
  qualification?: string;
  field_of_study?: string;
  occupation?: string;
  volunteer_type?: VolunteerType;
  hours_per_month?: number;
  availability?: string;
  preferred_district?: string;
  preferred_program?: string;
  current_stage: JourneyStage;
  approval_status: ApprovalStatus;
  last_active_date?: string;
  created_at: string;
  updated_at: string;
  skills: string[];
  languages: string[];
  interests: string[];
  cumulative_hours: number;
}

export interface ActivityLog {
  id: string;
  volunteer_id: string;
  activity_id?: string;
  activity_name?: string;
  date: string;
  hours_logged: number;
  mode?: ActivityMode;
  location?: string;
  notes?: string;
  created_at: string;
}

export interface OnboardingChecklist {
  id: string;
  volunteer_id: string;
  orientation_completed: boolean;
  orientation_completed_at?: string;
  agreement_signed: boolean;
  agreement_signed_at?: string;
  id_proof_submitted: boolean;
  id_proof_submitted_at?: string;
  id_proof_file_url?: string | null;
  buddy_id?: string;
  onboarding_completed_at?: string;
  updated_at: string;
  is_complete: boolean;
  pending_items: string[];
}

export interface DashboardData {
  total_volunteers: number;
  active_volunteers: number;
  total_hours_logged: number;
  onboarding_completed: number;
  stage_breakdown: Record<string, number>;
  pending_compliance: number;
  total_projects: number;
  active_projects: number;
  total_applications: number;
  pending_applications: number;
  project_status_breakdown: Record<string, number>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  program?: string;
  status: ProjectStatus;
  start_date?: string;
  end_date?: string;
  location?: string;
  mode?: ActivityMode;
  capacity?: number;
  skills: string[];
  effort_approval: EffortApproval;
  created_at: string;
  updated_at: string;
  application_count: number;
}

export interface ProjectApplication {
  id: string;
  project_id: string;
  volunteer_id: string;
  status: ApplicationStatus;
  message?: string;
  applied_at: string;
  reviewed_at?: string;
  volunteer_name?: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  name: string;
  file_url: string;
  uploaded_by?: string;
  uploaded_at: string;
}

export interface EffortLog {
  id: string;
  project_id: string;
  volunteer_id: string;
  date: string;
  hours: number;
  description?: string;
  status: EffortLogStatus;
  created_at: string;
  reviewed_at?: string;
  volunteer_name?: string;
}

export interface VolunteerSuggestion {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  district?: string;
  preferred_district?: string;
  preferred_program?: string;
  current_stage: string;
  skills: string[];
  match_score: number;
  match_reasons: string[];
}

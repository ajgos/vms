"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { INDIA_STATES, getDistricts } from "@/lib/india-locations";

type FormState = {
  email: string; password: string; confirmPassword: string;
  name: string; age: string; gender: string; phone: string;
  village: string; block: string; district: string; state: string;
  qualification: string; field_of_study: string; occupation: string;
  volunteer_type: string; hours_per_month: string; availability: string;
  preferred_state: string; preferred_district: string; preferred_program: string;
  skills: string; languages: string; interests: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY: FormState = {
  email: "", password: "", confirmPassword: "",
  name: "", age: "", gender: "", phone: "",
  village: "", block: "", district: "", state: "",
  qualification: "", field_of_study: "", occupation: "",
  volunteer_type: "", hours_per_month: "", availability: "",
  preferred_state: "", preferred_district: "", preferred_program: "",
  skills: "", languages: "", interests: "",
};

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim() || form.name.trim().length < 2)
    errors.name = "Name must be at least 2 characters.";

  if (form.phone) {
    const digits = form.phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits))
      errors.phone = "Enter a valid 10-digit Indian mobile number (starts with 6–9).";
  }

  if (form.age) {
    const age = Number(form.age);
    if (!Number.isInteger(age) || age < 16 || age > 80)
      errors.age = "Age must be between 16 and 80.";
  }

  if (!form.password) {
    errors.password = "Password is required.";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  } else if (!/[a-zA-Z]/.test(form.password) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(form.password)) {
    errors.password = "Password must include at least one letter and one number or symbol.";
  }

  if (form.confirmPassword !== form.password)
    errors.confirmPassword = "Passwords do not match.";

  if (form.hours_per_month) {
    const h = Number(form.hours_per_month);
    if (isNaN(h) || h < 1 || h > 200)
      errors.hours_per_month = "Hours per month must be between 1 and 200.";
  }

  return errors;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500 mt-1">{msg}</p>;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (f: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      setForm((p) => {
        const next = { ...p, [f]: value };
        // Reset dependent district when state changes
        if (f === "state") next.district = "";
        if (f === "preferred_state") next.preferred_district = "";
        return next;
      });
      // Clear field error on change
      if (errors[f]) setErrors((prev) => ({ ...prev, [f]: undefined }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setSubmitError("Please fix the errors below before submitting.");
      return;
    }
    setErrors({});
    setSubmitError("");
    setSaving(true);
    try {
      const res = await api.post<{ access_token: string }>("/auth/register", {
        email: form.email,
        password: form.password,
        name: form.name,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        phone: form.phone ? form.phone.replace(/\D/g, "") : undefined,
        village: form.village || undefined,
        block: form.block || undefined,
        district: form.district || undefined,
        state: form.state || undefined,
        qualification: form.qualification || undefined,
        field_of_study: form.field_of_study || undefined,
        occupation: form.occupation || undefined,
        volunteer_type: form.volunteer_type || undefined,
        hours_per_month: form.hours_per_month ? Number(form.hours_per_month) : undefined,
        availability: form.availability || undefined,
        preferred_district: form.preferred_district || undefined,
        preferred_program: form.preferred_program || undefined,
        skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        languages: form.languages ? form.languages.split(",").map((s) => s.trim()).filter(Boolean) : [],
        interests: form.interests ? form.interests.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      localStorage.setItem("token", res.data.access_token);
      router.push("/pending-approval");
    } catch (err: any) {
      setSubmitError(err?.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const locationDistricts = getDistricts(form.state);
  const preferredDistricts = getDistricts(form.preferred_state);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <a href="/login" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">Volunteer Registration</p>
              <p className="text-xs text-slate-400">Join our network</p>
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4">{submitError}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Account */}
          <div className="card p-4 md:p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Email <span className="text-red-400">*</span></label>
                <input type="email" required className="input" value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Password <span className="text-red-400">*</span></label>
                <input type="password" required className={`input ${errors.password ? "border-red-300" : ""}`} value={form.password} onChange={set("password")} placeholder="Min. 8 chars, include a number or symbol" />
                <FieldError msg={errors.password} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm Password <span className="text-red-400">*</span></label>
                <input type="password" required className={`input ${errors.confirmPassword ? "border-red-300" : ""}`} value={form.confirmPassword} onChange={set("confirmPassword")} placeholder="Repeat password" />
                <FieldError msg={errors.confirmPassword} />
              </div>
            </div>
          </div>

          {/* Personal */}
          <div className="card p-4 md:p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input required className={`input ${errors.name ? "border-red-300" : ""}`} value={form.name} onChange={set("name")} placeholder="e.g. Priya Sharma" />
                <FieldError msg={errors.name} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Age</label>
                <input type="number" className={`input ${errors.age ? "border-red-300" : ""}`} value={form.age} onChange={set("age")} placeholder="25" min={16} max={80} />
                <FieldError msg={errors.age} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Gender</label>
                <select className="input" value={form.gender} onChange={set("gender")}>
                  <option value="">Select</option>
                  <option>Male</option><option>Female</option>
                  <option>Non-binary</option><option>Prefer not to say</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Phone</label>
                <input className={`input ${errors.phone ? "border-red-300" : ""}`} value={form.phone} onChange={set("phone")} placeholder="9876543210" maxLength={13} />
                <FieldError msg={errors.phone} />
                {!errors.phone && <p className="text-xs text-slate-400 mt-1">10-digit Indian mobile number</p>}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="card p-4 md:p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">State</label>
                <select className="input" value={form.state} onChange={set("state")}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">District</label>
                <select className="input" value={form.district} onChange={set("district")} disabled={!form.state}>
                  <option value="">{form.state ? "Select district" : "Select state first"}</option>
                  {locationDistricts.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Block</label>
                <input className="input" value={form.block} onChange={set("block")} placeholder="Block / Tehsil" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Village</label>
                <input className="input" value={form.village} onChange={set("village")} placeholder="Village / Town" />
              </div>
            </div>
          </div>

          {/* Education & Skills */}
          <div className="card p-4 md:p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Education &amp; Skills</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Qualification</label><input className="input" value={form.qualification} onChange={set("qualification")} placeholder="e.g. B.A., 12th Pass" /></div>
              <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Field of Study</label><input className="input" value={form.field_of_study} onChange={set("field_of_study")} placeholder="e.g. Social Work" /></div>
              <div className="col-span-1 sm:col-span-2"><label className="block text-xs font-medium text-slate-600 mb-1.5">Occupation</label><input className="input" value={form.occupation} onChange={set("occupation")} placeholder="e.g. Teacher, Student" /></div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Skills <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input className="input" value={form.skills} onChange={set("skills")} placeholder="Teaching, Design, Data entry" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Languages <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input className="input" value={form.languages} onChange={set("languages")} placeholder="Hindi, English, Tamil" />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="card p-4 md:p-6 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Volunteer Preferences</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Volunteer Type</label>
                <select className="input" value={form.volunteer_type} onChange={set("volunteer_type")}>
                  <option value="">Select</option>
                  <option value="remote">Remote</option>
                  <option value="on_ground">On-ground</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Hours per month</label>
                <input type="number" className={`input ${errors.hours_per_month ? "border-red-300" : ""}`} value={form.hours_per_month} onChange={set("hours_per_month")} placeholder="8" min={1} max={200} />
                <FieldError msg={errors.hours_per_month} />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Availability</label>
                <input className="input" value={form.availability} onChange={set("availability")} placeholder="Weekends, evenings" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Preferred State</label>
                <select className="input" value={form.preferred_state} onChange={set("preferred_state")}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Preferred District</label>
                <select className="input" value={form.preferred_district} onChange={set("preferred_district")} disabled={!form.preferred_state}>
                  <option value="">{form.preferred_state ? "Select district" : "Select state first"}</option>
                  {preferredDistricts.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Preferred Program</label>
                <input className="input" value={form.preferred_program} onChange={set("preferred_program")} placeholder="e.g. Education, Healthcare" />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Areas of Interest <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input className="input" value={form.interests} onChange={set("interests")} placeholder="Education, Health, Environment" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary w-full py-3">
            {saving ? "Submitting…" : "Submit Registration"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already registered?{" "}
            <a href="/login" className="text-primary-600 font-medium hover:underline">Sign in</a>
          </p>
        </form>
      </div>
    </div>
  );
}

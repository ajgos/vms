"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api, { Volunteer } from "@/lib/api";
import { ArrowLeft, Save } from "lucide-react";

type FormState = {
  name: string; age: string; gender: string; phone: string; email: string;
  village: string; block: string; district: string; state: string;
  qualification: string; field_of_study: string; occupation: string;
  volunteer_type: string; hours_per_month: string; availability: string;
  preferred_district: string; preferred_program: string;
  skills: string; languages: string; interests: string;
};

const EMPTY_FORM: FormState = {
  name: "", age: "", gender: "", phone: "", email: "",
  village: "", block: "", district: "", state: "",
  qualification: "", field_of_study: "", occupation: "",
  volunteer_type: "", hours_per_month: "", availability: "",
  preferred_district: "", preferred_program: "",
  skills: "", languages: "", interests: "",
};

export function volunteerToForm(v: Volunteer): FormState {
  return {
    name: v.name || "",
    age: v.age?.toString() || "",
    gender: v.gender || "",
    phone: v.phone || "",
    email: v.email || "",
    village: v.village || "",
    block: v.block || "",
    district: v.district || "",
    state: v.state || "",
    qualification: v.qualification || "",
    field_of_study: v.field_of_study || "",
    occupation: v.occupation || "",
    volunteer_type: v.volunteer_type || "",
    hours_per_month: v.hours_per_month?.toString() || "",
    availability: v.availability || "",
    preferred_district: v.preferred_district || "",
    preferred_program: v.preferred_program || "",
    skills: v.skills.join(", "),
    languages: v.languages.join(", "),
    interests: v.interests.join(", "),
  };
}

function buildPayload(form: FormState) {
  return {
    ...form,
    age: form.age ? Number(form.age) : undefined,
    hours_per_month: form.hours_per_month ? Number(form.hours_per_month) : undefined,
    volunteer_type: form.volunteer_type || undefined,
    skills: form.skills ? form.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
    languages: form.languages ? form.languages.split(",").map((s) => s.trim()).filter(Boolean) : [],
    interests: form.interests ? form.interests.split(",").map((s) => s.trim()).filter(Boolean) : [],
  };
}

export function VolunteerForm({
  initial, onSubmit, submitLabel, backHref,
}: {
  initial?: FormState;
  onSubmit: (payload: ReturnType<typeof buildPayload>) => Promise<void>;
  submitLabel: string;
  backHref: string;
}) {
  const [form, setForm] = useState<FormState>(initial ?? EMPTY_FORM);
  const [error, setError]     = useState("");
  const [saving, setSaving]   = useState(false);

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(buildPayload(form));
    } catch {
      setError("Something went wrong. Please check the form and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      <div className="card p-4 md:p-6 space-y-5">
        <SectionTitle>Personal Information</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Full Name" required>
            <input className="input" value={form.name} onChange={set("name")} required placeholder="e.g. Priya Sharma" />
          </Field>
          <Field label="Age">
            <input type="number" className="input" value={form.age} onChange={set("age")} placeholder="25" min={0} max={120} />
          </Field>
          <Field label="Gender">
            <select className="input" value={form.gender} onChange={set("gender")}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option>
              <option>Non-binary</option><option>Prefer not to say</option>
            </select>
          </Field>
          <Field label="Phone">
            <input className="input" value={form.phone} onChange={set("phone")} placeholder="+91 98765 43210" />
          </Field>
          <Field label="Email" span={2}>
            <input type="email" className="input" value={form.email} onChange={set("email")} placeholder="priya@example.com" />
          </Field>
        </div>
      </div>

      <div className="card p-4 md:p-6 space-y-5">
        <SectionTitle>Location</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Village"><input className="input" value={form.village} onChange={set("village")} /></Field>
          <Field label="Block"><input className="input" value={form.block} onChange={set("block")} /></Field>
          <Field label="District"><input className="input" value={form.district} onChange={set("district")} /></Field>
          <Field label="State"><input className="input" value={form.state} onChange={set("state")} /></Field>
        </div>
      </div>

      <div className="card p-4 md:p-6 space-y-5">
        <SectionTitle>Education & Skills</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Qualification"><input className="input" value={form.qualification} onChange={set("qualification")} /></Field>
          <Field label="Field of Study"><input className="input" value={form.field_of_study} onChange={set("field_of_study")} /></Field>
          <Field label="Occupation" span={2}><input className="input" value={form.occupation} onChange={set("occupation")} /></Field>
          <Field label="Skills" sub="comma-separated" span={2}>
            <input className="input" value={form.skills} onChange={set("skills")} placeholder="Teaching, Data entry, Design" />
          </Field>
          <Field label="Languages" sub="comma-separated" span={2}>
            <input className="input" value={form.languages} onChange={set("languages")} placeholder="Hindi, English, Tamil" />
          </Field>
        </div>
      </div>

      <div className="card p-4 md:p-6 space-y-5">
        <SectionTitle>Volunteer Preferences</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Volunteer Type">
            <select className="input" value={form.volunteer_type} onChange={set("volunteer_type")}>
              <option value="">Select</option>
              <option value="remote">Remote</option>
              <option value="on_ground">On-ground</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </Field>
          <Field label="Hours per month">
            <input type="number" className="input" value={form.hours_per_month} onChange={set("hours_per_month")} placeholder="8" min={0} />
          </Field>
          <Field label="Availability" span={2}>
            <input className="input" value={form.availability} onChange={set("availability")} placeholder="Weekends, evenings" />
          </Field>
          <Field label="Areas of Interest" sub="comma-separated" span={2}>
            <input className="input" value={form.interests} onChange={set("interests")} placeholder="Education, Health, Environment" />
          </Field>
          <Field label="Preferred District">
            <input className="input" value={form.preferred_district} onChange={set("preferred_district")} />
          </Field>
          <Field label="Preferred Program">
            <input className="input" value={form.preferred_program} onChange={set("preferred_program")} />
          </Field>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link href={backHref} className="btn-secondary flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{children}</h3>;
}

function Field({ label, sub, children, required, span }: {
  label: string; sub?: string; children: React.ReactNode; required?: boolean; span?: number;
}) {
  return (
    <div className={span === 2 ? "col-span-1 sm:col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        {sub && <span className="text-slate-400 font-normal ml-1">({sub})</span>}
      </label>
      {children}
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { VolunteerForm } from "@/components/volunteers/VolunteerForm";
import { ArrowLeft } from "lucide-react";

export default function NewVolunteerPage() {
  const router = useRouter();

  const handleSubmit = async (payload: any) => {
    const res = await api.post("/volunteers", payload);
    router.push(`/volunteers/${res.data.id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Volunteer</h1>
        <p className="text-slate-500 text-sm mt-1">Register a new volunteer in the system</p>
      </div>
      <VolunteerForm
        onSubmit={handleSubmit}
        submitLabel="Create Volunteer"
        backHref="/volunteers"
      />
    </div>
  );
}

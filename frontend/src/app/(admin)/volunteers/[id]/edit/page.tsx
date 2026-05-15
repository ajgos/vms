"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api, { Volunteer } from "@/lib/api";
import { VolunteerForm, volunteerToForm } from "@/components/volunteers/VolunteerForm";

export default function EditVolunteerPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);

  useEffect(() => {
    api.get<Volunteer>(`/volunteers/${id}`).then((r) => setVolunteer(r.data));
  }, [id]);

  const handleSubmit = async (payload: any) => {
    await api.patch(`/volunteers/${id}`, payload);
    router.push(`/volunteers/${id}`);
  };

  if (!volunteer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Volunteer</h1>
        <p className="text-slate-500 text-sm mt-1">Updating profile for <strong>{volunteer.name}</strong></p>
      </div>
      <VolunteerForm
        initial={volunteerToForm(volunteer)}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        backHref={`/volunteers/${id}`}
      />
    </div>
  );
}

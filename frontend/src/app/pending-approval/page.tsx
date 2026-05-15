"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Heart, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function PendingApprovalPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) { router.replace("/login"); return; }
      if (user.role === "admin") { router.replace("/"); return; }
      if (user.approval_status === "approved") { router.replace("/portal"); return; }
    }
  }, [user, loading, router]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
        </div>

        <div className="card p-8 space-y-4">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pending Approval</h1>
            <p className="text-sm text-slate-500 mt-2">
              Your registration has been received. An admin will review and approve your profile shortly.
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg px-4 py-3 text-left">
            <p className="text-xs text-slate-400">Registered as</p>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary w-full flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Already approved? Try{" "}
          <button onClick={() => router.refresh()} className="text-primary-600 underline">
            refreshing
          </button>
          .
        </p>
      </div>
    </div>
  );
}

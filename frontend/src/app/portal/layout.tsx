"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { FolderKanban, Heart, LogOut } from "lucide-react";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) { router.replace("/login"); return; }
      if (user.role === "admin") { router.replace("/"); return; }
      if (user.approval_status === "pending") { router.replace("/pending-approval"); return; }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "volunteer" || user.approval_status !== "approved") return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav for volunteers */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary-600 rounded-md flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-900 text-sm">VMS</span>
          </div>
          <nav className="flex items-center gap-1">
            <Link href="/portal/projects" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              <FolderKanban className="w-4 h-4" /> Projects
            </Link>
          </nav>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}

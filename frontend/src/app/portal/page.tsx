"use client";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { FolderKanban, ArrowRight } from "lucide-react";

export default function PortalPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back!</h1>
        <p className="text-slate-500 text-sm mt-1">{user?.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/portal/projects" className="card p-6 flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-900">Browse Projects</p>
            <p className="text-sm text-slate-500 mt-0.5">Find and apply for active projects</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}

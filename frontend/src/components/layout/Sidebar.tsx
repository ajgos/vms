"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, ClipboardList, CheckSquare, FolderKanban, Heart, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const nav = [
  { href: "/",            label: "Dashboard",  icon: LayoutDashboard },
  { href: "/volunteers",  label: "Volunteers", icon: Users },
  { href: "/activities",  label: "Activities", icon: ClipboardList },
  { href: "/onboarding",  label: "Onboarding", icon: CheckSquare },
  { href: "/projects",    label: "Projects",   icon: FolderKanban },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const path = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const isActive = (href: string) => href === "/" ? path === "/" : path.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30
        transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-slate-900">VMS</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Volunteer Hub</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-primary-50 text-primary-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Icon
              className={`w-5 h-5 flex-shrink-0 ${isActive(href) ? "text-primary-600" : "text-slate-400"}`}
              strokeWidth={2}
            />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-200 flex-shrink-0 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <LogOut className="w-5 h-5 text-slate-400" strokeWidth={2} />
          Sign out
        </button>
        <p className="text-[11px] text-slate-400 px-3">© {new Date().getFullYear()} NGO Platform</p>
      </div>
    </aside>
  );
}

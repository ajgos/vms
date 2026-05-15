"use client";
import { useState } from "react";
import { Menu, Heart } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="md:ml-60 min-h-screen flex flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-10 md:hidden bg-white border-b border-slate-200 px-4 h-14 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary-600 rounded-md flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-slate-900 text-sm">VMS</span>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-5 md:py-8">
          {children}
        </main>
      </div>
    </>
  );
}

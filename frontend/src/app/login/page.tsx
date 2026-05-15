"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // login sets user in context; read the response user from /auth/me via context
      // redirect after a tick to let context update
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const user = await res.json();
      if (user.role === "admin") {
        router.push("/");
      } else if (user.approval_status === "pending") {
        router.push("/pending-approval");
      } else {
        router.push("/portal");
      }
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 leading-none">VMS</p>
            <p className="text-xs text-slate-400 uppercase tracking-wide">Volunteer Hub</p>
          </div>
        </div>

        <div className="card p-6 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sign in</h1>
            <p className="text-sm text-slate-500 mt-0.5">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1.5">Password</label>
              <input
                type="password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500">
            New volunteer?{" "}
            <a href="/register" className="text-primary-600 font-medium hover:underline">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

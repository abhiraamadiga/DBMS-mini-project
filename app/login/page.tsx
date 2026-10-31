"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Truck,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoAllSuccess, setDemoAllSuccess] = useState(false);
  const [demoAllLoading, setDemoAllLoading] = useState(false);

  const handleDemoAll = async () => {
    setDemoAllLoading(true);
    try {
      const res = await fetch("/api/auth/demo-session-all", { method: "POST" });
      if (!res.ok) throw new Error("Failed to initialize demo sessions");
      setDemoAllSuccess(true);
      toast.success("All 3 demo accounts authenticated! Open each portal below.");
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize demo accounts");
    } finally {
      setDemoAllLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detailsMsg = data?.error?.details?.map((d: any) => d.message).join(", ");
        throw new Error(detailsMsg || data?.error?.message || "Invalid email or password");
      }

      const user = data.data?.user || data.data;
      const role = user?.role;
      const name = user?.name || "User";

      toast.success(`Welcome back, ${name}!`);

      if (nextUrl) {
        if (
          (role === "ADMIN" && nextUrl.startsWith("/admin")) ||
          (role === "DELIVERY_PARTNER" && nextUrl.startsWith("/partner")) ||
          (role === "CUSTOMER" && nextUrl.startsWith("/customer"))
        ) {
          router.push(nextUrl);
          router.refresh();
          return;
        }
      }

      if (role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (role === "DELIVERY_PARTNER") {
        router.push("/partner/dashboard");
      } else {
        router.push("/customer/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
      toast.error(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Left Hero Panel */}
      <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-700 via-indigo-600 to-cyan-600 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
        {/* Subtle decorative background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">SmartLogistics</span>
          </Link>

          <div className="space-y-4 max-w-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Enterprise Role-Based Logistics Portal
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
              Unified control center for administrators, delivery partners, and customers. Real-time updates, strict role isolation, and end-to-end auditability.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 my-8 space-y-3.5 pt-4 border-t border-white/20">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-indigo-100">
            <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>Multi-tenant data scoping enforced at query and JWT level</span>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-indigo-100">
            <Truck className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>Driver delivery workflows with finite-state status validation</span>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-indigo-100">
            <User className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>Self-service customer booking and tracking portal</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-200">
          DBMS Mini Project &middot; MySQL 8 + MongoDB
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select a demo role or enter your credentials below
            </p>
          </div>

          {/* Viva / Demo Quick Fill Chips */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-sm space-y-2">
            <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
              <span>Quick Demo Accounts (1-Click Fill)</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Viva Ready</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("admin@smartlogistics.com", "Admin@123")}
                className="flex items-center gap-2 p-2 rounded-lg border border-purple-200 bg-purple-50/60 hover:bg-purple-100 text-purple-800 text-xs font-medium transition-all text-left"
              >
                <div className="w-2 h-2 rounded-full bg-purple-600 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold">Admin</div>
                  <div className="text-[10px] text-purple-600 truncate">admin@smartlogistics.com</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo("rajesh.partner@smartlogistics.com", "Partner@123")}
                className="flex items-center gap-2 p-2 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-800 text-xs font-medium transition-all text-left"
              >
                <div className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold">Partner</div>
                  <div className="text-[10px] text-amber-600 truncate">rajesh@...</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo("aditi.sharma@example.com", "Customer@123")}
                className="flex items-center gap-2 p-2 rounded-lg border border-sky-200 bg-sky-50/60 hover:bg-sky-100 text-sky-800 text-xs font-medium transition-all text-left"
              >
                <div className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold">Customer</div>
                  <div className="text-[10px] text-sky-600 truncate">aditi@...</div>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="pt-2 text-center text-xs text-slate-600 space-y-2">
            <div>
              New customer?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 underline">
                Create a free customer account
              </Link>
            </div>
            <div>
              <Link href="/" className="text-slate-400 hover:text-slate-600">
                &larr; Back to public tracking
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading sign in...</div>}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Full name must be at least 2 characters");
      return;
    }

    if (phone.trim().length < 7) {
      setError("Please enter a valid phone number (at least 7 digits)");
      return;
    }

    if (address.trim().length < 5) {
      setError("Address must be at least 5 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError("Password must contain at least one letter and one number");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const detailsMsg = data?.error?.details?.map((d: any) => d.message).join(", ");
        throw new Error(detailsMsg || data?.error?.message || "Registration failed. Try again.");
      }

      toast.success("Account created successfully! Welcome to SmartLogistics.");
      router.push("/customer/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to create account");
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Left Branding Panel */}
      <div className="w-full md:w-5/12 bg-gradient-to-br from-indigo-700 via-indigo-600 to-cyan-600 p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all">
              <Package className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">SmartLogistics</span>
          </Link>

          <div className="space-y-4 max-w-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Create Your Customer Account
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
              Book parcel shipments across nationwide warehouse routes, track real-time delivery milestones, and view complete dispatch history.
            </p>
          </div>
        </div>

        <div className="relative z-10 my-8 space-y-3.5 pt-4 border-t border-white/20">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-indigo-100">
            <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>Instant booking with transparent route transit SLAs</span>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-indigo-100">
            <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>Dedicated personal dashboard with one-click shipment cancellation</span>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-indigo-100">
            <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0" />
            <span>Strict privacy: your shipments are visible only to you</span>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-200">
          DBMS Mini Project &middot; MySQL 8 + MongoDB
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-lg space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register as a Customer</h2>
            <p className="text-sm text-slate-500 mt-1">
              Fill in your details to create an account and start shipping
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aarav Sharma"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91-9876543210"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav@example.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 MG Road, Bengaluru, Karnataka 560001"
                required
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
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

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Confirm Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                />
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
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Customer Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-600 space-y-2">
            <div>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 underline">
                Sign in here
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

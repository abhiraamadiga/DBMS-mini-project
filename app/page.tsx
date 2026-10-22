"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowRight,
  Search,
  ShieldCheck,
  Clock,
  Truck,
  BarChart3,
  LogIn,
  UserPlus,
  Building2,
  Users,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [trackingId, setTrackingId] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingId.trim()) {
      router.push(`/track/${trackingId.trim().toUpperCase()}`);
    }
  };

  const handleSampleClick = (sampleId: string) => {
    setTrackingId(sampleId);
    router.push(`/track/${sampleId}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between text-slate-800">
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-base text-slate-900 tracking-tight block leading-tight">
                SmartLogistics
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                DBMS Mini Project
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Register
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              Portal Sign In
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl w-full mx-auto text-center px-4 py-12 sm:py-16 space-y-8 my-auto">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-xs font-semibold text-indigo-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Role-Based Multi-Tier Logistics System
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Track Shipments with{" "}
            <span className="text-indigo-600">
              Precision & Real-Time Milestones
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 leading-relaxed">
            Enterprise DBMS solution with strict role-based scoping for administrators, delivery partners, and senders. High-integrity MySQL transactions with real-time MongoDB auditing.
          </p>
        </div>

        {/* Public Tracking Input Card */}
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleTrack}
            className="flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl border border-slate-300 bg-white shadow-sm"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter tracking ID (e.g. SLM2026000001)..."
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 text-slate-900 placeholder:text-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-xs"
            >
              Track Now
            </button>
          </form>

          {/* Quick sample chips */}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500 flex-wrap">
            <span className="font-medium">Seeded Test IDs:</span>
            {["SLM2026000001", "SLM2026000005", "SLM2026000012"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSampleClick(id)}
                className="font-mono text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-indigo-300 transition-colors shadow-2xs"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Three Role Portals Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 text-left">
          <div className="p-5 rounded-2xl border border-purple-200 bg-white hover:border-purple-300 transition-all space-y-2 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Admin Operations</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Full control over warehouses, routes, fleet vehicles, drivers, customer accounts, and global dispatch metrics.
            </p>
            <div className="pt-2">
              <Link href="/login" className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1">
                Admin Sign In <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-amber-200 bg-white hover:border-amber-300 transition-all space-y-2 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Delivery Partner</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Dedicated driver view with assigned shipments, vehicle check, and sequential status milestone transitions.
            </p>
            <div className="pt-2">
              <Link href="/login" className="text-xs font-semibold text-amber-700 hover:text-amber-800 flex items-center gap-1">
                Driver Sign In <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-sky-200 bg-white hover:border-sky-300 transition-all space-y-2 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Customer Portal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Self-service shipment booking across warehouse routes, personal dispatch history, and cancellation.
            </p>
            <div className="pt-2">
              <Link href="/login" className="text-xs font-semibold text-sky-700 hover:text-sky-800 flex items-center gap-1">
                Customer Sign In <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 text-left">
          {[
            {
              icon: Search,
              title: "Live Milestone Tracking",
              desc: "Instant event logs with timestamped checkpoint updates from origin hub to destination doorstep.",
            },
            {
              icon: Truck,
              title: "Fleet & Route Optimization",
              desc: "Vehicle assignment, driver mapping, and verified warehouse-to-warehouse transit with capacity limits.",
            },
            {
              icon: Clock,
              title: "SLA Delay Detection",
              desc: "Proactive automated database view calculation identifying delayed shipments past expected delivery.",
            },
            {
              icon: BarChart3,
              title: "Operational Analytics",
              desc: "Complete DBMS intelligence with 14-day booking throughput, route loads, and MongoDB audit logs.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="font-semibold text-xs text-slate-900">{item.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DBMS Mini Project &middot; Smart Logistics &middot; MySQL 8 + MongoDB</span>
          <div className="flex items-center gap-4 text-[11px]">
            <Link href="/login" className="hover:text-indigo-600">Portal Login</Link>
            <Link href="/register" className="hover:text-indigo-600">Register</Link>
            <Link href="/track/SLM2026000001" className="hover:text-indigo-600">Sample Tracking</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

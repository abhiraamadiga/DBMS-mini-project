"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, LayoutDashboard, Search, ShieldCheck, Clock, Truck, BarChart3 } from "lucide-react";

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
    <div className="min-h-screen bg-[var(--background)] flex flex-col justify-between px-4 py-8">
      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-[var(--foreground)] tracking-tight">Smart Logistics</span>
            <span className="hidden sm:inline-block ml-2 text-xs text-indigo-400 font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
              DBMS System
            </span>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20"
        >
          <LayoutDashboard className="w-4 h-4" />
          Admin Dashboard
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl w-full mx-auto text-center space-y-8 my-auto py-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-xs font-semibold text-indigo-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            Reliable Multi-Hub Supply Chain Tracking
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-[var(--foreground)] tracking-tight">
            Track Shipments with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">
              Precision & Speed
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-[var(--muted-foreground)]">
            Enterprise fleet monitoring, route coordination, automated status checkpoints, and complete real-time visibility.
          </p>
        </div>

        {/* Big Tracking Search Box */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2.5 p-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter tracking ID (e.g. SLM2026000001)"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-transparent text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] font-mono text-base focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
            >
              Track Now
            </button>
          </form>

          {/* Quick sample chips */}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[var(--muted-foreground)] flex-wrap">
            <span>Quick test IDs:</span>
            {["SLM2026000001", "SLM2026000005", "SLM2026000012"].map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSampleClick(id)}
                className="font-mono text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded-md bg-[var(--card)] border border-[var(--border)] hover:border-indigo-500/40 transition-colors"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* 4 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-8 text-left">
          {[
            {
              icon: Search,
              title: "Live Milestone Tracking",
              desc: "Instant event logs with timestamped checkpoint updates from hub to doorstep.",
            },
            {
              icon: Truck,
              title: "Fleet & Route Optimization",
              desc: "Vehicle assignment, driver mapping, and verified warehouse-to-warehouse transit.",
            },
            {
              icon: Clock,
              title: "Delay & Exception Alerts",
              desc: "Proactive automated detection of delayed and pending shipments against SLA.",
            },
            {
              icon: BarChart3,
              title: "Operational Intelligence",
              desc: "Complete DBMS analytics with daily transit throughput and route load metrics.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-indigo-500/30 transition-all space-y-2.5"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-sm text-[var(--foreground)]">{item.title}</h3>
                <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center py-4 border-t border-[var(--border)] text-xs text-[var(--muted-foreground)]">
        DBMS Mini Project · Smart Logistics & Shipment Management System · MySQL 8 + MongoDB
      </footer>
    </div>
  );
}

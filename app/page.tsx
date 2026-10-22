import Link from "next/link";
import { Package, ShieldCheck, ArrowRight, Truck, Compass, Building2 } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-6 py-20 bg-[var(--background)]">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-sm font-medium">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Smart Logistics Management System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--foreground)]">
          Real-time Shipment Tracking &{" "}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
            Fleet Intelligence
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto">
          Centralized management for customers, packages, warehouses, vehicles, drivers, and tracking events.
          Powered by MySQL 8 raw relational queries and MongoDB audit logs.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <div className="px-6 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] font-mono text-sm text-[var(--foreground)]">
            Tracking ID Format: <span className="text-cyan-400">SLM2026000001</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 text-left">
          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[var(--foreground)]">Shipment Tracking</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Instant lookup and full event timeline with trigger-maintained current status.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[var(--foreground)]">Fleet & Driver Network</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Real-time driver assignments, vehicle availability checks, and multi-vehicle mapping.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-[var(--foreground)]">Hubs & Routes</h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              Origin and destination warehouse routing with capacity constraints and distance estimates.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

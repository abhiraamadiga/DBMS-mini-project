"use client";

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Package, Truck, Users, AlertTriangle, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format } from "date-fns";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  BOOKED: "#64748b", PICKED_UP: "#3b82f6", IN_TRANSIT: "#6366f1",
  AT_WAREHOUSE: "#f59e0b", OUT_FOR_DELIVERY: "#06b6d4", DELIVERED: "#22c55e", CANCELLED: "#9ca3af",
};

function StatCard({ label, value, icon: Icon, color, sub }: any) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
        <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
        {sub && <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      const json = await res.json();
      return json.data;
    },
  });

  const { data: recentShipments } = useQuery({
    queryKey: ["shipments-recent"],
    queryFn: async () => {
      const res = await fetch("/api/shipments?limit=5");
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-[var(--secondary)] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data || {};

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Dashboard</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Smart Logistics Operations Overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shipments" value={stats.totalShipments ?? 0} icon={Package} color="bg-indigo-500/10 text-indigo-400" />
        <StatCard label="In Transit" value={stats.inTransitCount ?? 0} icon={Truck} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="Delivered" value={stats.deliveredCount ?? 0} icon={CheckCircle} color="bg-green-500/10 text-green-400" />
        <StatCard label="Delayed" value={stats.delayedCount ?? 0} icon={AlertTriangle} color="bg-red-500/10 text-red-400" sub="Past expected date" />
        <StatCard label="Pending" value={stats.pendingCount ?? 0} icon={Clock} color="bg-amber-500/10 text-amber-400" />
        <StatCard label="Active Vehicles" value={stats.activeVehicles ?? 0} icon={Truck} color="bg-cyan-500/10 text-cyan-400" />
        <StatCard label="Available Vehicles" value={stats.availableVehicles ?? 0} icon={Truck} color="bg-emerald-500/10 text-emerald-400" />
        <StatCard label="Total Drivers" value={stats.availableDrivers ?? 0} icon={Users} color="bg-purple-500/10 text-purple-400" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily shipments area chart */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">Shipments — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats.dailyShipments || []}>
              <defs>
                <linearGradient id="colorShipments" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(v) => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#colorShipments)" strokeWidth={2} name="Shipments" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status donut */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">Status Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.statusDistribution || []} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} innerRadius={45}>
                {(stats.statusDistribution || []).map((entry: any, index: number) => (
                  <Cell key={index} fill={STATUS_COLORS[entry.status] || "#6366f1"} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(stats.statusDistribution || []).map((entry: any) => (
              <span key={entry.status} className="text-xs text-[var(--muted-foreground)] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[entry.status] || "#6366f1" }} />
                {entry.status.replace(/_/g, " ")} ({entry.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top routes bar chart */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold text-[var(--foreground)] mb-4">Top 5 Routes by Shipment Volume</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={stats.topRoutes || []} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
            <YAxis type="category" dataKey="route_name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={220} />
            <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "12px" }} />
            <Bar dataKey="shipment_count" fill="#06b6d4" radius={[0, 6, 6, 0]} name="Shipments" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent shipments table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--foreground)]">Recent Shipments</h3>
          <Link href="/shipments" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left pb-3 text-[var(--muted-foreground)] font-medium">Tracking ID</th>
                <th className="text-left pb-3 text-[var(--muted-foreground)] font-medium">Customer</th>
                <th className="text-left pb-3 text-[var(--muted-foreground)] font-medium">Route</th>
                <th className="text-left pb-3 text-[var(--muted-foreground)] font-medium">Status</th>
                <th className="text-left pb-3 text-[var(--muted-foreground)] font-medium">Expected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {(recentShipments || []).map((s: any) => (
                <tr key={s.shipment_id} className="hover:bg-[var(--secondary)]/50 transition-colors">
                  <td className="py-3">
                    <Link href={`/shipments/${s.shipment_id}`} className="font-mono text-xs text-indigo-400 hover:text-indigo-300">
                      {s.tracking_id}
                    </Link>
                  </td>
                  <td className="py-3 text-[var(--foreground)]">{s.customer_name}</td>
                  <td className="py-3 text-[var(--muted-foreground)] text-xs">
                    {s.origin_name} → {s.destination_name}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={s.current_status} isDelayed={Boolean(s.is_delayed)} size="sm" />
                  </td>
                  <td className="py-3 text-[var(--muted-foreground)] text-xs">
                    {s.expected_delivery ? format(new Date(s.expected_delivery), "dd MMM yyyy") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!recentShipments || recentShipments.length === 0) && (
            <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">No shipments yet</div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold text-[var(--foreground)] mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {(stats.recentActivityLogs || []).map((log: any, i: number) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-[var(--foreground)] font-medium">{log.action.replace(/_/g, " ")}</span>
                <span className="text-[var(--muted-foreground)]"> · {log.entity}</span>
                {log.trackingId && (
                  <span className="font-mono text-xs text-cyan-400 ml-1">#{log.trackingId}</span>
                )}
                <div className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  {log.createdAt ? format(new Date(log.createdAt), "dd MMM, HH:mm") : ""}
                </div>
              </div>
            </div>
          ))}
          {(!stats.recentActivityLogs || stats.recentActivityLogs.length === 0) && (
            <div className="text-center py-4 text-[var(--muted-foreground)] text-sm">No activity yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

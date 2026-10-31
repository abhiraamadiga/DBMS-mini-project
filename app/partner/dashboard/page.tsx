"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Shield,
  MapPin,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format } from "date-fns";

export default function PartnerDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["partner-dashboard-me"],
    queryFn: async () => {
      const res = await fetch("/api/me/dashboard");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load data");
      return json.data ?? null;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data || {};
  const recentDeliveries = stats.recentDeliveries || [];
  const assignedVehicles = stats.assignedVehicles || [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Delivery Partner Hub
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your assigned shipments, live dispatch routes, and vehicle status
          </p>
        </div>
        <Link
          href="/partner/deliveries"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs"
        >
          <Truck className="w-4 h-4" />
          <span>Active Deliveries</span>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.totalDeliveries ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Total Assigned Deliveries</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.activeCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Active In Transit / Out</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.deliveredCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Completed Deliveries</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.delayedCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Transit Delayed</div>
        </div>
      </div>

      {/* Assigned Vehicle Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="font-semibold text-sm text-slate-900 mb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-600" />
          My Assigned Fleet Vehicles ({assignedVehicles.length})
        </h3>
        {assignedVehicles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {assignedVehicles.map((v: any) => (
              <div
                key={v.vehicle_id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    {v.vehicle_number}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      v.status === "ON_TRIP"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                        : v.status === "AVAILABLE"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Type: <span className="font-medium text-slate-800">{v.type}</span> &middot; Capacity:{" "}
                  <span className="font-medium text-slate-800">{v.capacity_kg} kg</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No vehicle currently assigned by administration.
          </p>
        )}
      </div>

      {/* Recent deliveries */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-slate-900">
            Recent Assigned Shipments
          </h3>
          <Link
            href="/partner/deliveries"
            className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
          >
            View all deliveries <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="text-left pb-3">Tracking ID</th>
                <th className="text-left pb-3">Customer</th>
                <th className="text-left pb-3">Route</th>
                <th className="text-left pb-3">Current Location</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-left pb-3">Expected Date</th>
                <th className="text-right pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDeliveries.map((s: any) => (
                <tr key={s.shipment_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3">
                    <Link
                      href={`/partner/deliveries/${s.shipment_id}`}
                      className="font-mono text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      {s.tracking_id}
                    </Link>
                  </td>
                  <td className="py-3 text-slate-800 font-medium">{s.customer_name}</td>
                  <td className="py-3 text-slate-600">
                    {s.origin_name} &rarr; {s.destination_name}
                  </td>
                  <td className="py-3 text-slate-600">
                    {s.current_location || "Hub Origin"}
                  </td>
                  <td className="py-3">
                    <StatusBadge
                      status={s.current_status}
                      isDelayed={Boolean(s.is_delayed)}
                      size="sm"
                    />
                  </td>
                  <td className="py-3 text-slate-600 font-mono">
                    {s.expected_delivery
                      ? format(new Date(s.expected_delivery), "dd MMM yyyy")
                      : "—"}
                  </td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/partner/deliveries/${s.shipment_id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 px-2 py-1 rounded-md border border-amber-200"
                    >
                      Update
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentDeliveries.length === 0 && (
            <div className="text-center py-10 text-slate-500 space-y-2">
              <Truck className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">No deliveries currently assigned to your profile.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

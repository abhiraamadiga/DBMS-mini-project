"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Package,
  PlusCircle,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format } from "date-fns";

export default function CustomerDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["customer-dashboard-me"],
    queryFn: async () => {
      const res = await fetch("/api/me/dashboard");
      const json = await res.json();
      return json.data;
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
  const recentShipments = stats.recentShipments || [];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header with Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Customer Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your parcel shipments, live delivery progress, and dispatches
          </p>
        </div>
        <Link
          href="/customer/book"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Book New Shipment</span>
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.totalShipments ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Total Shipments Booked</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.inTransitCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Active In Transit</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.deliveredCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Delivered to Recipient</div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {stats.delayedCount ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium">Transit Delayed</div>
        </div>
      </div>

      {/* Recent shipments */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-slate-900">
            Recent Personal Shipments
          </h3>
          <Link
            href="/customer/shipments"
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
          >
            View all shipments <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-medium">
                <th className="text-left pb-3">Tracking ID</th>
                <th className="text-left pb-3">Route</th>
                <th className="text-left pb-3">Current Location</th>
                <th className="text-left pb-3">Status</th>
                <th className="text-left pb-3">Expected Delivery</th>
                <th className="text-right pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentShipments.map((s: any) => (
                <tr key={s.shipment_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3">
                    <Link
                      href={`/customer/shipments/${s.shipment_id}`}
                      className="font-mono text-indigo-600 hover:text-indigo-700 font-semibold"
                    >
                      {s.tracking_id}
                    </Link>
                  </td>
                  <td className="py-3 text-slate-600">
                    {s.origin_name} &rarr; {s.destination_name}
                  </td>
                  <td className="py-3 text-slate-600">
                    {s.current_location || "Processing"}
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
                      href={`/track/${s.tracking_id}`}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-indigo-600 font-medium"
                    >
                      <span>Public</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {recentShipments.length === 0 && (
            <div className="text-center py-10 text-slate-500 space-y-2">
              <Package className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs">You have not booked any shipments yet.</p>
              <Link
                href="/customer/book"
                className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
              >
                Book your first parcel now &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

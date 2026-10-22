"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, ChevronLeft, ChevronRight, Truck, MapPin, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function PartnerDeliveriesPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["partner-deliveries", q, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "15" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await fetch(`/api/shipments?${params}`);
      const json = await res.json();
      return { data: json.data || [], meta: json.meta || json.pagination || {} };
    },
  });

  const allShipments = data?.data || [];
  // Active deliveries (exclude DELIVERED and CANCELLED)
  const activeDeliveries = allShipments.filter(
    (s: any) => !["DELIVERED", "CANCELLED"].includes(s.current_status)
  );

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Assigned Active Deliveries
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your dispatch queue, update transit checkpoints, and complete drop-offs
          </p>
        </div>
        <Link
          href="/partner/history"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
        >
          Completed History &rarr;
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search tracking ID, recipient, route..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
        >
          <option value="">All Active Statuses</option>
          <option value="BOOKED">Booked (Pending Pickup)</option>
          <option value="PICKED_UP">Picked Up</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="AT_WAREHOUSE">At Warehouse</option>
          <option value="OUT_FOR_DELIVERY">Out For Delivery</option>
        </select>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-slate-100 animate-pulse"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        ) : activeDeliveries.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No active deliveries</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You are all caught up! No active shipments are awaiting delivery updates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  {["Tracking ID", "Customer", "Transit Route", "Current Checkpoint", "Status", "Expected Date", ""].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeDeliveries.map((s: any) => (
                  <tr
                    key={s.shipment_id}
                    onClick={() => router.push(`/partner/deliveries/${s.shipment_id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-amber-700">
                        {s.tracking_id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 font-medium">{s.customer_name}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      <span className="block font-medium text-slate-800">{s.origin_name}</span>
                      <span className="text-slate-400">&rarr; {s.destination_name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {s.current_location || "Origin Warehouse"}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge
                        status={s.current_status}
                        isDelayed={Boolean(s.is_delayed)}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">
                      {s.expected_delivery
                        ? format(new Date(s.expected_delivery), "dd MMM yyyy")
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                        Update Status &rarr;
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

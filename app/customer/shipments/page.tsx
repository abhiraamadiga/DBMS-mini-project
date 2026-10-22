"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, Plus, ChevronLeft, ChevronRight, Package, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

const STATUSES = [
  "BOOKED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_WAREHOUSE",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
];

export default function CustomerShipmentsListPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["customer-shipments-list", q, status, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await fetch(`/api/shipments?${params}`);
      const json = await res.json();
      return { data: json.data || [], meta: json.meta || json.pagination || {} };
    },
  });

  const shipments = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            My Shipments
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View status history and tracking milestones for your booked parcels
          </p>
        </div>
        <Link
          href="/customer/book"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" /> Book Shipment
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
            placeholder="Search by tracking ID, origin, destination..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
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
        ) : shipments.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No shipments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't booked any shipments matching this filter.
            </p>
            <Link
              href="/customer/book"
              className="inline-block text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
            >
              Book a new shipment &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  {["Tracking ID", "Transit Route", "Current Location", "Status", "Expected Delivery", ""].map(
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
                {shipments.map((s: any) => (
                  <tr
                    key={s.shipment_id}
                    onClick={() => router.push(`/customer/shipments/${s.shipment_id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {s.tracking_id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      <span className="font-medium text-slate-800 block">{s.origin_name}</span>
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
                      <span className="text-indigo-600 text-xs font-medium hover:underline">
                        Details &rarr;
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {(meta.page - 1) * meta.limit + 1}&ndash;
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-all flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white disabled:opacity-40 hover:bg-slate-50 transition-all flex items-center gap-1"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

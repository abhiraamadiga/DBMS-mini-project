"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Search, ChevronLeft, CheckCircle2, History } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

export default function PartnerHistoryPage() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["partner-history-shipments", q],
    queryFn: async () => {
      const params = new URLSearchParams({ status: "DELIVERED", limit: "50" });
      if (q) params.set("q", q);
      const res = await fetch(`/api/shipments?${params}`);
      const json = await res.json();
      return json.data || [];
    },
  });

  const completed = data || [];

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/deliveries"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Delivery History
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Archive of all parcels successfully delivered to recipients
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by tracking ID, customer, route..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 shadow-2xs"
          />
        </div>
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
        ) : completed.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <History className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No completed deliveries</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Completed deliveries with status DELIVERED will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  {["Tracking ID", "Customer", "Transit Route", "Delivered Location", "Status", "Expected Date", ""].map(
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
                {completed.map((s: any) => (
                  <tr
                    key={s.shipment_id}
                    onClick={() => router.push(`/partner/deliveries/${s.shipment_id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-emerald-700">
                        {s.tracking_id}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 font-medium">{s.customer_name}</td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      <span className="block font-medium text-slate-800">{s.origin_name}</span>
                      <span className="text-slate-400">&rarr; {s.destination_name}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {s.current_location || "Destination Doorstep"}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.current_status} isDelayed={false} size="sm" />
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
    </div>
  );
}

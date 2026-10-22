"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, Plus, ChevronLeft, ChevronRight, AlertTriangle, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STATUSES = ["BOOKED","PICKED_UP","IN_TRANSIT","AT_WAREHOUSE","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];

type TabType = "all" | "delayed" | "pending";

export default function ShipmentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabType>("all");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["shipments", tab, q, status, page],
    queryFn: async () => {
      if (tab === "delayed") {
        const res = await fetch("/api/shipments/delayed");
        const json = await res.json();
        return { data: json.data, meta: { total: json.meta?.total || json.data?.length || 0, page: 1, limit: 999, totalPages: 1 } };
      }
      if (tab === "pending") {
        const res = await fetch("/api/shipments/pending");
        const json = await res.json();
        return { data: json.data, meta: { total: json.meta?.total || json.data?.length || 0, page: 1, limit: 999, totalPages: 1 } };
      }
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await fetch(`/api/shipments?${params}`);
      const json = await res.json();
      return { data: json.data, meta: json.meta || json.pagination };
    },
  });

  const shipments = data?.data || [];
  const meta = data?.meta || {};

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Shipments</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Manage and track all shipments</p>
        </div>
        <Link href="/admin/shipments/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-all shadow-xs">
          <Plus className="w-4 h-4" /> New Shipment
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["all","All",null],["delayed","Delayed",<AlertTriangle className="w-3.5 h-3.5"/>],["pending","Pending",<Clock className="w-3.5 h-3.5"/>]] as any[]).map(([t, label, icon]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border",
              tab === t ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs" : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
            )}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab === "all" && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search tracking ID, customer..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-100 animate-pulse" style={{ opacity: 1 - i * 0.15 }} />)}
          </div>
        ) : shipments.length === 0 ? (
          <EmptyState title="No shipments found" description="Try adjusting your search or filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  {["Tracking ID","Customer","Origin → Dest","Status","Expected Delivery",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shipments.map((s: any) => (
                  <tr key={s.shipment_id} onClick={() => router.push(`/admin/shipments/${s.shipment_id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs font-semibold text-indigo-600">{s.tracking_id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-900 font-medium">{s.customer_name}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">
                      <span className="block font-medium text-slate-700">{s.origin_name}</span>
                      <span className="text-slate-400">→ {s.destination_name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.current_status} isDelayed={Boolean(s.is_delayed)} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-xs">
                      {s.expected_delivery ? format(new Date(s.expected_delivery), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-indigo-600 text-xs font-medium hover:underline">View →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {tab === "all" && meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--muted-foreground)]">
            Showing {((meta.page - 1) * meta.limit) + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--secondary)] transition-all flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] disabled:opacity-40 hover:bg-[var(--secondary)] transition-all flex items-center gap-1">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { apiFetch } from "@/lib/client-api";
import type { Shipment } from "@/lib/types";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { Search, Plus, ChevronLeft, ChevronRight, AlertTriangle, Clock } from "lucide-react";
import { format, parseISO } from "date-fns";
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

  const { data, isLoading } = useQuery({ throwOnError: true,
    queryKey: ["shipments", tab, q, status, page],
    queryFn: async () => {
      if (tab === "delayed") {
        const res = await apiFetch<Shipment[]>("/api/shipments/delayed");
        const json = await res.json();
        return { data: json.data, meta: { total: json.meta?.total || json.data?.length || 0, page: 1, limit: 999, totalPages: 1 } };
      }
      if (tab === "pending") {
        const res = await apiFetch<Shipment[]>("/api/shipments/pending");
        const json = await res.json();
        return { data: json.data, meta: { total: json.meta?.total || json.data?.length || 0, page: 1, limit: 999, totalPages: 1 } };
      }
      const params = new URLSearchParams({ page: String(page), limit: "10" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const res = await apiFetch<Shipment[]>(`/api/shipments?${params}`);
      const json = await res.json();
      return { data: json.data, meta: json.meta };
    },
  });

  const shipments = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 10, total: 0, totalPages: 0 };

  return (
    <div className="space-y-5 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">Shipments</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-0.5">Manage and track all shipments</p>
        </div>
        <Link href="/shipments/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20">
          <Plus className="w-4 h-4" /> New Shipment
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {([["all","All",null],["delayed","Delayed",<AlertTriangle key="delayed" className="w-3.5 h-3.5"/>],["pending","Pending",<Clock key="pending" className="w-3.5 h-3.5"/>]] as [TabType, string, React.ReactNode][]).map(([t, label, icon]) => (
          <button key={t} onClick={() => { setTab(t); setPage(1); }}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border",
              tab === t ? "bg-indigo-600/15 text-indigo-400 border-indigo-500/25" : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            )}>
            {icon} {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {tab === "all" && (
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }}
              placeholder="Search tracking ID, customer..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
          </div>
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
          </select>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-[var(--secondary)] animate-pulse" style={{ opacity: 1 - i * 0.15 }} />)}
          </div>
        ) : shipments.length === 0 ? (
          <EmptyState title="No shipments found" description="Try adjusting your search or filters" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--secondary)]/40">
                <tr>
                  {["Tracking ID","Customer","Origin → Dest","Status","Expected Delivery",""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[var(--muted-foreground)] font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {shipments.map((s) => (
                  <tr key={s.shipment_id} onClick={() => router.push(`/shipments/${s.shipment_id}`)}
                    className="hover:bg-[var(--secondary)]/40 cursor-pointer transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-indigo-400">{s.tracking_id}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[var(--foreground)] font-medium">{s.customer_name}</td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)] text-xs">
                      <span className="block">{s.origin_name}</span>
                      <span className="text-[var(--muted-foreground)]/60">→ {s.destination_name}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={s.current_status} isDelayed={Boolean(s.is_delayed)} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-[var(--muted-foreground)] text-xs">
                      {s.expected_delivery ? format(parseISO(s.expected_delivery), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-indigo-400 text-xs hover:underline">View →</span>
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

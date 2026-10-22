"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { format } from "date-fns";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CustomerDetailPage() {
  const params = useParams();

  const { data: customer, isLoading: custLoading } = useQuery({
    queryKey: ["customer", params.id],
    queryFn: async () => { const r = await fetch(`/api/customers/${params.id}`); const j = await r.json(); return j.data; },
  });

  const { data: shipments, isLoading: shipsLoading } = useQuery({
    queryKey: ["customer-shipments", params.id],
    queryFn: async () => { const r = await fetch(`/api/customers/${params.id}/shipments`); const j = await r.json(); return j.data; },
  });

  if (custLoading) return <div className="h-32 rounded-2xl bg-[var(--secondary)] animate-pulse" />;
  if (!customer) return <div className="py-20 text-center text-[var(--muted-foreground)]">Customer not found</div>;

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/customers" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><ChevronLeft className="w-5 h-5" /></Link>
        <div>
          <h2 className="text-2xl font-bold">{customer.name}</h2>
          <p className="text-sm text-[var(--muted-foreground)]">{customer.email} · {customer.phone}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 grid grid-cols-2 gap-4 text-sm">
        <div><p className="text-xs text-[var(--muted-foreground)] mb-1">Email</p><p>{customer.email}</p></div>
        <div><p className="text-xs text-[var(--muted-foreground)] mb-1">Phone</p><p>{customer.phone}</p></div>
        <div className="col-span-2"><p className="text-xs text-[var(--muted-foreground)] mb-1">Address</p><p>{customer.address}</p></div>
        <div><p className="text-xs text-[var(--muted-foreground)] mb-1">Member Since</p><p>{customer.created_at ? format(new Date(customer.created_at), "dd MMM yyyy") : "—"}</p></div>
        <div><p className="text-xs text-[var(--muted-foreground)] mb-1">Total Shipments</p><p className="font-bold text-indigo-400">{customer.total_shipments || 0}</p></div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
        <h3 className="font-semibold mb-4">Shipment History</h3>
        {shipsLoading ? <div className="h-32 animate-pulse bg-[var(--secondary)] rounded-xl" /> :
          !shipments || shipments.length === 0 ? <EmptyState title="No shipments yet" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)]">
                  <tr>{["Tracking ID","Route","Status","Booking Date","Expected"].map(h => <th key={h} className="text-left pb-3 text-xs text-[var(--muted-foreground)] font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {shipments.map((s: any) => (
                    <tr key={s.shipment_id} className="hover:bg-[var(--secondary)]/40">
                      <td className="py-3"><Link href={`/shipments/${s.shipment_id}`} className="font-mono text-xs text-indigo-400 hover:text-indigo-300">{s.tracking_id}</Link></td>
                      <td className="py-3 text-xs text-[var(--muted-foreground)]">{s.origin_name} → {s.destination_name}</td>
                      <td className="py-3"><StatusBadge status={s.current_status} isDelayed={Boolean(s.is_delayed)} size="sm" /></td>
                      <td className="py-3 text-xs text-[var(--muted-foreground)]">{s.booking_date ? format(new Date(s.booking_date), "dd MMM yyyy") : "—"}</td>
                      <td className="py-3 text-xs text-[var(--muted-foreground)]">{s.expected_delivery ? format(new Date(s.expected_delivery), "dd MMM yyyy") : "—"}</td>
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

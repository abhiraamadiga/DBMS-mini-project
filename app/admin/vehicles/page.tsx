"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, X, Truck } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

function VehicleDialog({ vehicle, onClose }: { vehicle?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ vehicle_number: vehicle?.vehicle_number || "", type: vehicle?.type || "VAN", status: vehicle?.status || "AVAILABLE" });

  const mutation = useMutation({
    mutationFn: async () => {
      const url = vehicle ? `/api/vehicles/${vehicle.vehicle_id}` : "/api/vehicles";
      const res = await fetch(url, { method: vehicle ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed");
      return json;
    },
    onSuccess: () => { toast.success(vehicle ? "Vehicle updated" : "Vehicle created"); qc.invalidateQueries({ queryKey: ["vehicles"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{vehicle ? "Edit Vehicle" : "New Vehicle"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--muted-foreground)]" /></button>
        </div>
        <div><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Vehicle Number</label><input value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))} placeholder="TN-09-AB-1234" className={inputClass} /></div>
        <div><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Type</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputClass}>
            {["BIKE","VAN","TRUCK","CONTAINER"].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inputClass}>
            {["AVAILABLE","ON_TRIP","MAINTENANCE"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all">{mutation.isPending ? "Saving..." : vehicle ? "Save Changes" : "Create"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--secondary)] transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function VehicleShipmentsDrawer({ vehicleId, vehicleNumber, onClose }: { vehicleId: number; vehicleNumber: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["vehicle-shipments", vehicleId],
    queryFn: async () => { const r = await fetch(`/api/vehicles/${vehicleId}/shipments`); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed to load data"); return j.data ?? []; },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] h-full overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Shipments — <span className="font-mono text-indigo-400">{vehicleNumber}</span></h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--muted-foreground)]" /></button>
        </div>
        {!data || data.length === 0 ? <EmptyState title="No shipments assigned" /> : (
          <div className="space-y-3">
            {data.map((s: any) => (
              <Link key={s.shipment_id} href={`/admin/shipments/${s.shipment_id}`} onClick={onClose} className="block p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-indigo-500/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-indigo-400">{s.tracking_id}</span>
                  <StatusBadge status={s.current_status} isDelayed={Boolean(s.is_delayed)} size="sm" />
                </div>
                <p className="text-sm text-[var(--foreground)] mt-1">{s.customer_name}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{s.origin_name} → {s.destination_name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = { AVAILABLE: "text-green-600 bg-green-500/10 border-green-500/20", ON_TRIP: "text-blue-600 bg-blue-500/10 border-blue-500/20", MAINTENANCE: "text-red-600 bg-red-500/10 border-red-500/20" };

export default function VehiclesPage() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | "new" | any>(null);
  const [drawer, setDrawer] = useState<null | any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => { const r = await fetch("/api/vehicles"); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed to load data"); return j.data ?? []; },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const r = await fetch(`/api/vehicles/${id}`, { method: "DELETE" }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed"); return j; },
    onSuccess: () => { toast.success("Vehicle deleted"); qc.invalidateQueries({ queryKey: ["vehicles"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const vehicles = data || [];

  return (
    <div className="space-y-5 max-w-6xl">
      {dialog && <VehicleDialog vehicle={dialog === "new" ? undefined : dialog} onClose={() => setDialog(null)} />}
      {drawer && <VehicleShipmentsDrawer vehicleId={drawer.vehicle_id} vehicleNumber={drawer.vehicle_number} onClose={() => setDrawer(null)} />}
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Vehicles</h2><p className="text-sm text-[var(--muted-foreground)]">Fleet management</p></div>
        <button onClick={() => setDialog("new")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"><Plus className="w-4 h-4" /> New Vehicle</button>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {isLoading ? <div className="h-64 animate-pulse bg-[var(--secondary)]" /> :
          vehicles.length === 0 ? <EmptyState title="No vehicles" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--secondary)]/40">
                  <tr>{["Vehicle","Type","Status","Drivers","Active Shipments","Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {vehicles.map((v: any) => (
                    <tr key={v.vehicle_id} className="hover:bg-[var(--secondary)]/40">
                      <td className="px-4 py-3 font-mono text-xs text-indigo-400">{v.vehicle_number}</td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1.5"><Truck className="w-4 h-4 text-indigo-500" /> {v.type}</span></td>
                      <td className="px-4 py-3"><span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[v.status] || ""}`}>{v.status}</span></td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs">{v.driver_names || "—"}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20">{v.active_shipments || 0}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setDrawer(v)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all" title="View shipments"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => setDialog(v)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { if (confirm("Delete vehicle?")) deleteMutation.mutate(v.vehicle_id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
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

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, X } from "lucide-react";
import Link from "next/link";

function DriverDialog({ driver, vehicles, onClose }: { driver?: any; vehicles: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const existingVehicleIds = driver?.vehicle_ids ? driver.vehicle_ids.split(",").map(Number) : [];
  const [form, setForm] = useState({ name: driver?.name || "", phone: driver?.phone || "", license_number: driver?.license_number || "", vehicle_ids: existingVehicleIds });

  const mutation = useMutation({
    mutationFn: async () => {
      const url = driver ? `/api/drivers/${driver.driver_id}` : "/api/drivers";
      const res = await fetch(url, { method: driver ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed");
      return json;
    },
    onSuccess: () => { toast.success(driver ? "Driver updated" : "Driver created"); qc.invalidateQueries({ queryKey: ["drivers"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50";
  const toggleVehicle = (id: number) => setForm(f => ({ ...f, vehicle_ids: f.vehicle_ids.includes(id) ? f.vehicle_ids.filter((v: number) => v !== id) : [...f.vehicle_ids, id] }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{driver ? "Edit Driver" : "New Driver"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--muted-foreground)]" /></button>
        </div>
        {[["name","Name","Rajesh Kumar"],["phone","Phone","+91 98401 23456"],["license_number","License Number","TN0920190012345"]].map(([f, l, p]) => (
          <div key={f}><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">{l}</label><input value={(form as any)[f]} onChange={e => setForm(fm => ({ ...fm, [f]: e.target.value }))} placeholder={p} className={inputClass} /></div>
        ))}
        <div>
          <label className="text-xs text-[var(--muted-foreground)] block mb-2">Assign Vehicles</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {vehicles.map((v: any) => (
              <label key={v.vehicle_id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--secondary)] cursor-pointer text-sm">
                <input type="checkbox" checked={form.vehicle_ids.includes(v.vehicle_id)} onChange={() => toggleVehicle(v.vehicle_id)} className="accent-indigo-600" />
                <span className="font-mono text-xs">{v.vehicle_number}</span> <span className="text-[var(--muted-foreground)]">({v.type})</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all">{mutation.isPending ? "Saving..." : driver ? "Save Changes" : "Create"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--secondary)] transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DriverShipmentsDrawer({ driverId, driverName, onClose }: { driverId: number; driverName: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["driver-shipments", driverId],
    queryFn: async () => { const r = await fetch(`/api/drivers/${driverId}/shipments`); const j = await r.json(); return j.data; },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] h-full overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Shipments — {driverName}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--muted-foreground)]" /></button>
        </div>
        {!data || data.length === 0 ? <EmptyState title="No shipments assigned" /> : (
          <div className="space-y-3">
            {data.map((s: any) => (
              <Link key={s.shipment_id} href={`/shipments/${s.shipment_id}`} onClick={onClose} className="block p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-indigo-500/30 transition-all">
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

export default function DriversPage() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | "new" | any>(null);
  const [drawer, setDrawer] = useState<null | any>(null);

  const { data, isLoading } = useQuery({ queryKey: ["drivers"], queryFn: async () => { const r = await fetch("/api/drivers"); const j = await r.json(); return j.data; } });
  const { data: vehicles } = useQuery({ queryKey: ["vehicles-all"], queryFn: async () => { const r = await fetch("/api/vehicles"); const j = await r.json(); return j.data; } });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const r = await fetch(`/api/drivers/${id}`, { method: "DELETE" }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed"); return j; },
    onSuccess: () => { toast.success("Driver deleted"); qc.invalidateQueries({ queryKey: ["drivers"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const drivers = data || [];

  return (
    <div className="space-y-5 max-w-6xl">
      {dialog && <DriverDialog driver={dialog === "new" ? undefined : dialog} vehicles={vehicles || []} onClose={() => setDialog(null)} />}
      {drawer && <DriverShipmentsDrawer driverId={drawer.driver_id} driverName={drawer.name} onClose={() => setDrawer(null)} />}
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Drivers</h2><p className="text-sm text-[var(--muted-foreground)]">Driver management</p></div>
        <button onClick={() => setDialog("new")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"><Plus className="w-4 h-4" /> New Driver</button>
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {isLoading ? <div className="h-64 animate-pulse bg-[var(--secondary)]" /> :
          drivers.length === 0 ? <EmptyState title="No drivers" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--secondary)]/40">
                  <tr>{["Name","Phone","License","Vehicles","Active Shipments","Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {drivers.map((d: any) => (
                    <tr key={d.driver_id} className="hover:bg-[var(--secondary)]/40">
                      <td className="px-4 py-3 font-medium">{d.name}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{d.phone}</td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{d.license_number}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs font-mono">{d.assigned_vehicles || "—"}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20">{d.active_shipments || 0}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => setDrawer(d)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all" title="View shipments"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => setDialog(d)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { if (confirm("Delete driver?")) deleteMutation.mutate(d.driver_id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
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

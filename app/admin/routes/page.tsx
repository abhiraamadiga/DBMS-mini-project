"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, X, Route, ArrowRight, Navigation, Clock } from "lucide-react";
import Link from "next/link";

function RouteDialog({ route, warehouses, onClose }: { route?: any; warehouses: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    origin_warehouse_id: route?.origin_warehouse_id || "",
    destination_warehouse_id: route?.destination_warehouse_id || "",
    distance_km: route?.distance_km || "",
    est_time_hrs: route?.est_time_hrs || "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const url = route ? `/api/routes/${route.route_id}` : "/api/routes";
      const body = { ...form, distance_km: parseFloat(String(form.distance_km)), est_time_hrs: parseFloat(String(form.est_time_hrs)), origin_warehouse_id: parseInt(String(form.origin_warehouse_id)), destination_warehouse_id: parseInt(String(form.destination_warehouse_id)) };
      const res = await fetch(url, { method: route ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed");
      return json;
    },
    onSuccess: () => { toast.success(route ? "Route updated" : "Route created"); qc.invalidateQueries({ queryKey: ["routes"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{route ? "Edit Route" : "New Route"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--muted-foreground)]" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Origin Warehouse</label>
            <select value={form.origin_warehouse_id} onChange={e => setForm(f => ({ ...f, origin_warehouse_id: e.target.value }))} className={inputClass}>
              <option value="">Select</option>
              {warehouses.map((w: any) => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Destination Warehouse</label>
            <select value={form.destination_warehouse_id} onChange={e => setForm(f => ({ ...f, destination_warehouse_id: e.target.value }))} className={inputClass}>
              <option value="">Select</option>
              {warehouses.map((w: any) => <option key={w.warehouse_id} value={w.warehouse_id}>{w.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Distance (km)</label><input type="number" value={form.distance_km} onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))} placeholder="450" className={inputClass} /></div>
          <div><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Est. Time (hrs)</label><input type="number" value={form.est_time_hrs} onChange={e => setForm(f => ({ ...f, est_time_hrs: e.target.value }))} placeholder="8.5" step="0.5" className={inputClass} /></div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all">{mutation.isPending ? "Saving..." : route ? "Save Changes" : "Create"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--secondary)] transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function RouteShipmentsDrawer({ routeId, routeName, onClose }: { routeId: number; routeName: string; onClose: () => void }) {
  const { data } = useQuery({
    queryKey: ["route-shipments", routeId],
    queryFn: async () => { const r = await fetch(`/api/routes/${routeId}/shipments`); const j = await r.json(); return j.data; },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] h-full overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Shipments — <span className="text-indigo-400">{routeName}</span></h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--muted-foreground)]" /></button>
        </div>
        {!data || data.length === 0 ? <EmptyState title="No shipments on this route" /> : (
          <div className="space-y-3">
            {data.map((s: any) => (
              <Link key={s.shipment_id} href={`/admin/shipments/${s.shipment_id}`} onClick={onClose} className="block p-4 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:border-indigo-500/30 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs text-indigo-400">{s.tracking_id}</span>
                  <StatusBadge status={s.current_status} isDelayed={Boolean(s.is_delayed)} size="sm" />
                </div>
                <p className="text-sm text-[var(--foreground)] mt-1">{s.customer_name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RoutesPage() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | "new" | any>(null);
  const [drawer, setDrawer] = useState<null | any>(null);

  const { data, isLoading } = useQuery({ queryKey: ["routes"], queryFn: async () => { const r = await fetch("/api/routes"); const j = await r.json(); return j.data; } });
  const { data: warehouses } = useQuery({ queryKey: ["warehouses-all"], queryFn: async () => { const r = await fetch("/api/warehouses"); const j = await r.json(); return j.data; } });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const r = await fetch(`/api/routes/${id}`, { method: "DELETE" }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed"); return j; },
    onSuccess: () => { toast.success("Route deleted"); qc.invalidateQueries({ queryKey: ["routes"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const routes = data || [];

  return (
    <div className="space-y-5 max-w-6xl">
      {dialog && <RouteDialog route={dialog === "new" ? undefined : dialog} warehouses={warehouses || []} onClose={() => setDialog(null)} />}
      {drawer && <RouteShipmentsDrawer routeId={drawer.route_id} routeName={`${drawer.origin_name} → ${drawer.destination_name}`} onClose={() => setDrawer(null)} />}
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Routes</h2><p className="text-sm text-[var(--muted-foreground)]">Logistics routes between warehouses</p></div>
        <button onClick={() => setDialog("new")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"><Plus className="w-4 h-4" /> New Route</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? [...Array(6)].map((_, i) => <div key={i} className="h-36 rounded-2xl bg-[var(--secondary)] animate-pulse" />) :
          routes.length === 0 ? <div className="col-span-3"><EmptyState title="No routes" /></div> :
          routes.map((r: any) => (
            <div key={r.route_id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-3 hover:border-indigo-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center"><Route className="w-4.5 h-4.5" /></div>
                <div className="flex gap-1.5">
                  <button onClick={() => setDrawer(r)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] transition-all" title="View shipments"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => setDialog(r)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] transition-all"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => { if (confirm("Delete route?")) deleteMutation.mutate(r.route_id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-[var(--foreground)]">{r.origin_name}</span>
                  <ArrowRight className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />
                  <span className="font-medium text-[var(--foreground)]">{r.destination_name}</span>
                </div>
                <div className="flex items-center gap-3 mt-2 text-xs text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-indigo-500" /> {r.distance_km} km</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> ~{r.est_time_hrs}h</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{r.shipment_count || 0} shipments</span>
                </div>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, X, MapPin } from "lucide-react";

function WarehouseDialog({ warehouse, onClose }: { warehouse?: any; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: warehouse?.name || "", location: warehouse?.location || "", capacity: warehouse?.capacity || "" });

  const mutation = useMutation({
    mutationFn: async () => {
      const url = warehouse ? `/api/warehouses/${warehouse.warehouse_id}` : "/api/warehouses";
      const body = { ...form, capacity: parseInt(String(form.capacity)) };
      const res = await fetch(url, { method: warehouse ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed");
      return json;
    },
    onSuccess: () => { toast.success(warehouse ? "Warehouse updated" : "Warehouse created"); qc.invalidateQueries({ queryKey: ["warehouses"] }); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{warehouse ? "Edit Warehouse" : "New Warehouse"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--muted-foreground)]" /></button>
        </div>
        <div><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Name</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Chennai Central Hub" className={inputClass} /></div>
        <div><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Location</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Chennai, Tamil Nadu" className={inputClass} /></div>
        <div><label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Capacity (units)</label><input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="10000" className={inputClass} /></div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all">{mutation.isPending ? "Saving..." : warehouse ? "Save Changes" : "Create"}</button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--secondary)] transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function WarehousesPage() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | "new" | any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => { const r = await fetch("/api/warehouses"); const j = await r.json(); return j.data; },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { const r = await fetch(`/api/warehouses/${id}`, { method: "DELETE" }); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed"); return j; },
    onSuccess: () => { toast.success("Warehouse deleted"); qc.invalidateQueries({ queryKey: ["warehouses"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const warehouses = data || [];

  return (
    <div className="space-y-5 max-w-6xl">
      {dialog && <WarehouseDialog warehouse={dialog === "new" ? undefined : dialog} onClose={() => setDialog(null)} />}
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Warehouses</h2><p className="text-sm text-[var(--muted-foreground)]">Hub and depot management</p></div>
        <button onClick={() => setDialog("new")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"><Plus className="w-4 h-4" /> New Warehouse</button>
      </div>
      {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-[var(--secondary)] animate-pulse" />)}</div> :
        warehouses.length === 0 ? <EmptyState title="No warehouses" /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((w: any) => {
              const utilization = Math.min(100, Math.round(((w.active_shipments_origin || 0) + (w.active_shipments_destination || 0)) / w.capacity * 100 * 10));
              return (
                <div key={w.warehouse_id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
                    <div className="flex gap-1.5">
                      <button onClick={() => setDialog(w)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] transition-all"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { if (confirm("Delete warehouse?")) deleteMutation.mutate(w.warehouse_id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{w.name}</h3>
                    <p className="text-sm text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {w.location}</p>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-[var(--muted-foreground)] mb-1.5">
                      <span>Capacity</span>
                      <span>{w.capacity.toLocaleString()} units</span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--secondary)] overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500" style={{ width: `${utilization}%` }} />
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {(w.active_shipments_origin || 0) + (w.active_shipments_destination || 0)} active shipments
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

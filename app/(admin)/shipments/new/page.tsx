"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Minus, ChevronLeft, Copy, Check, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function NewShipmentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customerId: "", routeId: "", expectedDelivery: "", vehicleId: "", driverId: "",
  });
  const [packages, setPackages] = useState([{ weight: "", fragile: false, dimensions: "30x20x15" }]);
  const [createdShipment, setCreatedShipment] = useState<{ shipment_id: number; tracking_id: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: customers } = useQuery({ queryKey: ["customers-all"], queryFn: async () => { const r = await fetch("/api/customers?limit=100"); const j = await r.json(); return j.data; } });
  const { data: routes } = useQuery({ queryKey: ["routes-all"], queryFn: async () => { const r = await fetch("/api/routes"); const j = await r.json(); return j.data; } });
  const { data: vehicles } = useQuery({ queryKey: ["vehicles-all"], queryFn: async () => { const r = await fetch("/api/vehicles"); const j = await r.json(); return j.data; } });
  const { data: drivers } = useQuery({ queryKey: ["drivers-all"], queryFn: async () => { const r = await fetch("/api/drivers"); const j = await r.json(); return j.data; } });

  const selectedRoute = routes?.find((r: any) => String(r.route_id) === form.routeId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        customerId: parseInt(form.customerId),
        routeId: parseInt(form.routeId),
        expectedDelivery: form.expectedDelivery,
        vehicleId: form.vehicleId ? parseInt(form.vehicleId) : null,
        driverId: form.driverId ? parseInt(form.driverId) : null,
        packages: packages.map(p => ({ weight: parseFloat(p.weight), fragile: p.fragile, dimensions: p.dimensions })),
      };
      const res = await fetch("/api/shipments", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create shipment");
      return json.data;
    },
    onSuccess: (data) => {
      toast.success(`Shipment created! Tracking ID: ${data.tracking_id}`);
      qc.invalidateQueries({ queryKey: ["shipments"] });
      setCreatedShipment(data);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addPkg = () => setPackages(p => [...p, { weight: "", fragile: false, dimensions: "30x20x15" }]);
  const removePkg = (i: number) => setPackages(p => p.filter((_, idx) => idx !== i));
  const updatePkg = (i: number, field: string, val: any) => setPackages(p => p.map((pkg, idx) => idx === i ? { ...pkg, [field]: val } : pkg));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.customerId) newErrors.customerId = "Customer is required";
    if (!form.routeId) newErrors.routeId = "Route is required";
    if (!form.expectedDelivery) newErrors.expectedDelivery = "Expected delivery is required";
    if (packages.some(p => !p.weight || isNaN(parseFloat(p.weight)) || parseFloat(p.weight) <= 0)) newErrors.packages = "All packages need valid weight";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) createMutation.mutate();
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-[var(--muted-foreground)]";

  const handleCopy = () => {
    if (!createdShipment) return;
    navigator.clipboard.writeText(createdShipment.tracking_id);
    setCopied(true);
    toast.success("Tracking ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdShipment) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <div className="rounded-2xl border border-emerald-500/30 bg-[var(--card)] p-8 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Shipment Booked Successfully!</h2>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Your shipment is registered and initial tracking event has been recorded.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--secondary)] border border-[var(--border)] max-w-md mx-auto">
            <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider font-semibold mb-1">Tracking ID</p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-xl font-bold text-indigo-400 tracking-wider">
                {createdShipment.tracking_id}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--foreground)] transition-colors"
                title="Copy Tracking ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href={`/shipments/${createdShipment.shipment_id}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20"
            >
              View Shipment Details →
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedShipment(null);
                setForm({ customerId: "", routeId: "", expectedDelivery: "", vehicleId: "", driverId: "" });
                setPackages([{ weight: "", fragile: false, dimensions: "30x20x15" }]);
              }}
              className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--secondary)] transition-all"
            >
              Book Another Shipment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/shipments" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"><ChevronLeft className="w-5 h-5" /></Link>
        <div>
          <h2 className="text-2xl font-bold text-[var(--foreground)]">New Shipment</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Book a new shipment with packages</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer & Route */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
          <h3 className="font-semibold text-[var(--foreground)]">Shipment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Customer *</label>
              <select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))} className={inputClass}>
                <option value="">Select customer</option>
                {(customers || []).map((c: any) => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
              </select>
              {errors.customerId && <p className="text-xs text-red-400 mt-1">{errors.customerId}</p>}
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Expected Delivery *</label>
              <input type="date" value={form.expectedDelivery} onChange={e => setForm(f => ({ ...f, expectedDelivery: e.target.value }))}
                min={new Date().toISOString().slice(0, 10)} className={inputClass} />
              {errors.expectedDelivery && <p className="text-xs text-red-400 mt-1">{errors.expectedDelivery}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Route *</label>
            <select value={form.routeId} onChange={e => setForm(f => ({ ...f, routeId: e.target.value }))} className={inputClass}>
              <option value="">Select route</option>
              {(routes || []).map((r: any) => <option key={r.route_id} value={r.route_id}>{r.origin_name} → {r.destination_name} ({r.distance_km} km, ~{r.est_time_hrs}h)</option>)}
            </select>
            {errors.routeId && <p className="text-xs text-red-400 mt-1">{errors.routeId}</p>}
            {selectedRoute && (
              <div className="mt-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-indigo-300">
                📦 {selectedRoute.origin_name} → {selectedRoute.destination_name} · {selectedRoute.distance_km} km · est. {selectedRoute.est_time_hrs}h
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Vehicle (optional)</label>
              <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} className={inputClass}>
                <option value="">Assign later</option>
                {(vehicles || []).filter((v: any) => v.status !== "MAINTENANCE").map((v: any) => <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_number} ({v.type}) — {v.status}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">Driver (optional)</label>
              <select value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))} className={inputClass}>
                <option value="">Assign later</option>
                {(drivers || []).map((d: any) => <option key={d.driver_id} value={d.driver_id}>{d.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[var(--foreground)]">Packages</h3>
            <button type="button" onClick={addPkg} className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300">
              <Plus className="w-4 h-4" /> Add Package
            </button>
          </div>
          {errors.packages && <p className="text-xs text-red-400">{errors.packages}</p>}
          {packages.map((pkg, i) => (
            <div key={i} className="p-4 rounded-xl bg-[var(--secondary)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">Package {i + 1}</span>
                {packages.length > 1 && <button type="button" onClick={() => removePkg(i)} className="text-red-400 hover:text-red-300"><Minus className="w-4 h-4" /></button>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Weight (kg) *</label>
                  <input type="number" step="0.01" min="0.01" value={pkg.weight} onChange={e => updatePkg(i, "weight", e.target.value)}
                    placeholder="5.0" className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-[var(--muted-foreground)] block mb-1">Dimensions (LxWxH cm)</label>
                  <input value={pkg.dimensions} onChange={e => updatePkg(i, "dimensions", e.target.value)}
                    placeholder="30x20x15" className={inputClass} />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-[var(--foreground)]">
                    <input type="checkbox" checked={pkg.fragile} onChange={e => updatePkg(i, "fragile", e.target.checked)}
                      className="w-4 h-4 accent-indigo-600" />
                    Fragile
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button type="submit" disabled={createMutation.isPending}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
          {createMutation.isPending ? "Creating Shipment..." : "Create Shipment"}
        </button>
      </form>
    </div>
  );
}

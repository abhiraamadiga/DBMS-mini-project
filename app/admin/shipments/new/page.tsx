"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Minus,
  ChevronLeft,
  Copy,
  Check,
  CheckCircle2,
  Package,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function NewShipmentPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    customerId: "",
    routeId: "",
    expectedDelivery: "",
    vehicleId: "",
    driverId: "",
  });
  const [packages, setPackages] = useState([
    { weight: "", fragile: false, dimensions: "30x20x15" },
  ]);
  const [createdShipment, setCreatedShipment] = useState<{
    shipment_id: number;
    tracking_id: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: customers } = useQuery({
    queryKey: ["customers-all"],
    queryFn: async () => {
      const r = await fetch("/api/customers?limit=100"); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed to load data"); return j.data ?? [];
    },
  });
  const { data: routes } = useQuery({
    queryKey: ["routes-all"],
    queryFn: async () => {
      const r = await fetch("/api/routes"); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed to load data"); return j.data ?? [];
    },
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-all"],
    queryFn: async () => {
      const r = await fetch("/api/vehicles"); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed to load data"); return j.data ?? [];
    },
  });
  const { data: drivers } = useQuery({
    queryKey: ["drivers-all"],
    queryFn: async () => {
      const r = await fetch("/api/drivers"); const j = await r.json(); if (!r.ok) throw new Error(j.error?.message || "Failed to load data"); return j.data ?? [];
    },
  });

  const selectedRoute = routes?.find((r: any) => String(r.route_id) === form.routeId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        customerId: parseInt(form.customerId),
        routeId: parseInt(form.routeId),
        expectedDelivery: form.expectedDelivery,
        vehicleId: form.vehicleId ? parseInt(form.vehicleId) : null,
        driverId: form.driverId ? parseInt(form.driverId) : null,
        packages: packages.map((p) => ({
          weight: parseFloat(p.weight),
          fragile: p.fragile,
          dimensions: p.dimensions,
        })),
      };
      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const addPkg = () =>
    setPackages((p) => [
      ...p,
      { weight: "", fragile: false, dimensions: "30x20x15" },
    ]);
  const removePkg = (i: number) => setPackages((p) => p.filter((_, idx) => idx !== i));
  const updatePkg = (i: number, field: string, val: any) =>
    setPackages((p) =>
      p.map((pkg, idx) => (idx === i ? { ...pkg, [field]: val } : pkg))
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    if (!form.customerId) newErrors.customerId = "Customer is required";
    if (!form.routeId) newErrors.routeId = "Route is required";
    if (!form.expectedDelivery) newErrors.expectedDelivery = "Expected delivery is required";
    if (
      packages.some(
        (p) => !p.weight || isNaN(parseFloat(p.weight)) || parseFloat(p.weight) <= 0
      )
    ) {
      newErrors.packages = "All packages need valid weight";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) createMutation.mutate();
  };

  const inputClass =
    "w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400";

  const handleCopy = () => {
    if (!createdShipment) return;
    navigator.clipboard.writeText(createdShipment.tracking_id);
    setCopied(true);
    toast.success("Tracking ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdShipment) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 text-center space-y-6 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Shipment Booked Successfully!</h2>
            <p className="text-xs text-slate-500 mt-1">
              Your shipment is registered and initial checkpoint event has been recorded.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
              Official Tracking ID
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono text-xl font-bold text-indigo-700 tracking-wider">
                {createdShipment.tracking_id}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                title="Copy Tracking ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href={`/admin/shipments/${createdShipment.shipment_id}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs"
            >
              View Shipment Details &rarr;
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedShipment(null);
                setForm({
                  customerId: "",
                  routeId: "",
                  expectedDelivery: "",
                  vehicleId: "",
                  driverId: "",
                });
                setPackages([{ weight: "", fragile: false, dimensions: "30x20x15" }]);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
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
        <Link
          href="/admin/shipments"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">New Shipment</h2>
          <p className="text-xs text-slate-500">Register a new dispatch across warehouse routes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer & Route */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
            Shipment Routing
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Customer *
              </label>
              <select
                value={form.customerId}
                onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select customer</option>
                {(customers || []).map((c: any) => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-[11px] text-red-600 mt-1">{errors.customerId}</p>
              )}
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Expected Delivery Date *
              </label>
              <input
                type="date"
                value={form.expectedDelivery}
                onChange={(e) => setForm((f) => ({ ...f, expectedDelivery: e.target.value }))}
                min={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
              {errors.expectedDelivery && (
                <p className="text-[11px] text-red-600 mt-1">{errors.expectedDelivery}</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">Route *</label>
            <select
              value={form.routeId}
              onChange={(e) => setForm((f) => ({ ...f, routeId: e.target.value }))}
              className={inputClass}
            >
              <option value="">Select route</option>
              {(routes || []).map((r: any) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.origin_name} &rarr; {r.destination_name} ({r.distance_km} km, ~{r.est_time_hrs}h)
                </option>
              ))}
            </select>
            {errors.routeId && <p className="text-[11px] text-red-600 mt-1">{errors.routeId}</p>}
            {selectedRoute && (
              <div className="mt-2 p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  {selectedRoute.origin_name} &rarr; {selectedRoute.destination_name} &middot; {selectedRoute.distance_km} km &middot; Estimated {selectedRoute.est_time_hrs}h transit
                </span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Vehicle (optional)
              </label>
              <select
                value={form.vehicleId}
                onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Assign later</option>
                {(vehicles || [])
                  .filter((v: any) => v.status !== "MAINTENANCE")
                  .map((v: any) => (
                    <option key={v.vehicle_id} value={v.vehicle_id}>
                      {v.vehicle_number} ({v.type}) &mdash; {v.status}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Driver (optional)
              </label>
              <select
                value={form.driverId}
                onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                className={inputClass}
              >
                <option value="">Assign later</option>
                {(drivers || []).map((d: any) => (
                  <option key={d.driver_id} value={d.driver_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Packages */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Package Specifications
            </h3>
            <button
              type="button"
              onClick={addPkg}
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Package
            </button>
          </div>
          {errors.packages && <p className="text-[11px] text-red-600">{errors.packages}</p>}
          {packages.map((pkg, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Package #{i + 1}</span>
                {packages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePkg(i)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove package"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={pkg.weight}
                    onChange={(e) => updatePkg(i, "weight", e.target.value)}
                    placeholder="5.0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Dimensions (LxWxH cm)
                  </label>
                  <input
                    value={pkg.dimensions}
                    onChange={(e) => updatePkg(i, "dimensions", e.target.value)}
                    placeholder="30x20x15"
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={pkg.fragile}
                      onChange={(e) => updatePkg(i, "fragile", e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    Mark as Fragile
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={createMutation.isPending}
          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs disabled:opacity-50"
        >
          {createMutation.isPending ? "Creating Shipment..." : "Register Shipment"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Minus,
  ChevronLeft,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Route as RouteIcon,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default function CustomerBookPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [routeId, setRouteId] = useState("");
  const [packages, setPackages] = useState([
    { weight: "", fragile: false, dimensions: "30x20x15" },
  ]);
  const [createdShipment, setCreatedShipment] = useState<{
    shipment_id: number;
    tracking_id: string;
    expected_delivery: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: routes, isLoading: routesLoading } = useQuery({
    queryKey: ["routes-customer"],
    queryFn: async () => {
      const res = await fetch("/api/routes");
      const j = await res.json();
      return j.data || [];
    },
  });

  const selectedRoute = routes?.find((r: any) => String(r.route_id) === routeId);

  // Compute estimated delivery date for display
  const computedDelivery = selectedRoute
    ? (() => {
        const estHrs = Number(selectedRoute.est_time_hrs) || 24;
        const days = Math.ceil(estHrs / 24) + 1;
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toLocaleDateString("en-US", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
      })()
    : null;

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        routeId: parseInt(routeId),
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
      if (!res.ok) throw new Error(json.error?.message || "Failed to book shipment");
      return json.data;
    },
    onSuccess: (data) => {
      toast.success(`Shipment successfully booked! Tracking ID: ${data.tracking_id}`);
      qc.invalidateQueries({ queryKey: ["customer-dashboard-me"] });
      qc.invalidateQueries({ queryKey: ["customer-shipments"] });
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
    if (!routeId) newErrors.routeId = "Please select a transit route";
    if (
      packages.some(
        (p) => !p.weight || isNaN(parseFloat(p.weight)) || parseFloat(p.weight) <= 0
      )
    ) {
      newErrors.packages = "All packages must have a valid positive weight";
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) createMutation.mutate();
  };

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
            <h2 className="text-xl font-bold text-slate-900">
              Shipment Booked Successfully!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Your parcel dispatch has been scheduled. Origin warehouse is preparing intake.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-sm mx-auto">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
              Your Tracking ID
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
              href={`/customer/shipments/${createdShipment.shipment_id}`}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs"
            >
              View My Shipment &rarr;
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedShipment(null);
                setRouteId("");
                setPackages([{ weight: "", fragile: false, dimensions: "30x20x15" }]);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Book Another Parcel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/customer/dashboard"
          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Book a Shipment
          </h2>
          <p className="text-xs text-slate-500">
            Select a route and configure parcel packages for scheduled dispatch
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Route Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <RouteIcon className="w-4 h-4 text-indigo-600" />
            1. Select Delivery Route
          </h3>

          <div>
            <label className="text-[11px] font-semibold text-slate-700 block mb-1">
              Hub Route *
            </label>
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              disabled={routesLoading}
              className={inputClass}
            >
              <option value="">-- Choose a warehouse route --</option>
              {(routes || []).map((r: any) => (
                <option key={r.route_id} value={r.route_id}>
                  {r.origin_name} &rarr; {r.destination_name} ({r.distance_km} km, ~{r.est_time_hrs}h transit)
                </option>
              ))}
            </select>
            {errors.routeId && <p className="text-[11px] text-red-600 mt-1">{errors.routeId}</p>}
          </div>

          {selectedRoute && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-slate-900">
                <span>{selectedRoute.origin_name} &rarr; {selectedRoute.destination_name}</span>
                <span className="font-mono text-indigo-700">{selectedRoute.distance_km} km</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Expected Delivery SLA: <strong>{computedDelivery}</strong> (Server Computed)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Packages Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              2. Package Details
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
            <div
              key={i}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  Package #{i + 1}
                </span>
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
                    placeholder="2.5"
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
                    Fragile Handling
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
          {createMutation.isPending ? "Confirming Booking..." : "Confirm & Book Shipment"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { Truck, ShieldCheck, AlertCircle, Wrench, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function PartnerVehiclePage() {
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["partner-vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/me/vehicles");
      const json = await res.json();
      return json.data || [];
    },
  });

  if (isLoading) {
    return <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />;
  }

  const list = vehicles || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          My Assigned Fleet Vehicle
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Specifications, load capacity, and operational status for your active transit units
        </p>
      </div>

      {list.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map((v: any) => (
            <div
              key={v.vehicle_id}
              className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono text-base font-bold text-slate-900">
                      {v.vehicle_number}
                    </h3>
                    <p className="text-xs text-slate-500">{v.type}</p>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    v.status === "ON_TRIP"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : v.status === "AVAILABLE"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {v.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Load Capacity</span>
                  <span className="font-semibold text-slate-800 text-sm">{v.capacity_kg} kg</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Assigned On</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {v.assigned_at ? format(new Date(v.assigned_at), "dd MMM yyyy") : "Active Assignment"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified active vehicle registered in MySQL fleet database</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3 shadow-2xs">
          <Truck className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No Vehicle Linked</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You do not currently have any fleet vehicle assigned in the database. Please request your fleet administrator to map an available vehicle to your driver profile.
          </p>
        </div>
      )}

      {/* Safety & Protocol Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 text-xs shadow-2xs">
        <h4 className="font-bold text-slate-900 flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-600" />
          Operational Maintenance Standards
        </h4>
        <p className="text-slate-600 leading-relaxed">
          Vehicles marked under MAINTENANCE cannot be assigned to shipments or moved to PICKED_UP status. Report mechanical or inspection abnormalities to the admin operations desk immediately.
        </p>
      </div>
    </div>
  );
}

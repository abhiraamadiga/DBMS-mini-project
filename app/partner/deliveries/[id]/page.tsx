"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  Truck,
  ChevronLeft,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Send,
  Navigation,
} from "lucide-react";
import Link from "next/link";
import { getAllowedTransitions } from "@/lib/shipment-flow";

export default function PartnerDeliveryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const qc = useQueryClient();

  const [nextStatus, setNextStatus] = useState("");
  const [location, setLocation] = useState("");

  const { data: shipment, isLoading, error } = useQuery({
    queryKey: ["partner-delivery", shipmentId],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/${shipmentId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Delivery not found");
      return json.data ?? null;
    },
  });

  const addEventMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shipments/${shipmentId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus, location: location.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update milestone status");
      return json.data ?? null;
    },
    onSuccess: () => {
      toast.success("Delivery milestone updated successfully!");
      qc.invalidateQueries({ queryKey: ["partner-delivery", shipmentId] });
      qc.invalidateQueries({ queryKey: ["partner-deliveries"] });
      qc.invalidateQueries({ queryKey: ["partner-dashboard-me"] });
      setLocation("");
      setNextStatus("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />;
  }

  if (error || !shipment) {
    return (
      <div className="text-center py-20 text-slate-500 space-y-3">
        <p className="text-sm">Delivery not found or not assigned to your partner account.</p>
        <Link
          href="/partner/deliveries"
          className="text-xs font-semibold text-amber-700 hover:text-amber-800 underline"
        >
          &larr; Back to active deliveries
        </Link>
      </div>
    );
  }

  const allowedNext = getAllowedTransitions(shipment.current_status, "DELIVERY_PARTNER");
  const isTerminal = ["DELIVERED", "CANCELLED"].includes(shipment.current_status);
  const hasVehicle = Boolean(shipment.vehicle_id);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/partner/deliveries"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="font-mono text-amber-800">{shipment.tracking_id}</span>
              <StatusBadge status={shipment.current_status} isDelayed={Boolean(shipment.is_delayed)} />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {shipment.origin_name} &rarr; {shipment.destination_name}
            </p>
          </div>
        </div>

        <Link
          href={`/track/${shipment.tracking_id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium shadow-2xs"
        >
          Public Tracking Page &rarr;
        </Link>
      </div>

      {/* Action Card: Update Milestone (if non-terminal) */}
      {!isTerminal ? (
        <div className="rounded-2xl border border-amber-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Navigation className="w-4 h-4 text-amber-600" />
              Update Delivery Milestone
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Current: <strong className="text-slate-900">{shipment.current_status.replace(/_/g, " ")}</strong>
            </span>
          </div>

          {allowedNext.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Select Next Milestone *
                  </label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">-- Choose next step --</option>
                    {allowedNext.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Current Location / Checkpoint Name *
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Highway Toll Checkpoint, Pune"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {nextStatus === "PICKED_UP" && !hasVehicle && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Notice: An assigned fleet vehicle is required before moving this parcel to <strong>PICKED_UP</strong>. Contact administration if no vehicle is assigned.
                  </span>
                </div>
              )}

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => addEventMutation.mutate()}
                  disabled={
                    !nextStatus ||
                    !location ||
                    (nextStatus === "PICKED_UP" && !hasVehicle) ||
                    addEventMutation.isPending
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{addEventMutation.isPending ? "Recording Milestone..." : "Submit Status Milestone"}</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No further transitions are available for this shipment.
            </p>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          This shipment has reached terminal status <strong>{shipment.current_status}</strong>. No further status milestones may be recorded.
        </div>
      )}

      {/* Details Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shadow-2xs">
        <div>
          <p className="text-slate-400 font-medium mb-1">Customer / Recipient</p>
          <p className="font-semibold text-slate-800 text-sm">{shipment.customer_name}</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium mb-1">Assigned Vehicle</p>
          <p className="font-mono text-slate-800 font-semibold text-sm">
            {shipment.vehicle_number || "Not assigned"}
          </p>
        </div>
        <div>
          <p className="text-slate-400 font-medium mb-1">Expected Delivery</p>
          <p className="font-medium text-slate-800 font-mono text-sm">
            {format(new Date(shipment.expected_delivery), "dd MMM yyyy")}
          </p>
        </div>
        <div>
          <p className="text-slate-400 font-medium mb-1">Last Recorded Location</p>
          <p className="font-semibold text-slate-800 text-sm">
            {shipment.current_location || "Origin Warehouse"}
          </p>
        </div>
      </div>

      {/* Packages Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-600" />
          Packages ({shipment.packages?.length || 0})
        </h3>
        <div className="space-y-2">
          {(shipment.packages || []).map((pkg: any) => (
            <div
              key={pkg.package_id}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800">{pkg.weight} kg</span>
                <span className="text-slate-400">&middot;</span>
                <span className="font-mono text-slate-600">{pkg.dimensions} cm</span>
              </div>
              {(pkg.fragile === true || pkg.fragile === 1) && (
                <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
                  Fragile Handling
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Checkpoints Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="font-bold text-xs text-slate-900 mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-600" />
          Milestone Timeline
        </h3>

        <div className="space-y-0">
          {(shipment.timeline || []).map((ev: any, i: number) => {
            const isLast = i === shipment.timeline.length - 1;
            return (
              <div key={ev.event_id} className="flex gap-4 relative">
                <div className="flex flex-col items-center">
                  {isLast ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-1" />
                  )}
                  {!isLast && <div className="w-px flex-1 bg-slate-200 mt-1 mb-1" />}
                </div>
                <div className="pb-4 flex-1">
                  <div className="flex items-start gap-2">
                    <StatusBadge status={ev.status} size="sm" />
                  </div>
                  <p className="text-xs text-slate-800 font-medium mt-1">{ev.location}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {format(new Date(ev.event_timestamp), "dd MMM yyyy, HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
  ChevronLeft,
  XCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function CustomerShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const qc = useQueryClient();

  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const { data: shipment, isLoading, error } = useQuery({
    queryKey: ["customer-shipment", shipmentId],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/${shipmentId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Shipment not found");
      return json.data ?? null;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shipments/${shipmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: "Cancelled by Customer" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to cancel shipment");
      return json;
    },
    onSuccess: () => {
      toast.success("Shipment successfully cancelled");
      qc.invalidateQueries({ queryKey: ["customer-shipment", shipmentId] });
      qc.invalidateQueries({ queryKey: ["customer-shipments-list"] });
      qc.invalidateQueries({ queryKey: ["customer-dashboard-me"] });
      setShowCancelDialog(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />;
  }

  if (error || !shipment) {
    return (
      <div className="text-center py-20 text-slate-500 space-y-3">
        <p className="text-sm">Shipment not found or access denied.</p>
        <Link
          href="/customer/shipments"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline"
        >
          &larr; Back to my shipments
        </Link>
      </div>
    );
  }

  const isBooked = shipment.current_status === "BOOKED";

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Bar Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customer/shipments"
            className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
              <span className="font-mono text-indigo-700">{shipment.tracking_id}</span>
              <StatusBadge status={shipment.current_status} isDelayed={Boolean(shipment.is_delayed)} />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {shipment.origin_name} &rarr; {shipment.destination_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Customer Cancel Button (BOOKED only) */}
          {isBooked && (
            <button
              onClick={() => setShowCancelDialog(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs transition-all shadow-2xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel Shipment</span>
            </button>
          )}

          <Link
            href={`/track/${shipment.tracking_id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all shadow-2xs"
          >
            <span>Public Tracking</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">
                Cancel This Shipment?
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel your shipment <strong className="font-mono text-slate-900">{shipment.tracking_id}</strong>? Cancellation is irrevocable once confirmed.
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Keep Shipment
              </button>
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-xs rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Shipment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delayed SLA alert */}
      {shipment.is_delayed && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            This shipment has exceeded its expected delivery date of {format(new Date(shipment.expected_delivery), "dd MMM yyyy")}. Logistics partners are actively resolving transit.
          </span>
        </div>
      )}

      {/* Details Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs shadow-2xs">
        <div>
          <p className="text-slate-400 font-medium mb-1">Origin Warehouse</p>
          <p className="font-semibold text-slate-800 text-sm">{shipment.origin_name}</p>
          <p className="text-[11px] text-slate-500">{shipment.origin_location}</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium mb-1">Destination Warehouse</p>
          <p className="font-semibold text-slate-800 text-sm">{shipment.destination_name}</p>
          <p className="text-[11px] text-slate-500">{shipment.destination_location}</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium mb-1">Expected Delivery</p>
          <p className="font-medium text-slate-800 font-mono text-sm">
            {format(new Date(shipment.expected_delivery), "dd MMM yyyy")}
          </p>
          <p className="text-[11px] text-slate-500">Scheduled SLA</p>
        </div>
        <div>
          <p className="text-slate-400 font-medium mb-1">Current Location</p>
          <p className="font-semibold text-slate-800 text-sm">{shipment.current_location || "Processing"}</p>
          <p className="text-[11px] text-slate-500">Live Status</p>
        </div>
      </div>

      {/* Packages Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-2">
          <Package className="w-4 h-4 text-indigo-600" />
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
                  Fragile
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Checkpoints Timeline */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
        <h3 className="font-bold text-xs text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          Milestones & Tracking History
        </h3>

        <div className="space-y-0">
          {(shipment.timeline || []).map((ev: any, i: number) => {
            const isLast = i === shipment.timeline.length - 1;
            return (
              <div key={ev.event_id} className="flex gap-4 relative">
                <div className="flex flex-col items-center">
                  {isLast ? (
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-1" />
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

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  Truck,
  UserCheck,
  Plus,
  CheckCircle2,
  Circle,
  ChevronLeft,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getAllowedTransitions } from "@/lib/shipment-flow";

export default function ShipmentDetailPage() {
  const params = useParams();
  const shipmentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const qc = useQueryClient();

  const [showEventForm, setShowEventForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [eventStatus, setEventStatus] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [assignVehicle, setAssignVehicle] = useState("");
  const [assignDriver, setAssignDriver] = useState("");

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", shipmentId],
    queryFn: async () => {
      const res = await fetch(`/api/shipments/${shipmentId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load data");
      return json.data ?? null;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const res = await fetch("/api/vehicles");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Failed to load data");
      return j.data ?? [];
    },
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Failed to load data");
      return j.data ?? [];
    },
  });

  const addEvent = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shipments/${shipmentId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: eventStatus, location: eventLocation }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to add tracking event");
      return json;
    },
    onSuccess: () => {
      toast.success("Tracking event milestone added");
      qc.invalidateQueries({ queryKey: ["shipment", shipmentId] });
      setShowEventForm(false);
      setEventLocation("");
      setEventStatus("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const body: any = {};
      if (assignVehicle) body.vehicleId = parseInt(assignVehicle);
      if (assignDriver) body.driverId = parseInt(assignDriver);
      const res = await fetch(`/api/shipments/${shipmentId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update assignment");
      return json;
    },
    onSuccess: () => {
      toast.success("Assignment updated");
      qc.invalidateQueries({ queryKey: ["shipment", shipmentId] });
      setShowAssignForm(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/shipments/${shipmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location: cancelReason || "Cancelled by Admin" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to cancel shipment");
      return json;
    },
    onSuccess: () => {
      toast.success("Shipment cancelled");
      qc.invalidateQueries({ queryKey: ["shipment", shipmentId] });
      setShowCancelDialog(false);
      setCancelReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="h-96 rounded-2xl bg-slate-200 animate-pulse" />;
  }

  if (!shipment) {
    return (
      <div className="text-center py-20 text-slate-500">
        Shipment not found
      </div>
    );
  }

  const allowedNext = getAllowedTransitions(shipment.current_status, "ADMIN");
  const isTerminal = ["DELIVERED", "CANCELLED"].includes(shipment.current_status);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Bar Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/shipments"
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

        {/* Action Buttons */}
        {!isTerminal && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEventStatus(allowedNext[0] || "");
                setShowEventForm(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Event</span>
            </button>
            <button
              onClick={() => setShowCancelDialog(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold text-xs transition-all shadow-2xs"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">
                Cancel Shipment
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel shipment <strong className="font-mono text-slate-900">{shipment.tracking_id}</strong>? This will insert a terminal CANCELLED event and mark it as cancelled.
            </p>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Reason / Location note (optional)
              </label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Origin Warehouse - Customer requested cancellation"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowCancelDialog(false)}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-xs rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Details, Packages, Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs shadow-2xs">
            <div>
              <p className="text-slate-400 font-medium mb-1">Customer</p>
              <p className="font-semibold text-slate-800 text-sm">{shipment.customer_name}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Booking Date</p>
              <p className="font-medium text-slate-800 font-mono">
                {format(new Date(shipment.booking_date), "dd MMM yyyy, HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Expected Delivery</p>
              <p className="font-medium text-slate-800 font-mono">
                {format(new Date(shipment.expected_delivery), "dd MMM yyyy")}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Current Location</p>
              <p className="font-medium text-slate-800">{shipment.current_location || "—"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Vehicle</p>
              <p className="font-mono text-slate-800 font-medium">
                {shipment.vehicle_number || "Not assigned"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-1">Driver</p>
              <p className="font-medium text-slate-800">{shipment.driver_name || "Not assigned"}</p>
            </div>
          </div>

          {/* Packages Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <h3 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              Packages in Shipment ({shipment.packages?.length})
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

          {/* Timeline Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Checkpoint Milestones
              </h3>
            </div>

            {/* Add Event Panel */}
            {showEventForm && (
              <div className="mb-5 p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 space-y-3">
                <div className="text-xs font-semibold text-indigo-900">
                  Record Status Transition
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Allowed Next Status
                  </label>
                  <select
                    value={eventStatus}
                    onChange={(e) => setEventStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {allowedNext.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Checkpoint Location
                  </label>
                  <input
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="e.g. Hub Dispatch Center, Mumbai"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => addEvent.mutate()}
                    disabled={!eventLocation || !eventStatus || addEvent.isPending}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-all shadow-xs"
                  >
                    {addEvent.isPending ? "Recording..." : "Record Milestone"}
                  </button>
                  <button
                    onClick={() => setShowEventForm(false)}
                    className="px-3.5 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Timeline Stream */}
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

        {/* Right Column: Fleet Assignment Panel */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                Fleet Assignment
              </h3>
              {!isTerminal && (
                <button
                  onClick={() => setShowAssignForm(!showAssignForm)}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                >
                  {showAssignForm ? "Close" : "Change"}
                </button>
              )}
            </div>

            {showAssignForm ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    Assign Vehicle
                  </label>
                  <select
                    value={assignVehicle}
                    onChange={(e) => setAssignVehicle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Keep current</option>
                    {(vehicles || [])
                      .filter((v: any) => v.status !== "MAINTENANCE")
                      .map((v: any) => (
                        <option key={v.vehicle_id} value={v.vehicle_id}>
                          {v.vehicle_number} ({v.type})
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    Assign Driver
                  </label>
                  <select
                    value={assignDriver}
                    onChange={(e) => setAssignDriver(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Keep current</option>
                    {(drivers || []).map((d: any) => (
                      <option key={d.driver_id} value={d.driver_id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => assignMutation.mutate()}
                    disabled={assignMutation.isPending}
                    className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold disabled:opacity-50 transition-all shadow-xs"
                  >
                    {assignMutation.isPending ? "Saving..." : "Save Assignment"}
                  </button>
                  <button
                    onClick={() => setShowAssignForm(false)}
                    className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Truck className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Assigned Vehicle</p>
                    <p className="font-mono text-slate-900 font-semibold mt-0.5">
                      {shipment.vehicle_number || "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">Assigned Driver</p>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {shipment.driver_name || "Not assigned"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

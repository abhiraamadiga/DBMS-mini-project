"use client";

import { apiFetch } from "@/lib/client-api";
import type { Driver, ShipmentDetail, Vehicle } from "@/lib/types";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Package, MapPin, Truck, UserCheck, Plus, CheckCircle, Circle, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function ShipmentDetailPage() {
  const params = useParams();
  const shipmentId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const qc = useQueryClient();
  const [showEventForm, setShowEventForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [eventStatus, setEventStatus] = useState("IN_TRANSIT");
  const [eventLocation, setEventLocation] = useState("");
  const [assignVehicle, setAssignVehicle] = useState("");
  const [assignDriver, setAssignDriver] = useState("");

  const { data: shipment, isLoading } = useQuery({ throwOnError: true,
    queryKey: ["shipment", shipmentId],
    queryFn: async () => {
      const res = await apiFetch<ShipmentDetail>(`/api/shipments/${shipmentId}`);
      const json = await res.json();
      return json.data;
    },
  });

  const { data: vehicles } = useQuery({ throwOnError: true,
    queryKey: ["vehicles"],
    queryFn: async () => { const res = await apiFetch<Vehicle[]>("/api/vehicles"); const j = await res.json(); return j.data; },
  });

  const { data: drivers } = useQuery({ throwOnError: true,
    queryKey: ["drivers"],
    queryFn: async () => { const res = await apiFetch<Driver[]>("/api/drivers"); const j = await res.json(); return j.data; },
  });

  const addEvent = useMutation({
    mutationFn: async () => {
      const res = await apiFetch<ShipmentDetail>(`/api/shipments/${shipmentId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: eventStatus, location: eventLocation }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed");
      return json;
    },
    onSuccess: () => {
      toast.success("Tracking event added");
      qc.invalidateQueries();
      setShowEventForm(false);
      setEventLocation("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const body: { vehicleId?: number | null; driverId?: number | null } = {};
      if (assignVehicle) body.vehicleId = assignVehicle === "unassign" ? null : parseInt(assignVehicle);
      if (assignDriver) body.driverId = assignDriver === "unassign" ? null : parseInt(assignDriver);
      const res = await apiFetch<ShipmentDetail>(`/api/shipments/${shipmentId}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed");
      return json;
    },
    onSuccess: () => {
      toast.success("Assignment updated");
      qc.invalidateQueries();
      setShowAssignForm(false);
      setAssignVehicle(""); setAssignDriver("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="h-96 rounded-2xl bg-[var(--secondary)] animate-pulse" />;
  if (!shipment) return <div className="text-center py-20 text-[var(--muted-foreground)]">Shipment not found</div>;

  const STATUSES = ["BOOKED","PICKED_UP","IN_TRANSIT","AT_WAREHOUSE","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/shipments" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
            <span className="font-mono text-indigo-400">{shipment.tracking_id}</span>
            <StatusBadge status={shipment.current_status} isDelayed={Boolean(shipment.is_delayed)} />
          </h2>
          <p className="text-sm text-[var(--muted-foreground)]">
            {shipment.origin_name} → {shipment.destination_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Info + Timeline */}
        <div className="lg:col-span-2 space-y-5">
          {/* Info card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-[var(--muted-foreground)] text-xs mb-1">Customer</p><p className="font-medium">{shipment.customer_name}</p></div>
            <div><p className="text-[var(--muted-foreground)] text-xs mb-1">Booking Date</p><p className="font-medium">{format(new Date(shipment.booking_date), "dd MMM yyyy, HH:mm")}</p></div>
            <div><p className="text-[var(--muted-foreground)] text-xs mb-1">Expected Delivery</p><p className="font-medium">{format(parseISO(shipment.expected_delivery), "dd MMM yyyy")}</p></div>
            <div><p className="text-[var(--muted-foreground)] text-xs mb-1">Current Location</p><p className="font-medium">{shipment.current_location || "—"}</p></div>
            <div><p className="text-[var(--muted-foreground)] text-xs mb-1">Vehicle</p><p className="font-mono text-xs">{shipment.vehicle_number || "Not assigned"}</p></div>
            <div><p className="text-[var(--muted-foreground)] text-xs mb-1">Driver</p><p className="font-medium">{shipment.driver_name || "Not assigned"}</p></div>
          </div>

          {/* Packages */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-indigo-400" /> Packages ({shipment.packages?.length})</h3>
            <div className="space-y-2">
              {(shipment.packages || []).map((pkg) => (
                <div key={pkg.package_id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--secondary)] text-sm">
                  <div className="flex-1"><span className="text-[var(--foreground)]">{pkg.weight} kg</span> · <span className="font-mono text-xs text-[var(--muted-foreground)]">{pkg.dimensions} cm</span></div>
                  {(pkg.fragile === true || pkg.fragile === 1) && <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Fragile</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-400" /> Timeline</h3>
              {!["DELIVERED","CANCELLED"].includes(shipment.current_status) && (
                <button onClick={() => setShowEventForm(!showEventForm)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-indigo-600/15 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/25 transition-all">
                  <Plus className="w-3.5 h-3.5" /> Add Event
                </button>
              )}
            </div>

            {showEventForm && (
              <div className="mb-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-3">
                <select value={eventStatus} onChange={e => setEventStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                </select>
                <input value={eventLocation} onChange={e => setEventLocation(e.target.value)}
                  placeholder="Location (e.g. Chennai Hub)" 
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                <div className="flex gap-2">
                  <button onClick={() => addEvent.mutate()} disabled={!eventLocation || addEvent.isPending}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50 hover:bg-indigo-500 transition-all">
                    {addEvent.isPending ? "Adding..." : "Add Event"}
                  </button>
                  <button onClick={() => setShowEventForm(false)} className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--secondary)] transition-all">Cancel</button>
                </div>
              </div>
            )}

            <div className="space-y-0">
              {(shipment.timeline || []).map((ev, i: number) => {
                const isLast = i === (shipment.timeline.length - 1);
                return (
                  <div key={ev.event_id} className="flex gap-4 relative">
                    <div className="flex flex-col items-center">
                      {isLast ? <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-1" /> : <Circle className="w-5 h-5 text-[var(--muted-foreground)] shrink-0 mt-1" />}
                      {!isLast && <div className="w-px flex-1 bg-[var(--border)] mt-1 mb-1" />}
                    </div>
                    <div className={`pb-4 flex-1 ${isLast ? "" : ""}`}>
                      <div className="flex items-start gap-2">
                        <StatusBadge status={ev.status} size="sm" />
                      </div>
                      <p className="text-sm text-[var(--foreground)] mt-1">{ev.location}</p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                        {format(new Date(ev.event_timestamp), "dd MMM yyyy, HH:mm")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Assignment panel */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Truck className="w-4 h-4 text-cyan-400" /> Assignment</h3>
              <button onClick={() => setShowAssignForm(!showAssignForm)}
                className="text-xs text-indigo-400 hover:text-indigo-300">Edit</button>
            </div>

            {showAssignForm ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Vehicle</label>
                  <select value={assignVehicle} onChange={e => setAssignVehicle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <option value="">Keep current</option>
                    <option value="unassign">Unassign</option>
                    {(vehicles || []).filter((v) => v.status !== "MAINTENANCE").map((v) => (
                      <option key={v.vehicle_id} value={v.vehicle_id}>{v.vehicle_number} ({v.type})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--muted-foreground)] mb-1 block">Driver</label>
                  <select value={assignDriver} onChange={e => setAssignDriver(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
                    <option value="">Keep current</option>
                    <option value="unassign">Unassign</option>
                    {(drivers || []).map((d) => (
                      <option key={d.driver_id} value={d.driver_id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}
                    className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-50 hover:bg-indigo-500 transition-all">
                    {assignMutation.isPending ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setShowAssignForm(false)} className="px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--secondary)] transition-all">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
                  <Truck className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Vehicle</p>
                    <p className="font-mono text-xs">{shipment.vehicle_number || "Not assigned"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
                  <UserCheck className="w-4 h-4 text-[var(--muted-foreground)]" />
                  <div>
                    <p className="text-xs text-[var(--muted-foreground)]">Driver</p>
                    <p className="font-medium">{shipment.driver_name || "Not assigned"}</p>
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

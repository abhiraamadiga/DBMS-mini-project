"use client";

import { apiFetch } from "@/lib/client-api";
import type { ShipmentDetail } from "@/lib/types";

import { useState } from "react";
import { Search, Package, MapPin, CheckCircle, X } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format, parseISO } from "date-fns";

export default function TrackPage() {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!trackingId.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await apiFetch<ShipmentDetail>(`/api/track/${encodeURIComponent(trackingId.trim().toUpperCase())}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error?.message || "Not found"); return; }
      setResult(json.data);
    } catch (error) { setError(error instanceof Error ? error.message : "Failed to search"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold">Track Shipment</h2>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Enter a tracking ID to get live shipment status</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
          <input value={trackingId} onChange={e => setTrackingId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="SLM2026000001"
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-[var(--foreground)] placeholder:font-sans placeholder:text-[var(--muted-foreground)]" />
        </div>
        <button onClick={handleSearch} disabled={loading || !trackingId.trim()}
          className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 transition-all">
          {loading ? "Searching..." : "Track"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          <X className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="space-y-5">
          {/* Header card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-mono text-2xl font-bold text-indigo-400">{result.tracking_id}</p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">{result.customer_name}</p>
              </div>
              <StatusBadge status={result.current_status} isDelayed={Boolean(result.is_delayed)} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-[var(--border)] text-sm">
              <div><p className="text-xs text-[var(--muted-foreground)] mb-1">Origin</p><p className="font-medium">{result.origin_name}</p></div>
              <div><p className="text-xs text-[var(--muted-foreground)] mb-1">Destination</p><p className="font-medium">{result.destination_name}</p></div>
              <div><p className="text-xs text-[var(--muted-foreground)] mb-1">Expected</p><p className="font-medium">{result.expected_delivery ? format(parseISO(result.expected_delivery), "dd MMM yyyy") : "—"}</p></div>
              <div><p className="text-xs text-[var(--muted-foreground)] mb-1">Current Location</p><p className="font-medium">{result.current_location || "—"}</p></div>
            </div>
          </div>

          {/* Packages */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-indigo-400" /> Packages ({result.packages?.length})</h3>
            <div className="space-y-2">
              {(result.packages || []).map((pkg) => (
                <div key={pkg.package_id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[var(--secondary)] text-sm">
                  <span className="text-[var(--foreground)]">{pkg.weight} kg</span>
                  <span className="text-[var(--muted-foreground)] font-mono text-xs">· {pkg.dimensions} cm</span>
                  {(pkg.fragile === true || pkg.fragile === 1) && <span className="ml-auto text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Fragile</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="w-4 h-4 text-cyan-400" /> Tracking Timeline</h3>
            <div className="space-y-0">
              {[...(result.timeline || [])].reverse().map((ev, i: number, arr) => (
                <div key={ev.event_id} className="flex gap-4 relative">
                  <div className="flex flex-col items-center">
                    {i === 0 ? <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-1" /> : <div className="w-5 h-5 rounded-full border-2 border-[var(--border)] shrink-0 mt-1" />}
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-[var(--border)] mt-1 mb-1" />}
                  </div>
                  <div className="pb-5 flex-1">
                    <div className="flex items-start gap-2"><StatusBadge status={ev.status} size="sm" /></div>
                    <p className="text-sm text-[var(--foreground)] mt-1">{ev.location}</p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">{format(new Date(ev.event_timestamp), "dd MMM yyyy, HH:mm")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

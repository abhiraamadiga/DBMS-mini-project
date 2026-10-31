"use client";

import { apiFetch } from "@/lib/client-api";
import type { ShipmentDetail } from "@/lib/types";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { Package, MapPin, Truck, UserCheck, Calendar, ArrowLeft, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";

export default function PublicTrackDetailPage({ params }: { params: Promise<{ trackingId: string }> }) {
  const resolvedParams = use(params);
  const trackingId = resolvedParams.trackingId;
  const router = useRouter();

  const [searchInput, setSearchInput] = useState(trackingId);
  const [data, setData] = useState<ShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchTracking() {
      if (!trackingId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<ShipmentDetail>(`/api/track/${encodeURIComponent(trackingId)}`, { signal: controller.signal });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error?.message || "Shipment not found with this tracking ID");
          setData(null);
        } else {
          setData(json.data);
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Failed to fetch shipment details");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    fetchTracking();
    return () => controller.abort();
  }, [trackingId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/track/${searchInput.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between border-b border-[var(--border)] pb-4">
          <Link href="/" className="flex items-center gap-2.5 text-indigo-400 hover:text-indigo-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold text-sm">Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <a href="/dashboard"
              className="text-xs px-3.5 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 font-medium transition-all"
            >
              Admin Dashboard →
            </a>
          </div>
        </header>

        {/* Search Bar for other shipments */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Enter another tracking ID (e.g. SLM2026000001)"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20"
          >
            Track
          </button>
        </form>

        {loading ? (
          <div className="space-y-4 pt-4">
            <div className="h-44 rounded-2xl bg-[var(--secondary)] animate-pulse" />
            <div className="h-64 rounded-2xl bg-[var(--secondary)] animate-pulse" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center space-y-4 max-w-md mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-[var(--foreground)]">Tracking ID Not Found</h3>
              <p className="text-sm text-[var(--muted-foreground)] mt-1">{error}</p>
            </div>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm font-medium hover:bg-[var(--secondary)]"
            >
              Try Another Tracking ID
            </Link>
          </div>
        ) : data ? (
          <div className="space-y-6 pt-2">
            {/* Shipment Summary Card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-semibold block mb-1">
                    Shipment Tracking ID
                  </span>
                  <h1 className="font-mono text-3xl font-extrabold text-indigo-400 tracking-tight">
                    {data.tracking_id}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={data.current_status} isDelayed={Boolean(data.is_delayed)} size="md" />
                </div>
              </div>

              {/* Delayed Alert if applicable */}
              {data.is_delayed && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                  <span>
                    <strong>Delivery Attention:</strong> This shipment has exceeded its expected delivery date of{" "}
                    {format(parseISO(data.expected_delivery), "dd MMM yyyy")}. Logistics coordinators are actively resolving transit.
                  </span>
                </div>
              )}

              {/* Route & Key Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-2">
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block mb-1">Origin</span>
                  <p className="font-semibold text-[var(--foreground)]">{data.origin_name}</p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block mb-1">Destination</span>
                  <p className="font-semibold text-[var(--foreground)]">{data.destination_name}</p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block mb-1">Expected Delivery</span>
                  <p className="font-semibold text-[var(--foreground)]">
                    {data.expected_delivery ? format(parseISO(data.expected_delivery), "dd MMM yyyy") : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-[var(--muted-foreground)] block mb-1">Current Location</span>
                  <p className="font-semibold text-[var(--foreground)]">{data.current_location || "Processing"}</p>
                </div>
              </div>

              {/* Fleet & Recipient info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border)] text-sm">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
                  <Truck className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block">Vehicle</span>
                    <span className="font-mono text-xs font-medium">{data.vehicle_number || "To be assigned"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
                  <UserCheck className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block">Driver</span>
                    <span className="font-medium text-xs">{data.driver_name || "To be assigned"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--secondary)]">
                  <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
                  <div>
                    <span className="text-xs text-[var(--muted-foreground)] block">Booked On</span>
                    <span className="font-medium text-xs">
                      {data.booking_date ? format(new Date(data.booking_date), "dd MMM yyyy, HH:mm") : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Packages */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-indigo-400" /> Packages in Shipment ({data.packages?.length || 0})
                </h3>
                <div className="space-y-2.5">
                  {(data.packages || []).map((pkg, idx: number) => (
                    <div key={pkg.package_id || idx} className="p-3 rounded-xl bg-[var(--secondary)] text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[var(--foreground)]">Package #{idx + 1}</span>
                        {(pkg.fragile === true || pkg.fragile === 1) && (
                          <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            Fragile
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                        <span>{pkg.weight} kg</span>
                        <span>·</span>
                        <span className="font-mono">{pkg.dimensions} cm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vertical Animated Timeline */}
              <div className="md:col-span-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" /> Tracking History
                </h3>

                <div className="space-y-0 pl-1">
                  {[...(data.timeline || [])].reverse().map((ev, idx: number, arr) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={ev.event_id || idx} className="flex gap-4 relative">
                        <div className="flex flex-col items-center">
                          {isLatest ? (
                            <CheckCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-[var(--border)] shrink-0 mt-1" />
                          )}
                          {idx < arr.length - 1 && <div className="w-px flex-1 bg-[var(--border)] my-1.5" />}
                        </div>
                        <div className="pb-6 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={ev.status} size="sm" />
                            {isLatest && (
                              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                Latest
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[var(--foreground)] mt-1.5">{ev.location}</p>
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
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  Package,
  MapPin,
  Calendar,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Search,
  ShieldCheck,
  Clock,
  Warehouse,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function PublicTrackDetailPage({
  params,
}: {
  params: Promise<{ trackingId: string }>;
}) {
  const resolvedParams = use(params);
  const trackingId = resolvedParams.trackingId;
  const router = useRouter();

  const [searchInput, setSearchInput] = useState(trackingId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracking() {
      if (!trackingId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/track/${encodeURIComponent(trackingId)}`);
        const json = await res.json();
        if (!res.ok) {
          setError(json.error?.message || "Shipment not found with this tracking ID");
          setData(null);
        } else {
          setData(json.data);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch shipment details");
      } finally {
        setLoading(false);
      }
    }
    fetchTracking();
  }, [trackingId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/track/${searchInput.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium transition-all shadow-2xs"
            >
              Sign In to Portal
            </Link>
          </div>
        </header>

        {/* Search Bar for other shipments */}
        <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto pt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Track another shipment (e.g. SLM2026000001)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-2xs"
          >
            Track
          </button>
        </form>

        {loading ? (
          <div className="space-y-4 pt-4">
            <div className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
            <div className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-slate-900">
                Shipment Not Found
              </h3>
              <p className="text-sm text-slate-500 mt-1">{error}</p>
            </div>
            <Link
              href="/"
              className="inline-block px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium transition-colors"
            >
              Try Another Tracking ID
            </Link>
          </div>
        ) : data ? (
          <div className="space-y-6 pt-2">
            {/* Shipment Summary Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                    Shipment Tracking ID
                  </span>
                  <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-indigo-700 tracking-tight">
                    {data.tracking_id}
                  </h1>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge
                    status={data.current_status}
                    isDelayed={Boolean(data.is_delayed)}
                    size="md"
                  />
                </div>
              </div>

              {/* Delayed Alert if applicable */}
              {data.is_delayed && (
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
                  <span>
                    <strong>Transit Alert:</strong> This shipment has exceeded its expected delivery date of{" "}
                    {format(new Date(data.expected_delivery), "dd MMM yyyy")}. Logistics operations are actively monitoring this route.
                  </span>
                </div>
              )}

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Origin</span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{data.origin_name}</p>
                  <p className="text-[11px] text-slate-500">{data.origin_location}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Destination</span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{data.destination_name}</p>
                  <p className="text-[11px] text-slate-500">{data.destination_location}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Expected Delivery</span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">
                    {data.expected_delivery ? format(new Date(data.expected_delivery), "dd MMM yyyy") : "—"}
                  </p>
                  <p className="text-[11px] text-slate-500">Scheduled SLA</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[11px] text-slate-500 block font-medium">Current Location</span>
                  <p className="font-semibold text-slate-800 text-sm mt-0.5">{data.current_location || "Processing"}</p>
                  <p className="text-[11px] text-slate-500">Live Status</p>
                </div>
              </div>

              {/* Privacy badge */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Public tracking view &middot; Total Packages: {data.package_count || 1} &middot; Sensitive sender and driver details are masked.
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 space-y-6 shadow-xs">
              <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                Shipment Milestones Timeline
              </h2>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(data.timeline || []).map((evt: any, idx: number) => {
                  const isLatest = idx === (data.timeline || []).length - 1;
                  return (
                    <div key={idx} className="relative group">
                      <div
                        className={`absolute -left-[27px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                          isLatest
                            ? "border-indigo-600 ring-4 ring-indigo-50"
                            : "border-slate-300"
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isLatest ? "bg-indigo-600" : "bg-slate-400"
                          }`}
                        />
                      </div>
                      <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 group-hover:bg-slate-50 transition-all">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-slate-900">
                              {evt.status.replace(/_/g, " ")}
                            </span>
                            {isLatest && (
                              <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded">
                                Current
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {evt.event_timestamp
                              ? format(new Date(evt.event_timestamp), "dd MMM yyyy, HH:mm")
                              : ""}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{evt.location}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

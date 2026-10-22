"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Truck,
  User,
  Clock,
  Layers,
  ChevronDown,
  ChevronRight,
  Database,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { EmptyState } from "@/components/common/EmptyState";

export default function AdminActivityPage() {
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-activity-logs", q, actionFilter, entityFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (q) params.set("q", q);
      if (actionFilter) params.set("action", actionFilter);
      if (entityFilter) params.set("entity", entityFilter);
      const res = await fetch(`/api/activity-logs?${params}`);
      const json = await res.json();
      return json.data || [];
    },
    refetchInterval: 15000,
  });

  const logs = data || [];

  const getActorBadge = (actor?: { role?: string; name?: string }) => {
    const role = actor?.role || "SYSTEM";
    const name = actor?.name || "System Automated";

    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            <span>{name} (Admin)</span>
          </span>
        );
      case "DELIVERY_PARTNER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Truck className="w-3 h-3 text-amber-600" />
            <span>{name} (Partner)</span>
          </span>
        );
      case "CUSTOMER":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <User className="w-3 h-3 text-cyan-600" />
            <span>{name} (Customer)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Database className="w-3 h-3 text-slate-500" />
            <span>{name}</span>
          </span>
        );
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("REGISTER")) {
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    }
    if (action.includes("DELETE") || action.includes("CANCEL") || action.includes("DEACTIVATE")) {
      return "text-red-700 bg-red-50 border-red-200";
    }
    if (action.includes("UPDATE") || action.includes("STATUS") || action.includes("ASSIGN")) {
      return "text-indigo-700 bg-indigo-50 border-indigo-200";
    }
    if (action.includes("LOGIN") || action.includes("LOGOUT")) {
      return "text-blue-700 bg-blue-50 border-blue-200";
    }
    return "text-slate-700 bg-slate-100 border-slate-200";
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Audit & Activity Logs</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              MongoDB
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time actor-aware immutable event log tracking all system mutations and authentication events
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-indigo-600" : ""}`} />
          <span>{isFetching ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by action, actor, entity, tracking ID..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
          />
        </div>
        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
          >
            <option value="">All Actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="REGISTERED">REGISTERED</option>
            <option value="USER_CREATED">USER_CREATED</option>
            <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
            <option value="PASSWORD_RESET">PASSWORD_RESET</option>
            <option value="SHIPMENT_CREATED">SHIPMENT_CREATED</option>
            <option value="STATUS_UPDATED">STATUS_UPDATED</option>
            <option value="SHIPMENT_CANCELLED">SHIPMENT_CANCELLED</option>
            <option value="VEHICLE_ASSIGNED">VEHICLE_ASSIGNED</option>
            <option value="DRIVER_ASSIGNED">DRIVER_ASSIGNED</option>
          </select>
        </div>
        <div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
          >
            <option value="">All Entities</option>
            <option value="shipment">Shipment</option>
            <option value="auth">Auth</option>
            <option value="user">User</option>
            <option value="customer">Customer</option>
            <option value="driver">Driver</option>
            <option value="vehicle">Vehicle</option>
            <option value="warehouse">Warehouse</option>
            <option value="route">Route</option>
          </select>
        </div>
      </div>

      {/* Log list / Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState title="No activity records found" description="Activity events logged to MongoDB will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-8"></th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Reference / Tracking</th>
                  <th className="py-3 px-4">Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: any) => {
                  const id = log._id?.toString() || `${log.action}-${log.createdAt}`;
                  const isExpanded = expandedRow === id;
                  const detailsText =
                    log.details && Object.keys(log.details).length > 0
                      ? JSON.stringify(log.details)
                      : "—";

                  return (
                    <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 text-slate-400">
                        <button
                          type="button"
                          onClick={() => setExpandedRow(isExpanded ? null : id)}
                          className="p-1 hover:text-slate-700 transition-colors"
                          title="Toggle details"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {log.createdAt
                              ? format(new Date(log.createdAt), "dd MMM yyyy, HH:mm:ss")
                              : "—"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getActionColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{getActorBadge(log.actor)}</td>
                      <td className="py-3 px-4 font-medium text-slate-700 capitalize whitespace-nowrap">
                        {log.entity}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {log.trackingId ? (
                          <Link
                            href={`/admin/shipments`}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
                          >
                            <span>{log.trackingId}</span>
                            <ExternalLink className="w-3 h-3 text-indigo-400" />
                          </Link>
                        ) : log.entityId ? (
                          <span className="text-slate-500">#{log.entityId}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {isExpanded ? (
                          <pre className="p-2 mt-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-800 whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-600">{detailsText}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

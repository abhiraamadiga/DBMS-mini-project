"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Shield,
  Truck,
  UserCheck,
  CheckCircle2,
  XCircle,
  KeyRound,
  Loader2,
  AlertTriangle,
  Power,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminUsersPage() {
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // New partner state
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newPartnerPassword, setNewPartnerPassword] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");

  // Reset password state
  const [newPassword, setNewPassword] = useState("");

  // Fetch current admin user to prevent self-deactivation
  const { data: currentUser } = useQuery({
    queryKey: ["admin-me-session"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      const j = await res.json();
      return j.data?.user || j.data;
    },
  });

  // Fetch users list
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users-list", q, roleFilter],
    queryFn: async () => {
      const res = await fetch("/api/users");
      const j = await res.json();
      let list = j.data || [];
      if (roleFilter) {
        list = list.filter((u: any) => u.role === roleFilter);
      }
      if (q.trim()) {
        const query = q.toLowerCase();
        list = list.filter(
          (u: any) =>
            u.email?.toLowerCase().includes(query) ||
            u.linked_name?.toLowerCase().includes(query)
        );
      }
      return list;
    },
  });

  // Fetch drivers without user accounts to populate create dialog
  const { data: drivers } = useQuery({
    queryKey: ["drivers-for-users"],
    queryFn: async () => {
      const res = await fetch("/api/drivers");
      const j = await res.json();
      return j.data || [];
    },
    enabled: createDialogOpen,
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ userId, is_active }: { userId: number; is_active: boolean }) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Failed to update user status");
      return j.data;
    },
    onSuccess: (_, vars) => {
      toast.success(`User ${vars.is_active ? "activated" : "deactivated"} successfully`);
      qc.invalidateQueries({ queryKey: ["admin-users-list"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Create partner mutation
  const createPartnerMutation = useMutation({
    mutationFn: async () => {
      if (!newPartnerEmail || !newPartnerPassword || !selectedDriverId) {
        throw new Error("All fields are required");
      }
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newPartnerEmail.trim(),
          password: newPartnerPassword,
          role: "DELIVERY_PARTNER",
          driver_id: parseInt(selectedDriverId, 10),
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Failed to create partner account");
      return j.data;
    },
    onSuccess: () => {
      toast.success("Delivery partner account created successfully!");
      qc.invalidateQueries({ queryKey: ["admin-users-list"] });
      setCreateDialogOpen(false);
      setNewPartnerEmail("");
      setNewPartnerPassword("");
      setSelectedDriverId("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      if (!newPassword || newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      const res = await fetch(`/api/users/${selectedUser.user_id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error?.message || "Failed to reset password");
      return j.data;
    },
    onSuccess: () => {
      toast.success(`Password reset for ${selectedUser.email}`);
      setResetDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return {
          label: "Admin",
          color: "bg-purple-100 text-purple-700 border-purple-200",
          icon: Shield,
        };
      case "DELIVERY_PARTNER":
        return {
          label: "Delivery Partner",
          color: "bg-amber-100 text-amber-700 border-amber-200",
          icon: Truck,
        };
      case "CUSTOMER":
      default:
        return {
          label: "Customer",
          color: "bg-sky-100 text-sky-700 border-sky-200",
          icon: UserCheck,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Users & Access Control
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage system users, grant delivery partner logins, and enforce account activation
          </p>
        </div>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Create Partner Account</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search user by name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-2xs"
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="DELIVERY_PARTNER">Delivery Partner</option>
          <option value="CUSTOMER">Customer</option>
        </select>
      </div>

      {/* Users Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="space-y-px">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-slate-100 animate-pulse"
                style={{ opacity: 1 - i * 0.15 }}
              />
            ))}
          </div>
        ) : (users || []).length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <Users className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800">No users found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search or role filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr>
                  {["Name / Identity", "Email", "Role", "Linked Entity", "Status", "Registered", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-slate-500 font-semibold text-[11px] uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(users || []).map((u: any) => {
                  const roleBadge = getRoleBadge(u.role);
                  const BadgeIcon = roleBadge.icon;
                  const isCurrentAdmin = u.user_id === currentUser?.userId;

                  return (
                    <tr key={u.user_id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900 block">
                          {u.linked_name || "Admin"}
                        </span>
                        {isCurrentAdmin && (
                          <span className="text-[10px] text-indigo-600 font-medium">
                            (Your Account)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadge.color}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {roleBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 text-xs">
                        {u.role === "CUSTOMER"
                          ? `Customer #${u.customer_id}`
                          : u.role === "DELIVERY_PARTNER"
                          ? `Driver #${u.driver_id}`
                          : "System Administrator"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            u.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {u.is_active ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 font-mono text-[11px]">
                        {u.created_at ? format(new Date(u.created_at), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setResetDialogOpen(true);
                            }}
                            className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-slate-100"
                            title="Reset password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            disabled={isCurrentAdmin || toggleActiveMutation.isPending}
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                userId: u.user_id,
                                is_active: !u.is_active,
                              })
                            }
                            className={`p-1 rounded transition-colors ${
                              isCurrentAdmin
                                ? "opacity-30 cursor-not-allowed text-slate-400"
                                : u.is_active
                                ? "text-slate-500 hover:text-red-600 hover:bg-red-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={
                              isCurrentAdmin
                                ? "Cannot deactivate own logged-in admin account"
                                : u.is_active
                                ? "Deactivate user"
                                : "Activate user"
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialog: Create Partner Account */}
      {createDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">
                Create Delivery Partner Account
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Link to Driver Record *
                </label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select registered driver --</option>
                  {(drivers || []).map((d: any) => (
                    <option key={d.driver_id} value={d.driver_id}>
                      {d.name} &middot; {d.license_number} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Partner Login Email *
                </label>
                <input
                  type="email"
                  value={newPartnerEmail}
                  onChange={(e) => setNewPartnerEmail(e.target.value)}
                  placeholder="driver@partner.local"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                  Temporary Password *
                </label>
                <input
                  type="password"
                  value={newPartnerPassword}
                  onChange={(e) => setNewPartnerPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setCreateDialogOpen(false)}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createPartnerMutation.mutate()}
                disabled={createPartnerMutation.isPending}
                className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
              >
                {createPartnerMutation.isPending ? "Creating..." : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Reset Password */}
      {resetDialogOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                Reset User Password
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Set a new password for <strong className="text-slate-900">{selectedUser.email}</strong>
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-700 block">
                New Password (Min 8 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setResetDialogOpen(false);
                  setSelectedUser(null);
                  setNewPassword("");
                }}
                className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => resetPasswordMutation.mutate()}
                disabled={resetPasswordMutation.isPending}
                className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold disabled:opacity-50"
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Save New Password"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

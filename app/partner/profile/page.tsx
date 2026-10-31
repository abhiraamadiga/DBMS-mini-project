"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Lock, Loader2, KeyRound, ShieldAlert } from "lucide-react";

export default function PartnerProfilePage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["partner-profile-me"],
    queryFn: async () => {
      const res = await fetch("/api/me/profile");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to load data");
      return json.data ?? null;
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }
      if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters");
      }
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update password");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="h-72 rounded-2xl bg-slate-200 animate-pulse" />;
  }

  const details = profile?.details || {};
  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs placeholder:text-slate-400";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Delivery Partner Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Driver identity verification and account credential management
        </p>
      </div>

      {/* Driver Verification Details (Admin-Managed) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-amber-600" />
            Driver Registration Details
          </h3>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
            Managed by Administration
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 block font-medium">Driver Name</span>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">
              {details.name || profile?.name}
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 block font-medium">Account Email</span>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">{profile?.email}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 block font-medium">Contact Phone</span>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">{details.phone || "—"}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] text-slate-500 block font-medium">Driving License Number</span>
            <p className="font-mono font-semibold text-slate-800 text-sm mt-0.5">
              {details.license_number || "Verified"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            To update your phone number, name, or license credentials, please contact the operations administrator.
          </span>
        </div>
      </div>

      {/* Security & Password Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-2xs">
        <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-600" />
          Change Password
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            changePasswordMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                New Password (Min 8 chars)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

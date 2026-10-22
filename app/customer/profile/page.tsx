"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Lock, Save, Loader2, KeyRound } from "lucide-react";

export default function CustomerProfilePage() {
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["customer-profile"],
    queryFn: async () => {
      const res = await fetch("/api/me/profile");
      const json = await res.json();
      return json.data;
    },
  });

  useEffect(() => {
    if (profile?.details) {
      setName(profile.details.name || profile.name || "");
      setPhone(profile.details.phone || "");
      setAddress(profile.details.address || "");
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim(), address: address.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to update profile");
      return json.data;
    },
    onSuccess: () => {
      toast.success("Profile details updated successfully");
      qc.invalidateQueries({ queryKey: ["customer-profile"] });
      qc.invalidateQueries({ queryKey: ["session-me"] });
    },
    onError: (e: any) => toast.error(e.message),
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
      if (!res.ok) throw new Error(json.error?.message || "Failed to change password");
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

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your contact information, delivery address, and login credentials
        </p>
      </div>

      {/* Account Info & Contact Details */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-2xs">
        <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600" />
          Contact Information
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateProfileMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Account Email (Read-Only)
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-xs cursor-not-allowed"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700 block">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91-9876543210"
              required
              className={inputClass}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 block">
              Default Delivery Address
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              required
              className={inputClass}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Profile</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security & Password Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5 shadow-2xs">
        <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-indigo-600" />
          Security & Password
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Changing Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Change Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

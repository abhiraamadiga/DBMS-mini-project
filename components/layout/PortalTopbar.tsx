"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Shield,
  Truck,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface PortalTopbarProps {
  title?: string;
  onOpenSidebar?: () => void;
}

export function PortalTopbar({ title, onOpenSidebar }: PortalTopbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<{
    userId: number;
    email: string;
    role: "ADMIN" | "DELIVERY_PARTNER" | "CUSTOMER";
    name: string;
  } | null>(null);

  const [menuOpen, setMenuOpen] = useState(false);
  const [trackingQuery, setTrackingQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data) setUser(json.data);
      })
      .catch(() => {});
  }, []);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingQuery.trim()) {
      router.push(`/track/${trackingQuery.trim().toUpperCase()}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const getRoleBadge = (role?: string) => {
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

  const badge = getRoleBadge(user?.role);
  const BadgeIcon = badge.icon;

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  const profileHref =
    user?.role === "DELIVERY_PARTNER"
      ? "/partner/profile"
      : user?.role === "CUSTOMER"
      ? "/customer/profile"
      : "/admin/dashboard";

  return (
    <header className="flex items-center gap-4 px-6 py-3.5 border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {onOpenSidebar && (
        <button
          onClick={onOpenSidebar}
          className="lg:hidden text-slate-500 hover:text-slate-800 p-1"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {title && (
        <h1 className="text-base font-semibold text-slate-800 hidden sm:block">
          {title}
        </h1>
      )}

      {/* Global Tracking Search Bar */}
      <div className="flex-1 max-w-md ml-auto sm:ml-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={trackingQuery}
            onChange={(e) => setTrackingQuery(e.target.value)}
            placeholder="Track shipment ID (e.g. SLM2026000001)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50/70 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
          />
        </form>
      </div>

      <div className="flex items-center gap-3">
        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center shadow-xs">
              {initials}
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.name || "Loading..."}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium border ${badge.color}`}
                >
                  <BadgeIcon className="w-2.5 h-2.5" />
                  {badge.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{user?.name}</div>
                <div className="text-slate-500 truncate text-[11px]">{user?.email}</div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${badge.color}`}
                  >
                    <BadgeIcon className="w-2.5 h-2.5" />
                    {badge.label}
                  </span>
                </div>
              </div>

              {user?.role !== "ADMIN" && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push(profileHref);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile Settings</span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors border-t border-slate-100"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

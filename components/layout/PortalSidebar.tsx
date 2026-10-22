"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  UserCheck,
  Building2,
  Route as RouteIcon,
  ShieldAlert,
  History,
  PlusCircle,
  User,
  X,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalSidebarProps {
  role: "ADMIN" | "DELIVERY_PARTNER" | "CUSTOMER";
  onClose?: () => void;
}

export function PortalSidebar({ role, onClose }: PortalSidebarProps) {
  const pathname = usePathname();

  const adminNav = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/shipments", label: "Shipments", icon: Package },
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/drivers", label: "Drivers", icon: UserCheck },
    { href: "/admin/vehicles", label: "Vehicles", icon: Truck },
    { href: "/admin/warehouses", label: "Warehouses", icon: Building2 },
    { href: "/admin/routes", label: "Routes", icon: RouteIcon },
    { href: "/admin/users", label: "Users & Access", icon: ShieldAlert },
    { href: "/admin/activity", label: "Activity Logs", icon: History },
  ];

  const partnerNav = [
    { href: "/partner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/partner/deliveries", label: "My Deliveries", icon: Package },
    { href: "/partner/history", label: "Delivery History", icon: History },
    { href: "/partner/vehicle", label: "My Vehicle", icon: Truck },
    { href: "/partner/profile", label: "Profile", icon: User },
  ];

  const customerNav = [
    { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/customer/book", label: "Book Shipment", icon: PlusCircle },
    { href: "/customer/shipments", label: "My Shipments", icon: Package },
    { href: "/customer/profile", label: "Profile", icon: User },
  ];

  const items =
    role === "ADMIN"
      ? adminNav
      : role === "DELIVERY_PARTNER"
      ? partnerNav
      : customerNav;

  const roleTitle =
    role === "ADMIN"
      ? "Admin Portal"
      : role === "DELIVERY_PARTNER"
      ? "Delivery Portal"
      : "Customer Portal";

  const homeHref =
    role === "ADMIN"
      ? "/admin/dashboard"
      : role === "DELIVERY_PARTNER"
      ? "/partner/dashboard"
      : "/customer/dashboard";

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 w-64 shadow-xs">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <Link href={homeHref} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-slate-900 tracking-tight leading-none">
              SmartLogistics
            </div>
            <div className="text-[10px] text-slate-600 font-medium mt-0.5">
              {roleTitle}
            </div>
          </div>
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-3 mb-2">
          Menu
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== homeHref && pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all group",
                active
                  ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer link to public tracker */}
      <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/50">
        <Link
          href="/"
          className="flex items-center justify-between text-[11px] text-slate-500 hover:text-indigo-600 font-medium transition-colors"
        >
          <span>Public Tracker</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </aside>
  );
}

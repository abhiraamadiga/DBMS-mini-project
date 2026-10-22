"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Users, Truck, UserCheck, Building2, Route,
  X, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shipments", label: "Shipments", icon: Package },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/vehicles", label: "Vehicles", icon: Truck },
  { href: "/drivers", label: "Drivers", icon: UserCheck },
  { href: "/warehouses", label: "Warehouses", icon: Building2 },
  { href: "/routes", label: "Routes", icon: Route },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col h-full bg-[var(--card)] border-r border-[var(--border)] w-64">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[var(--border)]">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center">
            <Package className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base text-[var(--foreground)]">SmartLogistics</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                active
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/20"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              )}
            >
              <Icon className={cn("w-4.5 h-4.5 shrink-0", active ? "text-indigo-400" : "")} />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[var(--border)]">
        <Link href="/" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          ← Back to public site
        </Link>
      </div>
    </aside>
  );
}

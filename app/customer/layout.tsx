"use client";

import { useState } from "react";
import { PortalSidebar } from "@/components/layout/PortalSidebar";
import { PortalTopbar } from "@/components/layout/PortalTopbar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      {/* Mobile drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50 h-full">
            <PortalSidebar
              role="CUSTOMER"
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <PortalSidebar role="CUSTOMER" />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <PortalTopbar
          title="Customer Portal"
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

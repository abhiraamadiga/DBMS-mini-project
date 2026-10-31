"use client";

import { useState, useSyncExternalStore } from "react";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Sidebar } from "./Sidebar";

interface TopbarProps {
  title?: string;
}

const subscribe = () => () => {};

export function Topbar({ title }: TopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-50 h-full">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <header className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
        >
          <Menu className="w-5 h-5" />
        </button>

        {title && (
          <h1 className="text-lg font-semibold text-[var(--foreground)] hidden sm:block">{title}</h1>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all hover:border-indigo-500/50"
          title="Toggle theme"
        >
          {mounted && resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </header>
    </>
  );
}

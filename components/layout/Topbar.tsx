"use client";

import { useState, useEffect } from "react";
import { Menu, Sun, Moon, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { Sidebar } from "./Sidebar";

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-xl border border-[var(--border)] bg-[var(--secondary)] flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all hover:border-indigo-500/50"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {!mounted ? (
            <div className="w-4 h-4" />
          ) : theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </header>
    </>
  );
}

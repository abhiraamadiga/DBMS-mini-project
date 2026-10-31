"use client";

import { apiFetch } from "@/lib/client-api";
import type { Customer } from "@/lib/types";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Eye, X } from "lucide-react";
import Link from "next/link";

function CustomerDialog({ customer, onClose }: { customer?: Customer; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: customer?.name || "", email: customer?.email || "", phone: customer?.phone || "", address: customer?.address || "" });

  const mutation = useMutation({
    mutationFn: async () => {
      const url = customer ? `/api/customers/${customer.customer_id}` : "/api/customers";
      const res = await apiFetch<unknown>(url, { method: customer ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed");
      return json;
    },
    onSuccess: () => { toast.success(customer ? "Customer updated" : "Customer created"); qc.invalidateQueries(); onClose(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{customer ? "Edit Customer" : "New Customer"}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-[var(--muted-foreground)]" /></button>
        </div>
        {[["name","Name","John Doe"],["email","Email","john@example.com"],["phone","Phone","+91 98765 43210"],["address","Address","123 Main St, City"]].map(([field, label, placeholder]) => (
          <div key={field}>
            <label className="text-xs text-[var(--muted-foreground)] block mb-1.5">{label}</label>
            <input value={form[field as keyof typeof form]} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} className={inputClass} />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-all">
            {mutation.isPending ? "Saving..." : customer ? "Save Changes" : "Create"}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-[var(--secondary)] transition-all">Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function CustomersPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<null | "new" | Customer>(null);

  const { data, isLoading } = useQuery({ throwOnError: true,
    queryKey: ["customers", q, page],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: "20", page: String(page) });
      if (q) params.set("q", q);
      const res = await apiFetch<Customer[]>(`/api/customers?${params}`);
      const json = await res.json();
      return json;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiFetch<Customer>(`/api/customers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to delete");
      return json;
    },
    onSuccess: () => { toast.success("Customer deleted"); setPage(1); qc.invalidateQueries(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const customers = data?.data || [];

  return (
    <div className="space-y-5 max-w-6xl">
      {dialog && <CustomerDialog customer={dialog === "new" ? undefined : dialog} onClose={() => setDialog(null)} />}
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold">Customers</h2><p className="text-sm text-[var(--muted-foreground)]">Manage customer accounts</p></div>
        <button onClick={() => setDialog("new")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all">
          <Plus className="w-4 h-4" /> New Customer
        </button>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
        <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search customers..." className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
      </div>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        {isLoading ? <div className="h-64 animate-pulse bg-[var(--secondary)]" /> :
          customers.length === 0 ? <EmptyState title="No customers found" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--secondary)]/40">
                  <tr>{["Name","Email","Phone","Address","Shipments","Actions"].map(h => <th key={h} className="text-left px-4 py-3 text-xs text-[var(--muted-foreground)] font-medium uppercase tracking-wide">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {customers.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-[var(--secondary)]/40 transition-colors">
                      <td className="px-4 py-3 font-medium">{c.name}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.email}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">{c.phone}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)] text-xs max-w-[200px] truncate">{c.address}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs border border-indigo-500/20">{c.total_shipments || 0}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link href={`/customers/${c.customer_id}`} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all" title="View history"><Eye className="w-4 h-4" /></Link>
                          <button onClick={() => setDialog(c)} className="p-1.5 rounded-lg hover:bg-[var(--secondary)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { if (confirm("Delete this customer?")) deleteMutation.mutate(c.customer_id); }}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--muted-foreground)] hover:text-red-400 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
      <div className="flex gap-4 items-center">
        <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} of {Math.max(1, data?.meta?.totalPages || 1)} · {data?.meta?.total || 0} customers</span>
        <button disabled={page >= (data?.meta?.totalPages || 1)} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </div>
  );
}

import React from "react";
import { EmptyState } from "./EmptyState";

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  skeletonRows?: number;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyTitle = "No records found",
  emptyDescription = "No data is currently available",
  onRowClick,
  skeletonRows = 5,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
        <div className="space-y-px">
          {Array.from({ length: skeletonRows }).map((_, i) => (
            <div
              key={i}
              className="h-14 bg-[var(--secondary)] animate-pulse"
              style={{ opacity: 1 - i * 0.15 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--border)] bg-[var(--secondary)]/40">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`text-left px-4 py-3 text-[var(--muted-foreground)] font-medium text-xs uppercase tracking-wide ${col.className || ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {data.map((row, rowIdx) => (
              <tr
                key={String(row.id || row.shipment_id || row.customer_id || row.vehicle_id || row.driver_id || row.warehouse_id || row.route_id || rowIdx)}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${onRowClick ? "hover:bg-[var(--secondary)]/40 cursor-pointer" : "hover:bg-[var(--secondary)]/20"}`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3.5 ${col.className || ""}`}>
                    {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? "") : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

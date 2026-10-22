import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  BOOKED: { label: "Booked", className: "bg-slate-500/15 text-slate-400 border-slate-500/25" },
  PICKED_UP: { label: "Picked Up", className: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  IN_TRANSIT: { label: "In Transit", className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
  AT_WAREHOUSE: { label: "At Warehouse", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
  DELIVERED: { label: "Delivered", className: "bg-green-500/15 text-green-400 border-green-500/25" },
  CANCELLED: { label: "Cancelled", className: "bg-gray-500/15 text-gray-400 border-gray-500/25" },
  DELAYED: { label: "Delayed", className: "bg-red-500/15 text-red-400 border-red-500/25" },
};

interface StatusBadgeProps {
  status: string;
  isDelayed?: boolean;
  size?: "sm" | "md";
}

export function StatusBadge({ status, isDelayed, size = "md" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-500/15 text-gray-400 border-gray-500/25" };
  const delayedConfig = STATUS_CONFIG["DELAYED"];

  const sizeClass = size === "sm" ? "text-xs px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-flex items-center rounded-full border font-medium", sizeClass, config.className)}>
        {config.label}
      </span>
      {isDelayed && status !== "CANCELLED" && status !== "DELIVERED" && (
        <span className={cn("inline-flex items-center rounded-full border font-medium", sizeClass, delayedConfig.className)}>
          {delayedConfig.label}
        </span>
      )}
    </span>
  );
}

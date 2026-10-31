import { Package } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function EmptyState({ title = "No results found", description = "There's nothing here yet.", icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center mb-4 text-[var(--muted-foreground)]">
        {icon || <Package className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-semibold text-[var(--foreground)] mb-1">{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)] max-w-xs">{description}</p>
    </div>
  );
}

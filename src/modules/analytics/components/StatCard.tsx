import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { AppCard } from "@/shared/components/layout";

export interface StatCardProps {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly tone?: "default" | "success" | "warning" | "danger";
}

const TONE = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-destructive/10 text-destructive",
} as const;

/** Single KPI tile used across every analytics dashboard. */
export function StatCard({ icon: Icon, label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <AppCard>
      <div className="flex min-w-0 items-start gap-md">
        <span
          aria-hidden="true"
          className={cn("grid size-10 shrink-0 place-items-center rounded-lg", TONE[tone])}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-caption text-text-secondary">{label}</p>
          <p className="text-h3 text-text-primary">{value}</p>
          {hint && <p className="mt-xs text-caption text-text-secondary">{hint}</p>}
        </div>
      </div>
    </AppCard>
  );
}

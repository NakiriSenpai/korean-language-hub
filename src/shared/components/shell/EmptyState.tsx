import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly action?: ReactNode;
  readonly className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-sm rounded-lg border border-dashed border-border bg-surface px-md py-2xl text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-full bg-muted text-text-secondary"
      >
        <Icon className="size-6" />
      </span>
      <h3 className="text-title text-text-primary">{title}</h3>
      <p className="max-w-md text-body-sm text-text-secondary">{description}</p>
      {action}
    </div>
  );
}

import type { LucideIcon } from "lucide-react";

import { AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell/EmptyState";

export interface PlaceholderPageProps {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
}

/** Consistent placeholder used by every shell route until its sprint lands. */
export function PlaceholderPage({
  icon: Icon,
  title,
  description,
  emptyTitle,
  emptyDescription,
}: PlaceholderPageProps) {
  return (
    <Stack gap="xl">
      <header className="flex min-w-0 items-start gap-md">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
        >
          <Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-h2 text-text-primary">{title}</h2>
          <p className="mt-xs text-body-sm text-text-secondary">{description}</p>
        </div>
      </header>

      <AppSection>
        <EmptyState icon={Icon} title={emptyTitle} description={emptyDescription} />
      </AppSection>
    </Stack>
  );
}

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { APP_META } from "@/shared/constants";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { AppLogo } from "@/shared/components/shell/AppLogo";

export interface AppHeaderProps {
  readonly title: string;
  readonly actions?: React.ReactNode;
  readonly sidebarOpen: boolean;
  readonly onToggleSidebar: () => void;
  readonly className?: string;
}

export function AppHeader({
  title,
  actions,
  sidebarOpen,
  onToggleSidebar,
  className,
}: AppHeaderProps) {
  const ToggleIcon = sidebarOpen ? PanelLeftClose : PanelLeftOpen;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 w-full border-b border-border bg-surface/95 backdrop-blur",
        className,
      )}
    >
      <div className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-md px-md sm:px-lg">
        <div className="flex min-w-0 items-center gap-sm">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-expanded={sidebarOpen}
            aria-controls="app-sidebar"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className={cn(
              "hidden size-11 shrink-0 items-center justify-center rounded-md text-text-secondary lg:inline-flex",
              "transition-all motion-fast hover:bg-muted hover:text-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            <ToggleIcon className="size-5" aria-hidden="true" />
          </button>

          <AppLogo className="lg:hidden" />

          <div className="min-w-0">
            <h1 className="truncate text-title text-text-primary">{title}</h1>
            <p className="hidden truncate text-caption text-text-secondary sm:block">
              {APP_META.shortName}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-sm">
          {actions}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

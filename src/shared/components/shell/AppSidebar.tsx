import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { APP_META } from "@/shared/constants";
import { NAV_ITEMS } from "@/shared/navigation/nav-items";
import { AppLogo } from "@/shared/components/shell/AppLogo";

export interface AppSidebarProps {
  readonly open: boolean;
  readonly className?: string;
}

/** Desktop navigation rail. Hidden below the `lg` breakpoint. */
export function AppSidebar({ open, className }: AppSidebarProps) {
  return (
    <aside
      id="app-sidebar"
      aria-label="Main navigation"
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface lg:flex",
        "transition-all motion-normal",
        open ? "w-64" : "w-20",
        className,
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-border px-md")}>
        <AppLogo showWordmark={open} />
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-xs overflow-y-auto p-sm">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            activeOptions={{ exact: item.exact }}
            title={open ? undefined : item.label}
            className={cn(
              "group flex min-h-11 items-center gap-sm rounded-md px-sm text-body-sm",
              "text-text-secondary transition-all motion-fast",
              "hover:bg-muted hover:text-text-primary",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "data-[status=active]:bg-primary data-[status=active]:text-primary-foreground",
              !open && "justify-center px-0",
            )}
          >
            <item.icon className="size-5 shrink-0" aria-hidden="true" />
            {open ? (
              <span className="min-w-0 truncate">{item.label}</span>
            ) : (
              <span className="sr-only">{item.label}</span>
            )}
          </Link>
        ))}
      </nav>

      {open && (
        <div className="border-t border-border p-md">
          <p className="text-caption text-text-secondary">
            {APP_META.shortName} v{APP_META.version}
          </p>
        </div>
      )}
    </aside>
  );
}

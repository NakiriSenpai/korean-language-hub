import { Link } from "@tanstack/react-router";

import { cn } from "@/lib/utils";
import { PRIMARY_NAV_ITEMS } from "@/shared/navigation/nav-items";

export interface BottomNavProps {
  readonly className?: string;
}

/** Mobile & tablet navigation. Hidden from the `lg` breakpoint up. */
export function BottomNav({ className }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <ul className="flex items-stretch justify-between px-xs">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <li key={item.id} className="min-w-0 flex-1">
            <Link
              to={item.to}
              activeOptions={{ exact: item.exact }}
              className={cn(
                "flex min-h-14 w-full min-w-11 flex-col items-center justify-center gap-xs rounded-md px-xs py-xs",
                "text-caption text-text-secondary transition-all motion-fast",
                "hover:text-text-primary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "data-[status=active]:text-primary data-[status=active]:font-semibold",
              )}
            >
              <item.icon className="size-5 shrink-0" aria-hidden="true" />
              <span className="w-full truncate text-center">{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

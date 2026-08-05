import { cn } from "@/lib/utils";
import { APP_META } from "@/shared/constants";

export interface AppLogoProps {
  readonly className?: string;
  readonly showWordmark?: boolean;
}

export function AppLogo({ className, showWordmark = false }: AppLogoProps) {
  return (
    <span className={cn("flex min-w-0 items-center gap-sm", className)}>
      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-title text-primary-foreground"
      >
        한
      </span>
      {showWordmark && (
        <span className="min-w-0 truncate text-title text-text-primary">{APP_META.shortName}</span>
      )}
      <span className="sr-only">{APP_META.name}</span>
    </span>
  );
}

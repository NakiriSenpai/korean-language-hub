import { cn } from "@/lib/utils";
import { APP_META } from "@/shared/constants";
import { AppLogo } from "@/shared/components/shell/AppLogo";

export interface SplashScreenProps {
  readonly className?: string;
}

/** First-paint branding screen. Token-driven, no heavy animation. */
export function SplashScreen({ className }: SplashScreenProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center gap-md bg-background",
        "animate-in fade-in motion-reduce:animate-none",
        className,
      )}
    >
      <AppLogo />
      <div className="flex flex-col items-center gap-xs text-center">
        <p className="text-h4 text-text-primary">{APP_META.name}</p>
        <p className="text-body-sm text-text-secondary">{APP_META.description}</p>
      </div>
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none"
      />
      <span className="sr-only">Loading application</span>
    </div>
  );
}

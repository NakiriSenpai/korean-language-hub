import { cn } from "@/lib/utils";

export interface LoadingProps {
  readonly label?: string;
  readonly fullscreen?: boolean;
  readonly className?: string;
}

export function Loading({ label = "Loading…", fullscreen = false, className }: LoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 text-muted-foreground",
        fullscreen ? "min-h-screen w-full bg-background" : "p-6",
        className,
      )}
    >
      <span className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

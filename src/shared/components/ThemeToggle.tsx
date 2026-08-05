import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { THEMES, type ThemeName } from "@/shared/constants";
import { useTheme } from "@/shared/theme";

const ICONS: Record<ThemeName, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABELS: Record<ThemeName, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

export interface ThemeToggleProps {
  readonly className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        "inline-flex shrink-0 items-center gap-xs rounded-full border border-border bg-surface p-xs",
        className,
      )}
    >
      {THEMES.map((name) => {
        const Icon = ICONS[name];
        const active = theme === name;
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={LABELS[name]}
            onClick={() => setTheme(name)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-full transition-all motion-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-primary text-primary-foreground"
                : "text-text-secondary hover:bg-muted hover:text-text-primary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

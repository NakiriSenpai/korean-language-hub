import { createFileRoute } from "@tanstack/react-router";

import {
  AppCard,
  AppPage,
  AppSection,
  Grid,
  Stack,
} from "@/shared/components/layout";
import { ThemeToggle } from "@/shared/components/ThemeToggle";
import { appConfig } from "@/shared/config/app.config";
import { APP_META } from "@/shared/constants";
import {
  MOTION_TOKENS,
  RADIUS_TOKENS,
  SHADOW_TOKENS,
  SPACING_TOKENS,
  TYPOGRAPHY_TOKENS,
  typographyClass,
} from "@/shared/design/tokens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hangeul LPK — Design System Foundation" },
      {
        name: "description",
        content:
          "Design token reference for the Hangeul LPK platform: color, typography, spacing, radius, shadow, and motion tokens with theme engine.",
      },
      { property: "og:title", content: "Hangeul LPK — Design System Foundation" },
      {
        property: "og:description",
        content:
          "Sprint 0.2 foundation: theme engine, design tokens, and reusable layout primitives.",
      },
    ],
  }),
  component: DesignSystemPage,
});

const COLOR_SWATCHES: readonly { name: string; className: string }[] = [
  { name: "primary", className: "bg-primary text-primary-foreground" },
  { name: "secondary", className: "bg-secondary text-secondary-foreground" },
  { name: "accent", className: "bg-accent text-accent-foreground" },
  { name: "background", className: "bg-background text-foreground border border-border" },
  { name: "surface", className: "bg-surface text-surface-foreground border border-border" },
  { name: "card", className: "bg-card text-card-foreground border border-border" },
  { name: "muted", className: "bg-muted text-muted-foreground" },
  { name: "success", className: "bg-success text-success-foreground" },
  { name: "warning", className: "bg-warning text-warning-foreground" },
  { name: "error", className: "bg-error text-error-foreground" },
  { name: "info", className: "bg-info text-info-foreground" },
  { name: "border", className: "bg-background text-text-primary border-4 border-border" },
];

const RADIUS_CLASS: Record<string, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

const SHADOW_CLASS: Record<string, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const SPACING_CLASS: Record<string, string> = {
  xs: "h-xs",
  sm: "h-sm",
  md: "h-md",
  lg: "h-lg",
  xl: "h-xl",
  "2xl": "h-2xl",
  "3xl": "h-3xl",
};

const MOTION_CLASS: Record<string, string> = {
  fast: "motion-fast",
  normal: "motion-normal",
  slow: "motion-slow",
};

function DesignSystemPage() {
  return (
    <AppPage width="lg">
      <Stack gap="2xl">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-md sm:flex sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-xs">
            <p className="text-caption uppercase tracking-widest text-text-secondary">
              Sprint 0.2 · Design System
            </p>
            <h1 className="truncate text-h1 text-text-primary">{APP_META.name}</h1>
            <p className="text-body-sm text-text-secondary">
              v{appConfig.version} · {appConfig.environment}
            </p>
          </div>
          <ThemeToggle />
        </header>

        <AppSection title="Color" description="Semantic color tokens, light & dark aware.">
          <Grid cols={2} smCols={3} lgCols={4} gap="md">
            {COLOR_SWATCHES.map((swatch) => (
              <div
                key={swatch.name}
                className={`flex h-20 items-end rounded-lg p-sm text-caption ${swatch.className}`}
              >
                {swatch.name}
              </div>
            ))}
          </Grid>
        </AppSection>

        <AppSection title="Typography" description="Consistent type scale from display to caption.">
          <AppCard>
            <Stack gap="sm">
              {TYPOGRAPHY_TOKENS.map((token) => (
                <div key={token} className="flex min-w-0 flex-col gap-xs">
                  <span className="text-caption text-text-secondary">{token}</span>
                  <span className={`${typographyClass[token]} text-text-primary`}>
                    Hangeul LPK Platform
                  </span>
                </div>
              ))}
            </Stack>
          </AppCard>
        </AppSection>

        <AppSection title="Spacing" description="The only allowed spacing steps.">
          <AppCard>
            <Stack gap="sm">
              {SPACING_TOKENS.map((token) => (
                <div key={token} className="flex items-center gap-md">
                  <span className="w-10 shrink-0 text-caption text-text-secondary">{token}</span>
                  <span className={`w-full rounded-sm bg-primary/70 ${SPACING_CLASS[token]}`} />
                </div>
              ))}
            </Stack>
          </AppCard>
        </AppSection>

        <AppSection title="Radius & Shadow" description="Surface geometry and elevation.">
          <Grid cols={2} smCols={3} lgCols={3} gap="md">
            {RADIUS_TOKENS.map((token) => (
              <div
                key={token}
                className={`flex h-20 items-center justify-center border border-border bg-surface text-caption text-text-secondary ${RADIUS_CLASS[token]}`}
              >
                radius {token}
              </div>
            ))}
            {SHADOW_TOKENS.map((token) => (
              <AppCard key={token} shadow={token} padding="md" className="flex h-20 items-center justify-center">
                <span className="text-caption text-text-secondary">shadow {token}</span>
              </AppCard>
            ))}
          </Grid>
        </AppSection>

        <AppSection title="Motion" description="Hover a tile to feel each duration token.">
          <Grid cols={1} smCols={3} lgCols={3} gap="md">
            {MOTION_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                className={`rounded-lg border border-border bg-surface p-lg text-body-sm text-text-primary transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${MOTION_CLASS[token]}`}
              >
                motion {token}
              </button>
            ))}
          </Grid>
        </AppSection>
      </Stack>
    </AppPage>
  );
}

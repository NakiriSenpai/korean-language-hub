import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { RadiusToken, ShadowToken, SpacingToken } from "@/shared/design/tokens";

/* ------------------------------------------------------------------ */
/* Token maps (static strings so Tailwind can detect the classes)      */
/* ------------------------------------------------------------------ */

const GAP: Record<SpacingToken, string> = {
  xs: "gap-xs",
  sm: "gap-sm",
  md: "gap-md",
  lg: "gap-lg",
  xl: "gap-xl",
  "2xl": "gap-2xl",
  "3xl": "gap-3xl",
};

const PADDING: Record<SpacingToken | "none", string> = {
  none: "p-0",
  xs: "p-xs",
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg",
  xl: "p-xl",
  "2xl": "p-2xl",
  "3xl": "p-3xl",
};

const RADIUS: Record<RadiusToken | "none", string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

const SHADOW: Record<ShadowToken, string> = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

const MAX_WIDTH = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  full: "max-w-full",
} as const;

export type ContainerWidth = keyof typeof MAX_WIDTH;

/* ------------------------------------------------------------------ */
/* AppContainer — horizontal rhythm, mobile first                      */
/* ------------------------------------------------------------------ */

export interface AppContainerProps {
  readonly children: ReactNode;
  readonly width?: ContainerWidth;
  readonly className?: string;
  readonly as?: ElementType;
}

export function AppContainer({
  children,
  width = "lg",
  className,
  as: Tag = "div",
}: AppContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-md sm:px-lg", MAX_WIDTH[width], className)}>
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* AppPage — page shell with vertical rhythm                           */
/* ------------------------------------------------------------------ */

export interface AppPageProps {
  readonly children: ReactNode;
  readonly width?: ContainerWidth;
  readonly className?: string;
}

export function AppPage({ children, width = "lg", className }: AppPageProps) {
  return (
    <main className="min-h-dvh w-full bg-background text-foreground">
      <AppContainer width={width} className={cn("py-xl sm:py-2xl", className)}>
        {children}
      </AppContainer>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* AppSection — labelled block of content                              */
/* ------------------------------------------------------------------ */

export interface AppSectionProps {
  readonly children: ReactNode;
  readonly title?: string;
  readonly description?: string;
  readonly actions?: ReactNode;
  readonly gap?: SpacingToken;
  readonly className?: string;
}

export function AppSection({
  children,
  title,
  description,
  actions,
  gap = "md",
  className,
}: AppSectionProps) {
  return (
    <section className={cn("flex w-full flex-col", GAP[gap], className)}>
      {(title || description || actions) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-md sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-col gap-xs">
            {title && <h2 className="truncate text-h3 text-text-primary">{title}</h2>}
            {description && <p className="text-body-sm text-text-secondary">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* AppCard — surface primitive                                         */
/* ------------------------------------------------------------------ */

export interface AppCardProps {
  readonly children: ReactNode;
  readonly padding?: SpacingToken | "none";
  readonly radius?: RadiusToken | "none";
  readonly shadow?: ShadowToken;
  readonly interactive?: boolean;
  readonly className?: string;
  readonly as?: ElementType;
}

export function AppCard({
  children,
  padding = "lg",
  radius = "lg",
  shadow = "sm",
  interactive = false,
  className,
  as: Tag = "div",
}: AppCardProps) {
  return (
    <Tag
      className={cn(
        "border border-border bg-card text-card-foreground",
        PADDING[padding],
        RADIUS[radius],
        SHADOW[shadow],
        interactive && "transition-all motion-normal hover:shadow-md focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Stack — one-dimensional layout                                      */
/* ------------------------------------------------------------------ */

const DIRECTION = {
  vertical: "flex-col",
  horizontal: "flex-row",
  "responsive-row": "flex-col sm:flex-row",
} as const;

const ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

export interface StackProps {
  readonly children: ReactNode;
  readonly direction?: keyof typeof DIRECTION;
  readonly gap?: SpacingToken;
  readonly align?: keyof typeof ALIGN;
  readonly justify?: keyof typeof JUSTIFY;
  readonly wrap?: boolean;
  readonly className?: string;
  readonly as?: ElementType;
}

export function Stack({
  children,
  direction = "vertical",
  gap = "md",
  align = "stretch",
  justify = "start",
  wrap = false,
  className,
  as: Tag = "div",
}: StackProps) {
  return (
    <Tag
      className={cn(
        "flex min-w-0",
        DIRECTION[direction],
        GAP[gap],
        ALIGN[align],
        JUSTIFY[justify],
        wrap && "flex-wrap",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------------ */
/* Grid — responsive, mobile first                                     */
/* ------------------------------------------------------------------ */

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

const SM_COLS = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
} as const;

const LG_COLS = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
} as const;

export type GridColumns = keyof typeof COLS;

export interface GridProps {
  readonly children: ReactNode;
  /** columns on small phones */
  readonly cols?: GridColumns;
  /** columns from 640px (large phones) */
  readonly smCols?: GridColumns;
  /** columns from 1024px (tablet landscape / desktop) */
  readonly lgCols?: GridColumns;
  readonly gap?: SpacingToken;
  readonly className?: string;
  readonly as?: ElementType;
}

export function Grid({
  children,
  cols = 1,
  smCols = 2,
  lgCols = 3,
  gap = "md",
  className,
  as: Tag = "div",
}: GridProps) {
  return (
    <Tag className={cn("grid w-full", COLS[cols], SM_COLS[smCols], LG_COLS[lgCols], GAP[gap], className)}>
      {children}
    </Tag>
  );
}

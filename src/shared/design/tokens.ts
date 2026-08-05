/**
 * Design tokens — typed mirror of the CSS custom properties in src/styles.css.
 *
 * Components must reference these token names (or the Tailwind utilities they
 * generate) instead of hardcoded values.
 */

export const COLOR_TOKENS = [
  "primary",
  "secondary",
  "accent",
  "background",
  "surface",
  "card",
  "border",
  "muted",
  "success",
  "warning",
  "error",
  "info",
  "text-primary",
  "text-secondary",
  "text-disabled",
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

export const TYPOGRAPHY_TOKENS = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "title",
  "subtitle",
  "body-lg",
  "body",
  "body-sm",
  "caption",
] as const;
export type TypographyToken = (typeof TYPOGRAPHY_TOKENS)[number];

/** Tailwind text utility for each typography token. */
export const typographyClass: Record<TypographyToken, string> = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  h4: "text-h4",
  title: "text-title",
  subtitle: "text-subtitle",
  "body-lg": "text-body-lg",
  body: "text-body",
  "body-sm": "text-body-sm",
  caption: "text-caption",
};

export const SPACING_TOKENS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;
export type SpacingToken = (typeof SPACING_TOKENS)[number];

export const RADIUS_TOKENS = ["sm", "md", "lg", "xl", "2xl", "full"] as const;
export type RadiusToken = (typeof RADIUS_TOKENS)[number];

export const SHADOW_TOKENS = ["none", "sm", "md", "lg"] as const;
export type ShadowToken = (typeof SHADOW_TOKENS)[number];

export const MOTION_TOKENS = ["fast", "normal", "slow"] as const;
export type MotionToken = (typeof MOTION_TOKENS)[number];

export const motionClass: Record<MotionToken, string> = {
  fast: "transition-all motion-fast",
  normal: "transition-all motion-normal",
  slow: "transition-all motion-slow",
};

export const BREAKPOINTS = {
  /** small Android phones */
  xs: 360,
  /** large Android phones */
  sm: 640,
  /** tablets */
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

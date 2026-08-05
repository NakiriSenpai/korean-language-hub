/**
 * Engine 1 — Security hardening.
 *
 * Produces the response headers applied to every document served by the edge
 * worker. The policy is intentionally conservative but PWA-safe: the service
 * worker, manifest, and offline shell are all same-origin, so `'self'` covers
 * them without any extra allowance.
 */

export interface SecurityHeaderOptions {
  /** Supabase project origin — required for auth/PostgREST/Realtime traffic. */
  readonly supabaseUrl?: string | undefined;
  /** Relax `upgrade-insecure-requests` and HSTS for local development. */
  readonly isProduction?: boolean;
}

const CLOUDINARY_IMAGE = "https://res.cloudinary.com";
const CLOUDINARY_API = "https://api.cloudinary.com";

const origin = (value: string | undefined): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const websocket = (httpOrigin: string): string => httpOrigin.replace(/^http/, "ws");

/** Builds the Content-Security-Policy string. */
export function buildContentSecurityPolicy(options: SecurityHeaderOptions = {}): string {
  const supabase = origin(options.supabaseUrl);
  const connect = ["'self'", CLOUDINARY_API];
  if (supabase) connect.push(supabase, websocket(supabase));

  const directives: readonly string[] = [
    "default-src 'self'",
    // TanStack Start streams hydration data through inline bootstrap scripts and
    // the theme FOUC guard runs inline; both are build-authored, not user input.
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${CLOUDINARY_IMAGE}`,
    `media-src 'self' blob: ${CLOUDINARY_IMAGE}`,
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(options.isProduction ? ["upgrade-insecure-requests"] : []),
  ];

  return directives.join("; ");
}

/** Full set of security headers for HTML documents. */
export function buildSecurityHeaders(options: SecurityHeaderOptions = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "content-security-policy": buildContentSecurityPolicy(options),
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "interest-cohort=()",
    ].join(", "),
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "x-permitted-cross-domain-policies": "none",
  };

  if (options.isProduction) {
    headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  }

  return headers;
}

/**
 * Applies the security headers to a response without clobbering headers the
 * framework already set (e.g. `content-type`, cache directives).
 */
export function withSecurityHeaders(
  response: Response,
  options: SecurityHeaderOptions = {},
): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(buildSecurityHeaders(options))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

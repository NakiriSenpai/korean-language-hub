// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        // Registration is owned by src/shared/pwa/register.ts (guarded wrapper).
        injectRegister: null,
        filename: "sw.js",
        // The client build is emitted to dist/client — keep the worker next to it.
        outDir: "dist/client",

        // The manifest is authored by hand in public/manifest.webmanifest.
        manifest: false,
        devOptions: { enabled: false },
        includeAssets: ["favicon.png", "apple-touch-icon.png", "offline.html", "icons/*.png"],
        workbox: {
          // HTML is never precached: navigations go to the network and fall back to offline.html.
          globPatterns: ["**/*.{js,css,svg,png,ico,woff2}"],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: false,
          navigateFallback: "/offline.html",
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//, /^\/_serverFn\//],
          runtimeCaching: [
            {
              // Same-origin hashed build assets.
              urlPattern: ({ url, request, sameOrigin }) =>
                sameOrigin &&
                !url.pathname.startsWith("/api/") &&
                (request.destination === "script" ||
                  request.destination === "style" ||
                  request.destination === "font" ||
                  request.destination === "image"),
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  },
});

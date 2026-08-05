import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  // A fresh client per request: a module-level singleton would leak cached
  // tenant data between SSR requests.
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Tenant-scoped reads are stable for a short while; this removes the
        // duplicate refetch every remount used to trigger.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        retry: 1,
      },
      mutations: { retry: 0 },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 80,
    defaultPreloadStaleTime: 0,
  });


  return router;
};

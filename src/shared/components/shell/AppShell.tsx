import { Outlet, useHydrated, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { AppContainer } from "@/shared/components/layout";
import { AppHeader } from "@/shared/components/shell/AppHeader";
import { AppSidebar } from "@/shared/components/shell/AppSidebar";
import { BottomNav } from "@/shared/components/shell/BottomNav";
import { RouteLoading } from "@/shared/components/shell/RouteLoading";
import { SplashScreen } from "@/shared/components/shell/SplashScreen";
import { NAV_ITEMS } from "@/shared/navigation/nav-items";
import { APP_META, STORAGE_KEYS } from "@/shared/constants";

const SPLASH_DURATION_MS = 700;
const SPLASH_KEY = `${STORAGE_KEYS.theme.split(".")[0] ?? "app"}.splash-seen`;

function titleForPath(pathname: string): string {
  const match = NAV_ITEMS.filter((item) => !item.exact).find((item) =>
    pathname.startsWith(item.to),
  );
  if (match) return match.label;
  if (pathname === "/") return "Dashboard";
  return APP_META.shortName;
}

function useSplash(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.sessionStorage.getItem(SPLASH_KEY) === "1") return;
    setVisible(true);
    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(SPLASH_KEY, "1");
      setVisible(false);
    }, SPLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return visible;
}

/**
 * Root application shell: header, navigation, content, overlay + toast roots.
 * Single responsive system — no separate mobile/desktop trees.
 */
export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const splashVisible = useSplash();
  const { pathname, isLoading } = useRouterState({
    select: (state) => ({
      pathname: state.location.pathname,
      isLoading: state.status === "pending",
    }),
  });

  return (
    <div className="flex min-h-dvh w-full bg-background text-foreground">
      <a
        href="#app-main"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:left-md focus:top-md focus:z-50",
          "focus:rounded-md focus:bg-primary focus:px-md focus:py-sm focus:text-body-sm focus:text-primary-foreground",
        )}
      >
        Lewati ke konten utama
      </a>

      <AppSidebar open={sidebarOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          title={titleForPath(pathname)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
        />

        <main id="app-main" className="min-w-0 flex-1 pb-24 lg:pb-0">
          <AppContainer width="xl" className="py-lg sm:py-xl">
            {isLoading ? (
              <RouteLoading />
            ) : (
              <div
                key={pathname}
                className="animate-in fade-in duration-200 motion-reduce:animate-none"
              >
                <Outlet />
              </div>
            )}
          </AppContainer>
        </main>
      </div>

      <BottomNav />

      {/* Overlay area: portal target for shell-level dialogs and sheets. */}
      <div id="dialog-root" className="contents" />
      {/* Toast root */}
      <Toaster />

      {splashVisible && <SplashScreen />}
    </div>
  );
}

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { cn } from "@/lib/utils";
import { ANALYTICS_PERMISSIONS } from "@/modules/analytics";
import { PermissionGate } from "@/modules/identity";
import { Stack } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics & Insights — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Laporan performa peserta, asesmen, kelas, dan lembaga dengan filter gelombang serta ekspor Excel, PDF, dan CSV.",
      },
      { property: "og:title", content: "Analytics & Insights — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Dashboard laporan pembelajaran dan ujian EPS-TOPIK dengan ekspor multi-format.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsLayout,
});

const TABS = [
  { to: "/analytics", label: "Peserta", exact: true },
  { to: "/analytics/assessments", label: "Asesmen", exact: false },
  { to: "/analytics/classes", label: "Kelas & Pengajar", exact: false },
  { to: "/analytics/platform", label: "Lembaga", exact: false },
] as const;

function AnalyticsLayout() {
  return (
    <PermissionGate required={[ANALYTICS_PERMISSIONS.read]}>
      <Stack gap="xl">
        <header className="flex min-w-0 items-start gap-md">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <BarChart3 className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-h2 text-text-primary">Analytics &amp; Insights</h2>
            <p className="mt-xs text-body-sm text-text-secondary">
              Laporan dibaca langsung dari data akademik, pembelajaran, dan hasil ujian. Semua angka
              mengikuti filter yang aktif dan dapat diekspor ke Excel, PDF, atau CSV.
            </p>
          </div>
        </header>

        <nav aria-label="Navigasi analytics" className="-mx-md overflow-x-auto px-md">
          <ul className="flex min-w-max gap-xs">
            {TABS.map((tab) => (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  activeOptions={{ exact: tab.exact }}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md px-md text-body-sm text-text-secondary",
                    "transition-colors motion-fast hover:bg-muted",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  )}
                  activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Outlet />
      </Stack>
    </PermissionGate>
  );
}

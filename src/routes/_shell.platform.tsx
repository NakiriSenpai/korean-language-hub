import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { PermissionGate } from "@/modules/identity";
import { PLATFORM_PERMISSIONS } from "@/modules/platform";
import { Stack } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/platform")({
  head: () => ({
    meta: [
      { title: "Administrasi Platform — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Konsol administrasi: lembaga, pengguna, branding, pengaturan sistem, jejak audit, pengumuman, media, dan CMS.",
      },
      { property: "og:title", content: "Administrasi Platform — Hangeul LPK Platform" },
      {
        property: "og:description",
        content:
          "Kelola lembaga, peran pengguna, identitas visual, serta konten pengumuman dan halaman dari satu konsol.",
      },
    ],
  }),
  component: PlatformLayout,
});

const linkClass = cn(
  "inline-flex min-h-11 items-center rounded-md px-md text-body-sm text-text-secondary",
  "transition-colors motion-fast hover:bg-muted",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

const activeProps = { className: "bg-primary/10 text-primary font-medium" };

const TABS = [
  { to: "/platform", label: "Konsol", exact: true },
  { to: "/platform/tenants", label: "Lembaga" },
  { to: "/platform/users", label: "Pengguna" },
  { to: "/platform/branding", label: "Branding" },
  { to: "/platform/settings", label: "Pengaturan" },
  { to: "/platform/audit", label: "Audit" },
  { to: "/platform/announcements", label: "Pengumuman" },
  { to: "/platform/media", label: "Media" },
  { to: "/platform/cms", label: "CMS" },
] as const;

function PlatformLayout() {
  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.read]}>
      <Stack gap="xl">
        <header className="flex min-w-0 items-start gap-md">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <ShieldCheck className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-h2 text-text-primary">Administrasi Platform</h2>
            <p className="mt-xs text-body-sm text-text-secondary">
              Pusat kendali lembaga: struktur organisasi, identitas visual, konfigurasi sistem,
              konten publik, dan jejak audit yang tidak dapat diubah.
            </p>
          </div>
        </header>

        <nav aria-label="Navigasi administrasi" className="-mx-md overflow-x-auto px-md">
          <ul className="flex min-w-max gap-xs">
            {TABS.map((tab) => (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  activeOptions={tab.exact ? { exact: true } : undefined}
                  className={linkClass}
                  activeProps={activeProps}
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

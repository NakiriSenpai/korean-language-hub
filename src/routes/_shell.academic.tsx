import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { CalendarRange } from "lucide-react";

import { cn } from "@/lib/utils";
import { ACADEMIC_PERMISSIONS } from "@/modules/academic";
import { PermissionGate } from "@/modules/identity";
import { Stack } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/academic")({
  component: AcademicLayout,
});

const TABS = [
  { to: "/academic", label: "Periode", exact: true },
  { to: "/academic/groups", label: "Kelas", exact: false },
  { to: "/academic/students", label: "Peserta", exact: false },
  { to: "/academic/enrollments", label: "Pendaftaran", exact: false },
  { to: "/academic/teachers", label: "Pengajar", exact: false },
] as const;

function AcademicLayout() {
  return (
    <PermissionGate required={[ACADEMIC_PERMISSIONS.read]}>
      <Stack gap="xl">
        <header className="flex min-w-0 items-start gap-md">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <CalendarRange className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-h2 text-text-primary">Academic</h2>
            <p className="mt-xs text-body-sm text-text-secondary">
              Kelola periode akademik, kelas, peserta, pendaftaran, dan penugasan pengajar.
            </p>
          </div>
        </header>

        <nav aria-label="Navigasi academic" className="-mx-md overflow-x-auto px-md">
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

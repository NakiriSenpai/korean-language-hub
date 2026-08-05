import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";
import { PermissionGate } from "@/modules/identity";
import { LEARNING_PERMISSIONS } from "@/modules/learning";
import { Stack } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/learning")({
  head: () => ({
    meta: [
      { title: "Learning — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Course, module, lesson, dan unit belajar bahasa Korea lengkap dengan progress dan bookmark.",
      },
      { property: "og:title", content: "Learning — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Belajar terstruktur dari course hingga unit dengan progress tersimpan otomatis.",
      },
    ],
  }),
  component: LearningLayout,
});

const TABS = [
  { to: "/learning", label: "Course", exact: true },
  { to: "/learning/continue", label: "Lanjutkan", exact: false },
  { to: "/learning/bookmarks", label: "Bookmark", exact: false },
] as const;

function LearningLayout() {
  return (
    <PermissionGate required={[LEARNING_PERMISSIONS.read]}>
      <Stack gap="xl">
        <header className="flex min-w-0 items-start gap-md">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <BookOpen className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-h2 text-text-primary">Learning</h2>
            <p className="mt-xs text-body-sm text-text-secondary">
              Struktur belajar Course → Module → Lesson → Unit → Block, lengkap dengan progress,
              bookmark, dan lanjut belajar.
            </p>
          </div>
        </header>

        <nav aria-label="Navigasi learning" className="-mx-md overflow-x-auto px-md">
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

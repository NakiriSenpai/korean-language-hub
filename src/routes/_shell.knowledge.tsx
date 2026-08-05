import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Library } from "lucide-react";

import { cn } from "@/lib/utils";
import { PermissionGate } from "@/modules/identity";
import { KNOWLEDGE_KINDS, KNOWLEDGE_PERMISSIONS } from "@/modules/knowledge";
import { Stack } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Pusat materi bahasa Korea: grammar, kosakata, percakapan, catatan budaya, dan rujukan EPS-TOPIK.",
      },
      { property: "og:title", content: "Knowledge — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Satu pusat materi yang dipakai Learning, Question Bank, dan Exam Engine.",
      },
    ],
  }),
  component: KnowledgeLayout,
});

const linkClass = cn(
  "inline-flex min-h-11 items-center rounded-md px-md text-body-sm text-text-secondary",
  "transition-colors motion-fast hover:bg-muted",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

function KnowledgeLayout() {
  return (
    <PermissionGate required={[KNOWLEDGE_PERMISSIONS.read]}>
      <Stack gap="xl">
        <header className="flex min-w-0 items-start gap-md">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <Library className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-h2 text-text-primary">Knowledge</h2>
            <p className="mt-xs text-body-sm text-text-secondary">
              Pusat seluruh materi pembelajaran: grammar, kosakata, percakapan, catatan budaya, dan
              rujukan EPS-TOPIK.
            </p>
          </div>
        </header>

        <nav aria-label="Navigasi knowledge" className="-mx-md overflow-x-auto px-md">
          <ul className="flex min-w-max gap-xs">
            <li>
              <Link
                to="/knowledge"
                activeOptions={{ exact: true }}
                className={linkClass}
                activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
              >
                Ringkasan
              </Link>
            </li>
            {KNOWLEDGE_KINDS.map((definition) => (
              <li key={definition.kind}>
                <Link
                  to="/knowledge/$kind"
                  params={{ kind: definition.route }}
                  className={linkClass}
                  activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
                >
                  {definition.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/knowledge/search"
                className={linkClass}
                activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
              >
                Pencarian
              </Link>
            </li>
            <li>
              <Link
                to="/knowledge/favorites"
                className={linkClass}
                activeProps={{ className: "bg-primary/10 text-primary font-medium" }}
              >
                Favorit
              </Link>
            </li>
          </ul>
        </nav>

        <Outlet />
      </Stack>
    </PermissionGate>
  );
}

import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";

import { cn } from "@/lib/utils";
import { ASSESSMENT_PERMISSIONS } from "@/modules/assessment";
import { PermissionGate } from "@/modules/identity";
import { Stack } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/assessment")({
  head: () => ({
    meta: [
      { title: "Assessment Studio — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Question Studio, Question Bank, dan penyusunan exam, quiz, practice, serta try out EPS-TOPIK.",
      },
      { property: "og:title", content: "Assessment Studio — Hangeul LPK Platform" },
      {
        property: "og:description",
        content:
          "Bank soal berversi dan asesmen dengan snapshot yang tidak berubah setelah terbit.",
      },
    ],
  }),
  component: AssessmentLayout,
});

const linkClass = cn(
  "inline-flex min-h-11 items-center rounded-md px-md text-body-sm text-text-secondary",
  "transition-colors motion-fast hover:bg-muted",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

const activeProps = { className: "bg-primary/10 text-primary font-medium" };

function AssessmentLayout() {
  return (
    <PermissionGate required={[ASSESSMENT_PERMISSIONS.questionRead]}>
      <Stack gap="xl">
        <header className="flex min-w-0 items-start gap-md">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <ClipboardList className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-h2 text-text-primary">Assessment Studio</h2>
            <p className="mt-xs text-body-sm text-text-secondary">
              Menulis soal, mengelola bank soal berversi, dan menyusun asesmen yang dibekukan
              sebagai snapshot saat diterbitkan.
            </p>
          </div>
        </header>

        <nav aria-label="Navigasi assessment" className="-mx-md overflow-x-auto px-md">
          <ul className="flex min-w-max gap-xs">
            <li>
              <Link
                to="/assessment"
                activeOptions={{ exact: true }}
                className={linkClass}
                activeProps={activeProps}
              >
                Question Bank
              </Link>
            </li>
            <li>
              <Link to="/assessment/questions/new" className={linkClass} activeProps={activeProps}>
                Question Studio
              </Link>
            </li>
            <li>
              <Link to="/assessment/assessments" className={linkClass} activeProps={activeProps}>
                Asesmen
              </Link>
            </li>
          </ul>
        </nav>

        <Outlet />
      </Stack>
    </PermissionGate>
  );
}

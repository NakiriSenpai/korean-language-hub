import { createFileRoute, Outlet } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";

import { EXAM_PERMISSIONS } from "@/modules/exam";
import { PermissionGate } from "@/modules/identity";
import { Stack } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/exam")({
  head: () => ({
    meta: [
      { title: "Exam Engine — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Menjalankan ujian EPS-TOPIK dari snapshot asesmen: timer, peta soal, audio, dan penilaian otomatis.",
      },
      { property: "og:title", content: "Exam Engine — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Ujian berjalan dari snapshot permanen sehingga isi soal tidak berubah.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ExamLayout,
});

function ExamLayout() {
  return (
    <PermissionGate anyOf={[EXAM_PERMISSIONS.examStart, EXAM_PERMISSIONS.resultRead]}>
      <Stack gap="xl">
        <header className="flex min-w-0 items-start gap-md">
          <span
            aria-hidden="true"
            className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <GraduationCap className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-h2 text-text-primary">Exam</h2>
            <p className="mt-xs text-body-sm text-text-secondary">
              Ujian dijalankan dari snapshot asesmen yang dibekukan, lengkap dengan timer, peta
              soal, dan penilaian otomatis.
            </p>
          </div>
        </header>

        <Outlet />
      </Stack>
    </PermissionGate>
  );
}

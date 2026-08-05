import { createFileRoute, Link } from "@tanstack/react-router";
import { History } from "lucide-react";

import { ContinueLearningCard, useRecentlyOpened } from "@/modules/learning";
import { AppCard, AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/learning/continue")({
  head: () => ({
    meta: [
      { title: "Lanjutkan Belajar — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Riwayat lesson yang terakhir dibuka agar peserta bisa langsung melanjutkan.",
      },
      { property: "og:title", content: "Lanjutkan Belajar" },
      {
        property: "og:description",
        content: "Kembali ke titik terakhir belajar hanya dengan satu ketukan.",
      },
    ],
  }),
  component: ContinuePage,
});

function ContinuePage() {
  const recent = useRecentlyOpened(20);

  return (
    <Stack gap="xl">
      <ContinueLearningCard />

      <AppSection title="Terakhir dibuka" description="Dua puluh lesson terakhir yang Anda buka.">
        {recent.isLoading ? (
          <p className="text-body-sm text-text-secondary">Memuat riwayat…</p>
        ) : (recent.data ?? []).length === 0 ? (
          <EmptyState
            icon={History}
            title="Belum ada riwayat"
            description="Riwayat akan muncul otomatis setelah Anda membuka sebuah lesson."
          />
        ) : (
          <Stack gap="sm">
            {(recent.data ?? []).map((entry) => (
              <AppCard key={entry.id} interactive>
                <div className="flex flex-wrap items-center justify-between gap-sm">
                  <div className="min-w-0">
                    <Link
                      to="/learning/lessons/$lessonId"
                      params={{ lessonId: entry.lessonId }}
                      className="text-title text-text-primary hover:underline"
                    >
                      {entry.lessonTitle}
                    </Link>
                    <p className="text-caption text-text-secondary">{entry.courseTitle}</p>
                  </div>
                  <time
                    dateTime={entry.openedAt}
                    className="text-caption text-text-secondary tabular-nums"
                  >
                    {new Date(entry.openedAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </div>
              </AppCard>
            ))}
          </Stack>
        )}
      </AppSection>
    </Stack>
  );
}

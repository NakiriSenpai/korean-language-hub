import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  Image as ImageIcon,
  Users,
} from "lucide-react";

import {
  HealthPill,
  formatDateTime,
  useAuditEntries,
  useHealthChecks,
  usePlatformStats,
} from "@/modules/platform";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/platform/")({
  head: () => ({
    meta: [
      { title: "Konsol Platform — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Ringkasan lembaga, pengguna, konten, dan kesehatan sistem dalam satu konsol.",
      },
      { property: "og:title", content: "Konsol Platform — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Statistik lembaga dan status kesehatan platform pembelajaran bahasa Korea.",
      },
    ],
  }),
  component: PlatformConsolePage,
});

function PlatformConsolePage() {
  const stats = usePlatformStats();
  const recentAudit = useAuditEntries({ limit: 5 });
  const health = useHealthChecks(recentAudit.data?.[0]?.createdAt ?? null);

  const cards = [
    { icon: Building2, label: "Lembaga aktif", value: stats.data?.activeTenantCount ?? 0 },
    { icon: Users, label: "Keanggotaan", value: stats.data?.memberCount ?? 0 },
    { icon: GraduationCap, label: "Peserta", value: stats.data?.studentCount ?? 0 },
    { icon: BookOpen, label: "Kursus", value: stats.data?.courseCount ?? 0 },
    { icon: ClipboardList, label: "Asesmen", value: stats.data?.assessmentCount ?? 0 },
    { icon: Activity, label: "Percobaan ujian", value: stats.data?.examAttemptCount ?? 0 },
    { icon: ImageIcon, label: "Aset media", value: stats.data?.mediaCount ?? 0 },
  ];

  return (
    <Stack gap="xl">
      <AppSection
        title="Ringkasan lembaga"
        description="Angka dihitung langsung dari data domain akademik, pembelajaran, dan asesmen."
      >
        <Grid cols={1} smCols={2} lgCols={4} gap="md">
          {cards.map((card) => (
            <AppCard key={card.label}>
              <div className="flex items-center gap-md">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary"
                >
                  <card.icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-caption text-text-secondary">{card.label}</p>
                  <p className="text-h3 text-text-primary">{card.value}</p>
                </div>
              </div>
            </AppCard>
          ))}
        </Grid>
      </AppSection>

      <AppSection
        title="Kesehatan sistem"
        description="Pemeriksaan ringan berdasarkan data yang sudah dimuat konsol."
      >
        <Grid cols={1} smCols={2} gap="md">
          {health.map((check) => (
            <AppCard key={check.id}>
              <div className="flex items-start justify-between gap-md">
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-text-primary">{check.label}</p>
                  <p className="mt-xs text-caption text-text-secondary">{check.detail}</p>
                </div>
                <HealthPill level={check.level} />
              </div>
            </AppCard>
          ))}
        </Grid>
      </AppSection>

      <AppSection title="Aktivitas terbaru" description="Lima entri audit terakhir di lembaga ini.">
        <AppCard>
          {recentAudit.data && recentAudit.data.length > 0 ? (
            <ul className="flex flex-col divide-y divide-border">
              {recentAudit.data.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-baseline gap-sm py-sm">
                  <span className="text-body-sm text-text-primary">
                    {entry.summary ?? entry.action}
                  </span>
                  <span className="text-caption text-text-secondary">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Belum ada aktivitas"
              description="Perubahan lembaga, peran, dan penerbitan asesmen akan tercatat di sini."
            />
          )}
        </AppCard>
      </AppSection>
    </Stack>
  );
}

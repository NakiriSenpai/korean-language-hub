import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ScrollText } from "lucide-react";

import { PermissionGate } from "@/modules/identity";
import {
  PLATFORM_PERMISSIONS,
  auditActionOptions,
  formatDateTime,
  useAuditEntries,
} from "@/modules/platform";
import { SelectInput, TextInput } from "@/shared/components/form";
import { AppCard, AppSection, Stack } from "@/shared/components/layout";
import { EmptyState } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell/platform/audit")({
  head: () => ({
    meta: [
      { title: "Jejak Audit — Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Catatan aktivitas administratif yang bersifat append-only dan tidak dapat diubah.",
      },
      { property: "og:title", content: "Jejak Audit — Hangeul LPK Platform" },
      {
        property: "og:description",
        content:
          "Login, perubahan peran, penerbitan asesmen, dan perubahan lembaga terekam permanen.",
      },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");
  const entries = useAuditEntries({
    ...(action ? { action } : {}),
    ...(search ? { search } : {}),
  });
  const allActions = auditActionOptions(entries.data ?? []);

  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.auditRead]}>
      <Stack gap="xl">
        <AppSection
          title="Jejak audit"
          description="Entri tidak dapat diubah maupun dihapus dari aplikasi; hanya penambahan yang diizinkan."
        >
          <Stack gap="md">
            <div className="grid gap-md sm:grid-cols-2">
              <TextInput
                aria-label="Cari ringkasan audit"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari ringkasan aktivitas"
              />
              <SelectInput
                aria-label="Saring berdasarkan aksi"
                value={action}
                onChange={(event) => setAction(event.target.value)}
              >
                <option value="">Semua aksi</option>
                {allActions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectInput>
            </div>

            {entries.data && entries.data.length > 0 ? (
              <AppCard>
                <ul className="flex flex-col divide-y divide-border">
                  {entries.data.map((entry) => (
                    <li key={entry.id} className="flex flex-col gap-xs py-sm">
                      <div className="flex flex-wrap items-baseline justify-between gap-sm">
                        <span className="text-body-sm text-text-primary">
                          {entry.summary ?? entry.action}
                        </span>
                        <span className="text-caption text-text-secondary">
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                      <p className="text-caption text-text-secondary">
                        {entry.action}
                        {entry.entityType ? ` · ${entry.entityType}` : ""}
                        {entry.actorLabel ? ` · ${entry.actorLabel}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              </AppCard>
            ) : (
              <EmptyState
                icon={ScrollText}
                title="Belum ada entri audit"
                description="Aktivitas administratif akan muncul di sini setelah terjadi."
              />
            )}
          </Stack>
        </AppSection>
      </Stack>
    </PermissionGate>
  );
}

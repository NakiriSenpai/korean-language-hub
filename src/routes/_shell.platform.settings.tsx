import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import type { Json } from "@/integrations/supabase/types";
import { PermissionGate } from "@/modules/identity";
import {
  PLATFORM_PERMISSIONS,
  SETTING_SECTIONS,
  resolveSection,
  useSaveSettings,
  useSystemSettings,
} from "@/modules/platform";
import type { SettingSection } from "@/modules/platform";
import { Field, SelectInput, TextInput, buttonClass } from "@/shared/components/form";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/platform/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan Sistem — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Konfigurasi umum, akademik, asesmen, pembelajaran, notifikasi, dan media.",
      },
      { property: "og:title", content: "Pengaturan Sistem — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Pengaturan modular per kategori, tersimpan terpisah untuk setiap lembaga.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const settings = useSystemSettings();

  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.settingsRead]}>
      <Stack gap="xl">
        {SETTING_SECTIONS.map((section) => (
          <SettingSectionCard
            key={section.category}
            section={section}
            initial={resolveSection(section, settings.data ?? [])}
          />
        ))}
      </Stack>
    </PermissionGate>
  );
}

function SettingSectionCard({
  section,
  initial,
}: {
  section: SettingSection;
  initial: Record<string, string | number | boolean>;
}) {
  const saveSettings = useSaveSettings();
  const [values, setValues] = useState(initial);
  const [dirty, setDirty] = useState(false);

  const current = dirty ? values : initial;

  const update = (key: string, value: string | number | boolean) => {
    setValues({ ...current, [key]: value });
    setDirty(true);
  };

  const onSave = async () => {
    try {
      await saveSettings.mutateAsync({
        category: section.category,
        settings: current as Record<string, Json>,
      });
      setDirty(false);
      toast.success(`Pengaturan ${section.label.toLowerCase()} disimpan.`);
    } catch (cause) {
      toast.error(toUserMessage(cause));
    }
  };

  return (
    <AppSection title={section.label} description={section.description}>
      <AppCard>
        <Stack gap="md">
          <Grid cols={1} smCols={2} gap="md">
            {section.fields.map((field) => {
              const id = `${section.category}-${field.key}`;
              const value = current[field.key];
              if (field.type === "boolean") {
                return (
                  <label
                    key={field.key}
                    htmlFor={id}
                    className="flex min-h-11 items-center gap-sm text-body-sm text-text-primary"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="size-5 rounded border-border accent-primary"
                      checked={Boolean(value)}
                      onChange={(event) => update(field.key, event.target.checked)}
                    />
                    {field.label}
                  </label>
                );
              }
              return (
                <Field key={field.key} label={field.label} htmlFor={id} hint={field.hint}>
                  {field.type === "select" ? (
                    <SelectInput
                      id={id}
                      value={String(value)}
                      onChange={(event) => update(field.key, event.target.value)}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </SelectInput>
                  ) : (
                    <TextInput
                      id={id}
                      type={field.type === "number" ? "number" : "text"}
                      value={String(value)}
                      onChange={(event) =>
                        update(
                          field.key,
                          field.type === "number"
                            ? Number(event.target.value || 0)
                            : event.target.value,
                        )
                      }
                    />
                  )}
                </Field>
              );
            })}
          </Grid>

          <div>
            <button
              type="button"
              className={buttonClass}
              onClick={() => void onSave()}
              disabled={saveSettings.isPending}
            >
              <Settings2 className="size-4" aria-hidden="true" />
              Simpan {section.label.toLowerCase()}
            </button>
          </div>
        </Stack>
      </AppCard>
    </AppSection>
  );
}

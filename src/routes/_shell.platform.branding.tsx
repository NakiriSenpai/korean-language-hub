import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Palette } from "lucide-react";
import { toast } from "sonner";

import { PermissionGate } from "@/modules/identity";
import {
  PLATFORM_PERMISSIONS,
  brandingInputSchema,
  useBranding,
  useSaveBranding,
} from "@/modules/platform";
import { Field, TextArea, TextInput, buttonClass } from "@/shared/components/form";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";
import { toUserMessage } from "@/shared/platform";

export const Route = createFileRoute("/_shell/platform/branding")({
  head: () => ({
    meta: [
      { title: "Branding Lembaga — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Atur logo, sampul, warna utama, dan kontak resmi lembaga pelatihan.",
      },
      { property: "og:title", content: "Branding Lembaga — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Warna branding dipetakan ke design token sehingga tampilan tetap konsisten.",
      },
    ],
  }),
  component: BrandingPage,
});

const emptyForm = {
  logoUrl: "",
  coverUrl: "",
  primaryColor: "",
  secondaryColor: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
};

function BrandingPage() {
  const branding = useBranding();
  const saveBranding = useSaveBranding();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!branding.data) return;
    setForm({
      logoUrl: branding.data.logoUrl ?? "",
      coverUrl: branding.data.coverUrl ?? "",
      primaryColor: branding.data.primaryColor ?? "",
      secondaryColor: branding.data.secondaryColor ?? "",
      contactEmail: branding.data.contactEmail ?? "",
      contactPhone: branding.data.contactPhone ?? "",
      address: branding.data.address ?? "",
    });
  }, [branding.data]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = brandingInputSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Data tidak valid");
      return;
    }
    try {
      await saveBranding.mutateAsync(parsed.data);
      toast.success("Branding disimpan.");
    } catch (cause) {
      setError(toUserMessage(cause));
    }
  };

  return (
    <PermissionGate required={[PLATFORM_PERMISSIONS.brandingWrite]}>
      <Stack gap="xl">
        <AppSection
          title="Identitas visual"
          description="Warna diisi dalam format heks lalu dipetakan ke token desain aplikasi."
        >
          <AppCard>
            <form onSubmit={onSubmit} className="flex flex-col gap-md" noValidate>
              <Grid cols={1} smCols={2} gap="md">
                <Field label="URL logo" htmlFor="logoUrl" hint="Opsional">
                  <TextInput
                    id="logoUrl"
                    value={form.logoUrl}
                    onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
                    placeholder="https://res.cloudinary.com/.../logo.png"
                  />
                </Field>
                <Field label="URL sampul" htmlFor="coverUrl" hint="Opsional">
                  <TextInput
                    id="coverUrl"
                    value={form.coverUrl}
                    onChange={(event) => setForm({ ...form, coverUrl: event.target.value })}
                    placeholder="https://res.cloudinary.com/.../cover.jpg"
                  />
                </Field>
                <Field label="Warna utama" htmlFor="primaryColor" hint="Contoh #1B4D3E">
                  <TextInput
                    id="primaryColor"
                    value={form.primaryColor}
                    onChange={(event) => setForm({ ...form, primaryColor: event.target.value })}
                    placeholder="#1B4D3E"
                  />
                </Field>
                <Field label="Warna sekunder" htmlFor="secondaryColor" hint="Contoh #C8A24A">
                  <TextInput
                    id="secondaryColor"
                    value={form.secondaryColor}
                    onChange={(event) => setForm({ ...form, secondaryColor: event.target.value })}
                    placeholder="#C8A24A"
                  />
                </Field>
                <Field label="Email kontak" htmlFor="contactEmail" hint="Opsional">
                  <TextInput
                    id="contactEmail"
                    type="email"
                    value={form.contactEmail}
                    onChange={(event) => setForm({ ...form, contactEmail: event.target.value })}
                    placeholder="halo@lembaga.id"
                  />
                </Field>
                <Field label="Telepon kontak" htmlFor="contactPhone" hint="Opsional">
                  <TextInput
                    id="contactPhone"
                    value={form.contactPhone}
                    onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
                    placeholder="021-0000000"
                  />
                </Field>
              </Grid>

              <Field label="Alamat" htmlFor="address" hint="Opsional">
                <TextArea
                  id="address"
                  value={form.address}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  placeholder="Alamat lengkap lembaga"
                />
              </Field>

              {error && (
                <p role="alert" className="text-caption text-destructive">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-md">
                <button type="submit" className={buttonClass} disabled={saveBranding.isPending}>
                  <Palette className="size-4" aria-hidden="true" />
                  Simpan branding
                </button>
                <div className="flex items-center gap-xs">
                  <span
                    aria-hidden="true"
                    className="size-6 rounded-full border border-border"
                    style={{ backgroundColor: form.primaryColor || "transparent" }}
                  />
                  <span
                    aria-hidden="true"
                    className="size-6 rounded-full border border-border"
                    style={{ backgroundColor: form.secondaryColor || "transparent" }}
                  />
                  <span className="text-caption text-text-secondary">Pratinjau warna</span>
                </div>
              </div>
            </form>
          </AppCard>
        </AppSection>
      </Stack>
    </PermissionGate>
  );
}

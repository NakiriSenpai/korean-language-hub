import { createFileRoute } from "@tanstack/react-router";

import { AppLogo } from "@/shared/components/shell";
import { SignInForm } from "@/modules/identity/components/SignInForm";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search["redirect"] === "string" ? (search["redirect"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Masuk — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Masuk ke akun Hangeul LPK untuk mengakses pembelajaran dan ujian lembaga Anda.",
      },
      { property: "og:title", content: "Masuk — Hangeul LPK Platform" },
      {
        property: "og:description",
        content: "Autentikasi pengguna lembaga pelatihan bahasa Korea.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-background px-md py-2xl">
      <div className="flex w-full max-w-[42ch] flex-col gap-lg">
        <div className="flex flex-col items-center gap-sm text-center">
          <AppLogo />
          <h1 className="text-h2 text-text-primary">Masuk ke akun Anda</h1>
          <p className="text-body-sm text-text-secondary">
            Gunakan email keanggotaan lembaga untuk melanjutkan.
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}

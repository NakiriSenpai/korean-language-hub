import { createFileRoute } from "@tanstack/react-router";

import { appConfig } from "@/shared/config/app.config";
import { isEnvReady, missingEnvKeys } from "@/shared/config/env";
import { APP_META } from "@/shared/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hangeul LPK Platform — Foundation" },
      {
        name: "description",
        content:
          "Technical foundation for a multi-tenant SaaS platform serving Korean language training centers.",
      },
      { property: "og:title", content: "Hangeul LPK Platform — Foundation" },
      {
        property: "og:description",
        content:
          "Sprint 0.1 foundation: modular architecture, strict TypeScript, shared config, error and loading foundations.",
      },
    ],
  }),
  component: FoundationPage,
});

const FOUNDATION_ITEMS: readonly { title: string; detail: string }[] = [
  { title: "Folder architecture", detail: "Domain modules under src/modules with shared layer" },
  { title: "TypeScript", detail: "Strict mode with @/* path alias" },
  { title: "Lint & format", detail: "ESLint + Prettier, zero errors" },
  { title: "Environment", detail: "Typed VITE_* config, no hardcoded secrets" },
  { title: "Shared config", detail: "App config, constants, logger, error handler" },
  { title: "Error boundary", detail: "Global boundary wired at the root" },
  { title: "Loading foundation", detail: "Reusable Loading component" },
];

function FoundationPage() {
  const envReady = isEnvReady();
  const missing = missingEnvKeys();

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-12">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Sprint 0.1 · Foundation
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          {APP_META.name}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{APP_META.description}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          v{appConfig.version} · {appConfig.environment} · language {appConfig.defaultLanguage} ·
          theme {appConfig.defaultTheme}
        </p>
      </header>

      <section className="mt-10 grid gap-3">
        {FOUNDATION_ITEMS.map((item) => (
          <article
            key={item.title}
            className="rounded-lg border border-border bg-card p-4 text-card-foreground"
          >
            <h2 className="text-sm font-medium">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-border bg-muted/40 p-4">
        <h2 className="text-sm font-medium text-foreground">Environment status</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {envReady
            ? "All environment variables are configured."
            : `Not yet configured: ${missing.join(", ")}. See .env.example.`}
        </p>
      </section>
    </main>
  );
}

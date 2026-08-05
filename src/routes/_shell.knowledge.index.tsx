import { createFileRoute, Link } from "@tanstack/react-router";

import { KNOWLEDGE_KINDS } from "@/modules/knowledge";
import { AppCard, AppSection, Grid, Stack } from "@/shared/components/layout";

export const Route = createFileRoute("/_shell/knowledge/")({
  head: () => ({
    meta: [
      { title: "Pusat Materi — Knowledge | Hangeul LPK Platform" },
      {
        name: "description",
        content:
          "Ringkasan seluruh jenis materi Knowledge yang menjadi sumber data Learning dan Exam.",
      },
      { property: "og:title", content: "Pusat Materi — Knowledge" },
      {
        property: "og:description",
        content: "Pilih jenis materi: grammar, kosakata, percakapan, budaya, atau rujukan EPS.",
      },
    ],
  }),
  component: KnowledgeOverview,
});

function KnowledgeOverview() {
  return (
    <AppSection
      title="Jenis materi"
      description="Setiap jenis materi memakai struktur konten dan pembaca yang sama."
    >
      <Grid cols={1} smCols={2} lgCols={3} gap="md">
        {KNOWLEDGE_KINDS.map((definition) => {
          const Icon = definition.icon;
          return (
            <AppCard key={definition.kind} interactive>
              <Stack gap="sm">
                <span
                  aria-hidden="true"
                  className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"
                >
                  <Icon className="size-5" />
                </span>
                <Link
                  to="/knowledge/$kind"
                  params={{ kind: definition.route }}
                  className="text-title text-text-primary hover:underline"
                >
                  {definition.label}
                </Link>
                <p className="text-body-sm text-text-secondary">{definition.description}</p>
              </Stack>
            </AppCard>
          );
        })}
      </Grid>
    </AppSection>
  );
}

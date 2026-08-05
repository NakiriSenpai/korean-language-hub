import { createFileRoute } from "@tanstack/react-router";

import { ForbiddenPage } from "@/modules/identity/components/AccessPages";

export const Route = createFileRoute("/forbidden")({
  head: () => ({
    meta: [
      { title: "Akses ditolak — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Peran keanggotaan Anda tidak memiliki izin untuk membuka halaman ini.",
      },
      { property: "og:title", content: "Akses ditolak — Hangeul LPK Platform" },
      { property: "og:description", content: "Izin keanggotaan tidak mencukupi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForbiddenPage,
});

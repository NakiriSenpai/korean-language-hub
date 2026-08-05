import { createFileRoute } from "@tanstack/react-router";

import { UnauthorizedPage } from "@/modules/identity/components/AccessPages";

export const Route = createFileRoute("/unauthorized")({
  head: () => ({
    meta: [
      { title: "Sesi berakhir — Hangeul LPK Platform" },
      {
        name: "description",
        content: "Sesi Anda tidak ditemukan atau sudah berakhir. Masuk kembali untuk melanjutkan.",
      },
      { property: "og:title", content: "Sesi berakhir — Hangeul LPK Platform" },
      { property: "og:description", content: "Autentikasi diperlukan untuk membuka halaman ini." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UnauthorizedPage,
});

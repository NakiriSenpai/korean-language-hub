import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/shared/components/shell";

export const Route = createFileRoute("/_shell")({
  component: AppShell,
});

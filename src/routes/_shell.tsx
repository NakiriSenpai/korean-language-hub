import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/shared/components/shell";

/**
 * Route protection for the whole application shell.
 * `ssr: false` because the session lives in browser storage — gating on the
 * server would loop on hard refresh.
 */
export const Route = createFileRoute("/_shell")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
    return { user: data.user };
  },
  component: AppShell,
});

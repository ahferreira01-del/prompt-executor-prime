import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

export const Route = createFileRoute("/api/public/cron/movidesk-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const denied = await authenticateCronRequest(request);
        if (denied) return denied;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { runMovideskSync } = await import("@/lib/movidesk.server");
        const { data } = await supabaseAdmin.from("integrations").select("company_id,api_token,last_sync_at").eq("sync_enabled", true).not("api_token", "is", null);
        let ok = 0;
        for (const i of data ?? []) { const r = await runMovideskSync(supabaseAdmin, i); if (r.status === "success") ok++; }
        return Response.json({ companies: data?.length ?? 0, ok });
      },
    },
  },
});

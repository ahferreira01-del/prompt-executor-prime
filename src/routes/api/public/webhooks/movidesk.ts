import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payload = z.object({ Id: z.union([z.number(), z.string()]).optional(), id: z.union([z.number(), z.string()]).optional() }).passthrough();

export const Route = createFileRoute("/api/public/webhooks/movidesk")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = new URL(request.url).searchParams.get("key") ?? "";
        if (!/^[a-f0-9]{64}$/.test(key)) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: integ } = await supabaseAdmin.from("integrations").select("company_id,api_token").eq("webhook_key", key).maybeSingle();
        if (!integ) return new Response("Unauthorized", { status: 401 });
        let body: unknown;
        try { body = await request.json(); } catch { return new Response("Invalid JSON", { status: 400 }); }
        const parsed = payload.safeParse(body);
        const id = parsed.success ? (parsed.data.Id ?? parsed.data.id) : undefined;
        if (id === undefined || !/^\d{1,12}$/.test(String(id))) return new Response("Missing ticket id", { status: 400 });
        if (!integ.api_token) return new Response("Integration not configured", { status: 409 });
        const { fetchMovideskTicket, ingestMovideskTicket } = await import("@/lib/movidesk.server");
        try {
          const t = await fetchMovideskTicket(integ.api_token, String(id));
          if (!t) throw new Error("Chamado não encontrado no Movidesk");
          const r = await ingestMovideskTicket(supabaseAdmin, integ.company_id, t, "webhook");
          await supabaseAdmin.from("integration_runs").insert({ company_id: integ.company_id, kind: "webhook", status: "success", received: 1, created: r === "created" ? 1 : 0, skipped: r === "skipped" ? 1 : 0, message: `Chamado ${id}` });
          return Response.json({ ok: true });
        } catch (e) {
          await supabaseAdmin.from("integration_runs").insert({ company_id: integ.company_id, kind: "webhook", status: "error", received: 1, message: e instanceof Error ? e.message.slice(0, 300) : "Falha" });
          return new Response("Processing failed", { status: 502 });
        }
      },
    },
  },
});

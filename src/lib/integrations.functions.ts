import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cid = z.object({ companyId: z.string().uuid() });

export const getMovidesk = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => cid.parse(i)).handler(async ({ data, context }) => {
  const { data: isAdmin } = await context.supabase.rpc("has_company_role", { _company_id: data.companyId, _roles: ["admin"], _user_id: context.userId });
  const { data: runs } = await context.supabase.from("integration_runs").select("id,kind,entity,status,received,created,skipped,message,created_at").eq("company_id", data.companyId).order("created_at", { ascending: false }).limit(20);
  if (!isAdmin) return { isAdmin: false, integration: null, runs: runs ?? [] };
  const { data: i } = await context.supabase.from("integrations").select("webhook_key,api_token,sync_enabled,last_sync_at,last_sync_status").eq("company_id", data.companyId).maybeSingle();
  return { isAdmin: true, runs: runs ?? [], integration: i ? { webhookKey: i.webhook_key, hasToken: !!i.api_token, tokenHint: i.api_token ? `••••${i.api_token.slice(-4)}` : null, syncEnabled: i.sync_enabled, lastSyncAt: i.last_sync_at, lastSyncStatus: i.last_sync_status } : null };
});

export const saveMovidesk = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => cid.extend({ apiToken: z.string().trim().min(10).max(200).optional(), syncEnabled: z.boolean() }).parse(i)).handler(async ({ data, context }) => {
  const patch = { company_id: data.companyId, sync_enabled: data.syncEnabled, updated_at: new Date().toISOString(), ...(data.apiToken ? { api_token: data.apiToken } : {}) };
  const { error } = await context.supabase.from("integrations").upsert(patch, { onConflict: "company_id" });
  if (error) throw new Error("Apenas administradores podem configurar a integração.");
  return { ok: true };
});

export const syncMovideskNow = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => cid.parse(i)).handler(async ({ data, context }) => {
  const { data: i } = await context.supabase.from("integrations").select("company_id,api_token,last_sync_at").eq("company_id", data.companyId).maybeSingle();
  if (!i) throw new Error("Configure a integração antes de sincronizar.");
  const { runMovideskSync } = await import("@/lib/movidesk.server");
  return runMovideskSync(context.supabase, i);
});

const str = (max: number) => z.string().trim().min(1).max(max);
const lvl = z.preprocess((v) => String(v ?? "").trim().toUpperCase(), z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]));
const doc = z.preprocess((v) => String(v ?? "").trim().toUpperCase(), z.enum(["NONE", "PARTIAL", "COMPLETE"]));
const num = z.preprocess((v) => { const s = String(v ?? "").replace(/[R$\s]/g, ""); const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s); return Number.isFinite(n) ? n : NaN; }, z.number().min(0));
const schemas = {
  employees: z.object({ name: str(160), job_title: str(120), area: str(120), tenure_months: num.pipe(z.number().int()), email: z.string().trim().email().max(255).optional().or(z.literal("").transform(() => undefined)) }),
  processes: z.object({ name: str(160), description: z.string().trim().max(2000).default(""), area: str(120), criticality: lvl, documentation_level: doc }),
  technologies: z.object({ name: str(120) }),
  clients: z.object({ name: str(160), annual_revenue: num }),
  tickets: z.object({ content: z.string().trim().min(10).max(8000), external_id: z.string().trim().max(120).optional(), employee_email: z.string().trim().max(255).optional() }),
} as const;
export type ImportEntity = keyof typeof schemas;

export const importRows = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((i) => cid.extend({ entity: z.enum(["employees", "processes", "technologies", "clients", "tickets"]), rows: z.array(z.record(z.string(), z.string())).min(1).max(1000) }).parse(i)).handler(async ({ data, context }) => {
  const db = context.supabase;
  const errors: Array<{ line: number; message: string }> = [];
  const valid: Array<Record<string, unknown>> = [];
  const schema = schemas[data.entity];
  data.rows.forEach((row, idx) => { const r = schema.safeParse(row); if (r.success) valid.push(r.data as Record<string, unknown>); else errors.push({ line: idx + 2, message: r.error.issues.map((x) => `${x.path.join(".")}: ${x.message}`).join("; ") }); });
  let created = 0, skipped = 0;
  if (data.entity === "tickets") {
    const { classifyText } = await import("@/lib/movidesk.server");
    for (const v of valid) {
      let employeeId: string | null = null;
      const email = (v["employee_email"] as string | undefined)?.toLowerCase();
      if (email) { const { data: e } = await db.from("employees").select("id").eq("company_id", data.companyId).ilike("email", email).maybeSingle(); employeeId = e?.id ?? null; }
      const ext = v["external_id"] ? `import:${String(v["external_id"])}` : null;
      const { data: t, error } = await db.from("tickets").insert({ company_id: data.companyId, content: String(v["content"]), employee_id: employeeId, source: "import", external_id: ext }).select("id").single();
      if (error) { skipped++; continue; }
      await db.from("ticket_classifications").insert({ company_id: data.companyId, ticket_id: t.id, ...(await classifyText(String(v["content"]))) });
      created++;
    }
  } else {
    for (const v of valid) {
      const { error } = await db.from(data.entity).insert({ ...v, company_id: data.companyId } as never);
      if (error) { skipped++; if (errors.length < 50) errors.push({ line: 0, message: error.code === "23505" ? `Já existe: ${String(v["name"] ?? v["email"])}` : "Sem permissão ou dado inválido" }); } else created++;
    }
  }
  const status = errors.length === 0 && skipped === 0 ? "success" : created > 0 ? "partial" : "error";
  await db.from("integration_runs").insert({ company_id: data.companyId, kind: "import", entity: data.entity, status, received: data.rows.length, created, skipped: skipped + (data.rows.length - valid.length), message: errors.length ? `${errors.length} linha(s) com problema` : null });
  return { created, skipped, invalid: data.rows.length - valid.length, errors: errors.slice(0, 50) };
});

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type Db = SupabaseClient<Database>;
const BASE = "https://api.movidesk.com/public/v1/tickets";
const EXPAND = "$select=id,subject,status,createdDate,resolvedIn,lastUpdate&$expand=owner($select=email,businessName),actions($select=description)";

export type MovideskTicket = {
  id: number | string;
  subject?: string | null;
  status?: string | null;
  createdDate?: string | null;
  resolvedIn?: string | null;
  lastUpdate?: string | null;
  owner?: { email?: string | null; businessName?: string | null } | null;
  actions?: Array<{ description?: string | null }> | null;
};

export async function fetchMovideskTicket(token: string, id: string): Promise<MovideskTicket | null> {
  const r = await fetch(`${BASE}?token=${encodeURIComponent(token)}&id=${encodeURIComponent(id)}&${EXPAND}`);
  if (!r.ok) { console.error("Movidesk ticket fetch failed", r.status); return null; }
  return (await r.json()) as MovideskTicket;
}

export async function listMovideskTicketsSince(token: string, since: Date): Promise<MovideskTicket[]> {
  const iso = since.toISOString().replace(/\.\d{3}Z$/, ".00z");
  const all: MovideskTicket[] = [];
  for (let skip = 0; skip < 2000; skip += 100) {
    const url = `${BASE}?token=${encodeURIComponent(token)}&${EXPAND}&$filter=lastUpdate gt ${iso}&$orderby=lastUpdate&$top=100&$skip=${skip}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Movidesk respondeu ${r.status}`);
    const page = (await r.json()) as MovideskTicket[];
    all.push(...page);
    if (page.length < 100) break;
  }
  return all;
}

function strip(html: string) { return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(); }

export async function classifyText(content: string) {
  let c = { technology: "Não identificada", category: "Geral", subject: "Chamado não classificado" };
  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]!}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "openai/gpt-6-astra", messages: [{ role: "system", content: "Classifique o chamado corporativo. Responda somente JSON válido com technology, category e subject, cada campo curto. Não faça cálculos de risco." }, { role: "user", content }], response_format: { type: "json_object" } }) });
    if (response.ok) {
      const raw = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const text = raw.choices?.[0]?.message?.content;
      if (text) { const p = JSON.parse(text) as Partial<typeof c>; c = { technology: String(p.technology ?? c.technology).slice(0, 120), category: String(p.category ?? c.category).slice(0, 120), subject: String(p.subject ?? c.subject).slice(0, 200) }; }
    }
  } catch (e) { console.error("classify failed", e); }
  return c;
}

/** Ingests one Movidesk ticket. Returns "created" | "skipped". Idempotent by external id. */
export async function ingestMovideskTicket(db: Db, companyId: string, t: MovideskTicket, source: "webhook" | "sync_api"): Promise<"created" | "skipped"> {
  const externalId = `movidesk:${t.id}`;
  const body = (t.actions ?? []).map((a) => strip(a.description ?? "")).filter(Boolean).join("\n");
  const content = `${t.subject ?? "Sem assunto"}\n${body}`.slice(0, 8000).trim();
  if (content.length < 3) return "skipped";
  let employeeId: string | null = null;
  const email = t.owner?.email?.trim().toLowerCase();
  if (email) {
    const { data } = await db.from("employees").select("id").eq("company_id", companyId).ilike("email", email).eq("active", true).maybeSingle();
    employeeId = data?.id ?? null;
  }
  const { data: existing } = await db.from("tickets").select("id").eq("company_id", companyId).eq("external_id", externalId).maybeSingle();
  if (existing) {
    await db.from("tickets").update({ external_status: t.status ?? null, resolved_at: t.resolvedIn ?? null, employee_id: employeeId, content }).eq("id", existing.id);
    return "skipped";
  }
  const { data: ticket, error } = await db.from("tickets").insert({ company_id: companyId, content, employee_id: employeeId, source, external_id: externalId, external_status: t.status ?? null, resolved_at: t.resolvedIn ?? null, ...(t.createdDate ? { created_at: t.createdDate } : {}) }).select("id").single();
  if (error) { if (error.code === "23505") return "skipped"; throw new Error(error.message); }
  const c = await classifyText(content);
  await db.from("ticket_classifications").insert({ company_id: companyId, ticket_id: ticket.id, ...c });
  return "created";
}

export async function runMovideskSync(db: Db, integration: { company_id: string; api_token: string | null; last_sync_at: string | null }) {
  if (!integration.api_token) throw new Error("Token do Movidesk não configurado.");
  const since = integration.last_sync_at ? new Date(integration.last_sync_at) : new Date(Date.now() - 30 * 86400000);
  const startedAt = new Date().toISOString();
  let created = 0, skipped = 0, received = 0, status: "success" | "error" = "success", message: string | null = null;
  try {
    const list = await listMovideskTicketsSince(integration.api_token, since);
    received = list.length;
    for (const t of list) { (await ingestMovideskTicket(db, integration.company_id, t, "sync_api")) === "created" ? created++ : skipped++; }
  } catch (e) { status = "error"; message = e instanceof Error ? e.message.slice(0, 300) : "Falha"; }
  await db.from("integrations").update({ last_sync_status: status === "success" ? `OK: ${created} novos, ${skipped} atualizados` : `Erro: ${message}`, ...(status === "success" ? { last_sync_at: startedAt } : {}), updated_at: new Date().toISOString() }).eq("company_id", integration.company_id);
  await db.from("integration_runs").insert({ company_id: integration.company_id, kind: "sync_api", status, received, created, skipped, message });
  return { status, received, created, skipped, message };
}

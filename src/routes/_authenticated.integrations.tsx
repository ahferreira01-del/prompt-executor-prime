import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { Copy, Download, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { getMovidesk, importRows, saveMovidesk, syncMovideskNow, type ImportEntity } from "@/lib/integrations.functions";

const d = "Integração com Movidesk em tempo real e por sincronização, e importação de cadastros por planilha.";
export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({ meta: [{ title: "Integrações — Knowledge Risk" }, { name: "description", content: d }, { property: "og:title", content: "Integrações — Knowledge Risk" }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Integrations,
});

const templates: Record<ImportEntity, { label: string; cols: string[]; example: string[] }> = {
  employees: { label: "Colaboradores", cols: ["name", "job_title", "area", "tenure_months", "email"], example: ["Ana Souza", "Analista de Suporte", "TI", "24", "ana@empresa.com"] },
  processes: { label: "Processos", cols: ["name", "description", "area", "criticality", "documentation_level"], example: ["Fechamento contábil", "Fechamento mensal", "Financeiro", "HIGH", "PARTIAL"] },
  technologies: { label: "Tecnologias", cols: ["name"], example: ["SAP"] },
  clients: { label: "Clientes", cols: ["name", "annual_revenue"], example: ["Cliente Alfa", "1500000"] },
  tickets: { label: "Chamados", cols: ["content", "external_id", "employee_email"], example: ["Erro ao gerar nota fiscal no SAP", "12345", "ana@empresa.com"] },
};
const kindLabel: Record<string, string> = { webhook: "Tempo real", sync_api: "Sincronização", import: "Planilha" };
const statusLabel: Record<string, string> = { success: "Sucesso", partial: "Parcial", error: "Erro" };

function parseCsv(text: string): string[][] {
  const sep = (text.split("\n")[0] ?? "").split(";").length > (text.split("\n")[0] ?? "").split(",").length ? ";" : ",";
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"') q = true; else if (c === sep) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); if (row.some((x) => x.trim())) rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  row.push(cell); if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

function download(entity: ImportEntity) {
  const t = templates[entity];
  const blob = new Blob(["\uFEFF" + t.cols.join(";") + "\n" + t.example.join(";") + "\n"], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `modelo_${entity}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

type Info = Awaited<ReturnType<typeof getMovidesk>>;

function Integrations() {
  const { company } = useWorkspace();
  const get = useServerFn(getMovidesk), save = useServerFn(saveMovidesk), sync = useServerFn(syncMovideskNow), imp = useServerFn(importRows);
  const [info, setInfo] = useState<Info | null>(null);
  const [token, setToken] = useState(""); const [busy, setBusy] = useState<string | null>(null);
  const [entity, setEntity] = useState<ImportEntity>("employees");
  const [result, setResult] = useState<{ created: number; skipped: number; invalid: number; errors: Array<{ line: number; message: string }> } | null>(null);
  const load = useCallback(async () => { if (company) setInfo(await get({ data: { companyId: company.id } })); }, [company, get]);
  useEffect(() => { void load(); }, [load]);
  const hookUrl = info?.integration ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/public/webhooks/movidesk?key=${info.integration.webhookKey}` : "";

  async function onSave(syncEnabled: boolean) {
    if (!company) return; setBusy("save");
    try { await save({ data: { companyId: company.id, syncEnabled, ...(token.trim() ? { apiToken: token.trim() } : {}) } }); setToken(""); toast.success("Integração salva."); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Falha ao salvar."); } finally { setBusy(null); }
  }
  async function onSync() {
    if (!company) return; setBusy("sync");
    try { const r = await sync({ data: { companyId: company.id } }); r.status === "success" ? toast.success(`Sincronizado: ${r.created} novo(s), ${r.skipped} atualizado(s).`) : toast.error(r.message ?? "Falha na sincronização."); await load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Falha."); } finally { setBusy(null); }
  }
  async function onFile(file: File) {
    if (!company) return; setBusy("import"); setResult(null);
    try {
      const rows = parseCsv(await file.text());
      const header = (rows[0] ?? []).map((h) => h.replace(/^\uFEFF/, "").trim().toLowerCase());
      const missing = templates[entity].cols.filter((c) => c !== "email" && c !== "external_id" && c !== "employee_email" && c !== "description" && !header.includes(c));
      if (missing.length) { toast.error(`Colunas faltando: ${missing.join(", ")}. Baixe o modelo.`); return; }
      const data = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
      if (!data.length) { toast.error("A planilha não tem linhas."); return; }
      if (data.length > 1000) { toast.error("Máximo de 1000 linhas por envio."); return; }
      const r = await imp({ data: { companyId: company.id, entity, rows: data } }); setResult(r);
      r.created ? toast.success(`${r.created} registro(s) importado(s).`) : toast.error("Nenhum registro importado.");
      await load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha na importação."); } finally { setBusy(null); }
  }

  return <AppShell title="Integrações" subtitle="Movidesk e importação de cadastros por planilha">
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-bold">Movidesk</h2>
        <p className="mt-1 text-sm text-muted-foreground">Chamados chegam em tempo real e uma sincronização periódica garante que nada se perca. Cada chamado é ligado ao colaborador pelo e-mail do responsável e classificado pela IA.</p>
        {!info ? <p className="mt-4 text-sm text-muted-foreground">Carregando…</p> : !info.isAdmin ? <p className="mt-4 rounded-md bg-muted p-3 text-sm">Somente administradores podem configurar a integração.</p> : <div className="mt-5 space-y-4">
          <label className="block text-sm font-semibold">Token da API do Movidesk
            <Input className="mt-1.5" type="password" autoComplete="off" placeholder={info.integration?.hasToken ? `Salvo (${info.integration.tokenHint}) — digite para trocar` : "Cole o token aqui"} value={token} onChange={(e) => setToken(e.target.value)} />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">No Movidesk: Configurações → Conta → Parâmetros → Ambiente → Chave para integração.</span>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => onSave(info.integration?.syncEnabled ?? true)} disabled={busy !== null || (!token.trim() && !!info.integration)}>Salvar</Button>
            {info.integration && <Button variant="outline" onClick={() => onSave(!info.integration!.syncEnabled)} disabled={busy !== null}>{info.integration.syncEnabled ? "Pausar sincronização automática" : "Ativar sincronização automática"}</Button>}
            {info.integration?.hasToken && <Button variant="outline" onClick={onSync} disabled={busy !== null}><RefreshCw className={`size-4 ${busy === "sync" ? "animate-spin" : ""}`} />Sincronizar agora</Button>}
          </div>
          {info.integration && <>
            <div className="rounded-md border bg-background p-3 text-sm">
              <strong className="block">Endereço do gatilho (webhook)</strong>
              <span className="text-xs text-muted-foreground">No Movidesk: Configurações → Gatilhos → novo gatilho ao criar/alterar ticket → ação "Chamar URL" (POST) com este endereço. Não compartilhe.</span>
              <div className="mt-2 flex gap-2"><code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1.5 text-xs">{hookUrl}</code><Button size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(hookUrl); toast.success("Copiado."); }}><Copy className="size-4" /></Button></div>
            </div>
            <p className="text-sm text-muted-foreground">Sincronização automática: <strong className="text-foreground">{info.integration.syncEnabled ? "ativa (a cada hora)" : "pausada"}</strong>{info.integration.lastSyncAt && <> · última em {new Date(info.integration.lastSyncAt).toLocaleString("pt-BR")}</>}{info.integration.lastSyncStatus && <> · {info.integration.lastSyncStatus}</>}</p>
          </>}
        </div>}
      </section>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-bold">Importar por planilha (CSV)</h2>
        <p className="mt-1 text-sm text-muted-foreground">Baixe o modelo, preencha no Excel e salve como CSV. Criticidade: LOW, MEDIUM, HIGH, CRITICAL. Documentação: NONE, PARTIAL, COMPLETE.</p>
        <div className="mt-4 flex flex-wrap gap-2">{(Object.keys(templates) as ImportEntity[]).map((k) => <Button key={k} size="sm" variant={entity === k ? "default" : "outline"} onClick={() => { setEntity(k); setResult(null); }}>{templates[k].label}</Button>)}</div>
        <p className="mt-3 text-xs text-muted-foreground">Colunas: {templates[entity].cols.join(", ")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => download(entity)}><Download className="size-4" />Baixar modelo</Button>
          <label className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ${busy ? "pointer-events-none opacity-50" : ""}`}><Upload className="size-4" />{busy === "import" ? "Importando…" : "Enviar planilha"}<input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void onFile(f); }} /></label>
        </div>
        {result && <div className="mt-4 rounded-md border bg-background p-3 text-sm">
          <p><strong>{result.created}</strong> importado(s) · <strong>{result.skipped}</strong> ignorado(s) · <strong>{result.invalid}</strong> inválido(s)</p>
          {result.errors.length > 0 && <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs text-destructive">{result.errors.map((e, i) => <li key={i}>{e.line ? `Linha ${e.line}: ` : ""}{e.message}</li>)}</ul>}
        </div>}
      </section>
    </div>

    <section className="mt-6 rounded-lg border bg-card">
      <h2 className="border-b p-4 font-bold">Histórico</h2>
      {!info?.runs.length ? <p className="p-4 text-sm text-muted-foreground">Nenhuma importação ainda.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="p-3">Quando</th><th className="p-3">Origem</th><th className="p-3">Dados</th><th className="p-3">Situação</th><th className="p-3">Recebidos</th><th className="p-3">Novos</th><th className="p-3">Ignorados</th><th className="p-3">Detalhe</th></tr></thead><tbody>{info.runs.map((r) => <tr key={r.id} className="border-t"><td className="p-3">{new Date(r.created_at).toLocaleString("pt-BR")}</td><td className="p-3">{kindLabel[r.kind] ?? r.kind}</td><td className="p-3">{templates[r.entity as ImportEntity]?.label ?? r.entity}</td><td className="p-3">{statusLabel[r.status] ?? r.status}</td><td className="p-3">{r.received}</td><td className="p-3">{r.created}</td><td className="p-3">{r.skipped}</td><td className="p-3 text-muted-foreground">{r.message}</td></tr>)}</tbody></table></div>}
    </section>
  </AppShell>;
}

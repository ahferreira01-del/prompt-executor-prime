import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { docLabel, matches, riskLabel, riskTone } from "@/lib/labels";

type Process = Database["public"]["Tables"]["processes"]["Row"];
type Level = Database["public"]["Enums"]["risk_level"];
type Doc = Database["public"]["Enums"]["documentation_level"];
const d = "Processos, criticidade e documentação organizacional.";
export const Route = createFileRoute("/_authenticated/processes")({
  head: () => ({ meta: [{ title: "Processos — Knowledge Risk" }, { name: "description", content: d }, { property: "og:title", content: "Processos — Knowledge Risk" }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Processes,
});
const order: Level[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

function Processes() {
  const { company } = useWorkspace();
  const [rows, setRows] = useState<Process[]>([]);
  const [name, setName] = useState(""), [area, setArea] = useState(""), [description, setDescription] = useState("");
  const [level, setLevel] = useState<Level>("MEDIUM"), [doc, setDoc] = useState<Doc>("PARTIAL");
  const [q, setQ] = useState(""), [filter, setFilter] = useState<Level | "ALL">("ALL"), [saving, setSaving] = useState(false);
  async function load() {
    if (!company) return;
    const { data, error } = await supabase.from("processes").select("*").eq("company_id", company.id).order("name");
    if (error) toast.error("Não foi possível carregar os processos.");
    setRows(data ?? []);
  }
  useEffect(() => { void load(); }, [company]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !name.trim() || !area.trim() || !description.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("processes").insert({ company_id: company.id, name: name.trim(), area: area.trim(), description: description.trim(), criticality: level, documentation_level: doc });
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar o processo.");
    toast.success(`Processo "${name.trim()}" adicionado.`);
    setName(""); setArea(""); setDescription("");
    await load();
  }
  const areas = [...new Set(rows.map((r) => r.area))];
  const shown = rows.filter((r) => (filter === "ALL" || r.criticality === filter) && matches(q, r.name, r.area, r.description)).sort((a, b) => order.indexOf(a.criticality) - order.indexOf(b.criticality));
  const sel = "mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm font-normal";
  return (
    <AppShell title="Processos" subtitle="Criticidade operacional e cobertura documental">
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={add} className="space-y-4 rounded-lg border bg-card p-5 xl:sticky xl:top-6 xl:self-start">
          <h2 className="font-bold">Novo processo</h2>
          <label className="block text-sm font-semibold">Nome<Input className="mt-1.5" placeholder="Ex.: Fechamento mensal" value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label className="block text-sm font-semibold">Área<Input className="mt-1.5" list="proc-areas" placeholder="Ex.: Financeiro" value={area} onChange={(e) => setArea(e.target.value)} required /><datalist id="proc-areas">{areas.map((a) => <option key={a} value={a} />)}</datalist></label>
          <label className="block text-sm font-semibold">Descrição<textarea className="mt-1.5 min-h-24 w-full rounded-md border bg-background p-3 text-sm font-normal" placeholder="O que o processo faz" value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">Criticidade<select className={sel} value={level} onChange={(e) => setLevel(e.target.value as Level)}>{["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((x) => <option key={x} value={x}>{riskLabel[x]}</option>)}</select></label>
            <label className="block text-sm font-semibold">Documentação<select className={sel} value={doc} onChange={(e) => setDoc(e.target.value as Doc)}>{["NONE", "PARTIAL", "COMPLETE"].map((x) => <option key={x} value={x}>{docLabel[x]}</option>)}</select></label>
          </div>
          <Button className="w-full" disabled={!company || saving}>{saving ? "Salvando..." : "Adicionar processo"}</Button>
        </form>
        <div>
          <SearchBox value={q} onChange={setQ} placeholder="Buscar por nome, área ou descrição" count={shown.length} />
          <div className="mb-4 flex flex-wrap gap-2">
            {(["ALL", ...order] as const).map((x) => (
              <button key={x} type="button" onClick={() => setFilter(x)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${filter === x ? "border-primary bg-primary text-primary-foreground" : "bg-card text-muted-foreground"}`}>
                {x === "ALL" ? "Todas" : riskLabel[x]} ({x === "ALL" ? rows.length : rows.filter((r) => r.criticality === x).length})
              </button>
            ))}
          </div>
          <div className="grid content-start gap-3 sm:grid-cols-2">
            {shown.map((r) => (
              <article key={r.id} className="rounded-lg border bg-card p-5">
                <div className="flex items-start justify-between gap-3"><h3 className="font-bold">{r.name}</h3><span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${riskTone[r.criticality]}`}>{riskLabel[r.criticality]}</span></div>
                <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
                <div className="mt-5 flex justify-between gap-2 text-xs"><span>{r.area}</span><span className={r.documentation_level === "NONE" ? "font-semibold text-destructive" : ""}>Documentação: {docLabel[r.documentation_level]}</span></div>
              </article>
            ))}
            {shown.length === 0 && <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground sm:col-span-2">{rows.length ? "Nenhum processo com esses filtros." : "Nenhum processo cadastrado."}</p>}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

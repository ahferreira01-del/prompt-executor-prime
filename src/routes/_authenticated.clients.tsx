import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { brl, matches } from "@/lib/labels";

const d = "Clientes e receita monitorada para análise de exposição.";
export const Route = createFileRoute("/_authenticated/clients")({
  head: () => ({ meta: [{ title: "Clientes — Knowledge Risk" }, { name: "description", content: d }, { property: "og:title", content: "Clientes — Knowledge Risk" }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Clients,
});

function Clients() {
  const { company } = useWorkspace();
  const [rows, setRows] = useState<{ id: string; name: string; annual_revenue: number | null }[]>([]);
  const [name, setName] = useState(""), [revenue, setRevenue] = useState("");
  const [q, setQ] = useState(""), [byRevenue, setByRevenue] = useState(false), [saving, setSaving] = useState(false);
  async function load() {
    if (!company) return;
    const { data, error } = await supabase.from("clients").select("id,name,annual_revenue").eq("company_id", company.id).order("name");
    if (error) toast.error("Não foi possível carregar os clientes.");
    setRows(data ?? []);
  }
  useEffect(() => { void load(); }, [company]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("clients").insert({ company_id: company.id, name: name.trim(), annual_revenue: Math.max(0, Number(revenue)) });
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar o cliente.");
    toast.success(`${name.trim()} adicionado.`);
    setName(""); setRevenue("");
    await load();
  }
  const total = rows.reduce((s, r) => s + Number(r.annual_revenue ?? 0), 0);
  const shown = rows.filter((r) => matches(q, r.name)).sort((a, b) => (byRevenue ? Number(b.annual_revenue ?? 0) - Number(a.annual_revenue ?? 0) : 0));
  return (
    <AppShell title="Clientes" subtitle="Receita vinculada ao conhecimento crítico">
      <form onSubmit={add} className="mb-6 grid max-w-3xl gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block text-sm font-semibold">Cliente<Input className="mt-1.5" placeholder="Nome do cliente" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        <label className="block text-sm font-semibold">Receita anual (R$)<Input className="mt-1.5" type="number" min="0" step="0.01" placeholder="Ex.: 250000" value={revenue} onChange={(e) => setRevenue(e.target.value)} required /></label>
        <Button disabled={!company || saving}>{saving ? "Salvando..." : "Adicionar"}</Button>
        {revenue && <p className="text-xs text-muted-foreground sm:col-span-3">{brl(Math.max(0, Number(revenue)))}</p>}
      </form>
      <SearchBox value={q} onChange={setQ} placeholder="Buscar cliente" count={shown.length} />
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr><th className="p-4">Cliente</th><th className="p-4 text-right"><button type="button" onClick={() => setByRevenue((v) => !v)} className="inline-flex items-center gap-1 uppercase" title="Ordenar por receita">Receita anual<ArrowDownUp className={`size-3.5 ${byRevenue ? "text-primary" : ""}`} /></button></th></tr>
          </thead>
          <tbody>
            {shown.map((r) => <tr key={r.id} className="border-t hover:bg-muted/40"><td className="p-4 font-semibold">{r.name}</td><td className="p-4 text-right tabular-nums">{brl(Number(r.annual_revenue ?? 0))}</td></tr>)}
            {!shown.length && <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">{rows.length ? "Nenhum resultado para a busca." : "Nenhum cliente cadastrado."}</td></tr>}
          </tbody>
          {rows.length > 0 && <tfoot className="border-t bg-muted/50 font-bold"><tr><td className="p-4">Receita total monitorada</td><td className="p-4 text-right tabular-nums">{brl(total)}</td></tr></tfoot>}
        </table>
      </div>
    </AppShell>
  );
}

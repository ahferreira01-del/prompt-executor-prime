import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cpu, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { matches } from "@/lib/labels";

const d = "Tecnologias essenciais e dependências de conhecimento.";
export const Route = createFileRoute("/_authenticated/technologies")({
  head: () => ({ meta: [{ title: "Tecnologias — Knowledge Risk" }, { name: "description", content: d }, { property: "og:title", content: "Tecnologias — Knowledge Risk" }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Technologies,
});

function Technologies() {
  const { company } = useWorkspace();
  const [rows, setRows] = useState<{ id: string; name: string }[]>([]);
  const [name, setName] = useState(""), [q, setQ] = useState(""), [saving, setSaving] = useState(false);
  async function load() {
    if (!company) return;
    const { data, error } = await supabase.from("technologies").select("id,name").eq("company_id", company.id).order("name");
    if (error) toast.error("Não foi possível carregar as tecnologias.");
    setRows(data ?? []);
  }
  useEffect(() => { void load(); }, [company]);
  const duplicate = rows.some((r) => r.name.toLowerCase() === name.trim().toLowerCase());
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !name.trim()) return;
    if (duplicate) return void toast.error("Essa tecnologia já está cadastrada.");
    setSaving(true);
    const { error } = await supabase.from("technologies").insert({ company_id: company.id, name: name.trim() });
    setSaving(false);
    if (error) return void toast.error(error.code === "23505" ? "Essa tecnologia já está cadastrada." : "Não foi possível salvar a tecnologia.");
    toast.success(`${name.trim()} adicionada.`);
    setName("");
    await load();
  }
  const shown = rows.filter((r) => matches(q, r.name));
  return (
    <AppShell title="Tecnologias" subtitle="Ferramentas e plataformas que sustentam a operação">
      <form onSubmit={add} className="mb-6 max-w-xl rounded-lg border bg-card p-4">
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="tech-name">Nova tecnologia</label>
        <div className="flex gap-3">
          <Input id="tech-name" placeholder="Ex.: SAP, Power BI" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button disabled={!company || saving || duplicate}><Plus className="size-4" />Adicionar</Button>
        </div>
        {duplicate && <p className="mt-2 text-xs text-destructive">Essa tecnologia já está cadastrada.</p>}
      </form>
      <SearchBox value={q} onChange={setQ} placeholder="Buscar tecnologia" count={shown.length} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((r) => <div key={r.id} className="flex items-center gap-3 rounded-lg border bg-card p-5"><Cpu className="size-5 text-primary" /><strong>{r.name}</strong></div>)}
        {!shown.length && <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">{rows.length ? "Nenhum resultado para a busca." : "Nenhuma tecnologia cadastrada."}</p>}
      </div>
    </AppShell>
  );
}

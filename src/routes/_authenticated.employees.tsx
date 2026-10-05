import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { SearchBox } from "@/components/search-box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { matches } from "@/lib/labels";

type Employee = Database["public"]["Tables"]["employees"]["Row"];
const d = "Pessoas, funções e tempo de empresa para o mapa de conhecimento.";
export const Route = createFileRoute("/_authenticated/employees")({
  head: () => ({ meta: [{ title: "Colaboradores — Knowledge Risk" }, { name: "description", content: d }, { property: "og:title", content: "Colaboradores — Knowledge Risk" }, { property: "og:description", content: d }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Employees,
});

function tenure(m: number) {
  const y = Math.floor(m / 12), r = m % 12;
  return [y && `${y} ano${y > 1 ? "s" : ""}`, r && `${r} ${r > 1 ? "meses" : "mês"}`].filter(Boolean).join(" e ") || "Menos de 1 mês";
}

function Employees() {
  const { company } = useWorkspace();
  const [rows, setRows] = useState<Employee[]>([]);
  const [name, setName] = useState(""), [job, setJob] = useState(""), [area, setArea] = useState(""), [months, setMonths] = useState("");
  const [q, setQ] = useState(""), [saving, setSaving] = useState(false);
  async function load() {
    if (!company) return;
    const { data, error } = await supabase.from("employees").select("*").eq("company_id", company.id).eq("active", true).order("name");
    if (error) toast.error("Não foi possível carregar os colaboradores.");
    setRows(data ?? []);
  }
  useEffect(() => { void load(); }, [company]);
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!company || !name.trim() || !job.trim() || !area.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("employees").insert({ company_id: company.id, name: name.trim(), job_title: job.trim(), area: area.trim(), tenure_months: Math.max(0, Number(months)) });
    setSaving(false);
    if (error) return void toast.error("Não foi possível salvar o colaborador.");
    toast.success(`${name.trim()} adicionado.`);
    setName(""); setJob(""); setArea(""); setMonths("");
    await load();
  }
  async function deactivate(r: Employee) {
    const { error } = await supabase.from("employees").update({ active: false }).eq("id", r.id);
    if (error) return void toast.error("Não foi possível desativar.");
    toast.success(`${r.name} foi desativado. O histórico foi mantido.`);
    await load();
  }
  const areas = [...new Set(rows.map((r) => r.area))];
  const shown = rows.filter((r) => matches(q, r.name, r.job_title, r.area));
  return (
    <AppShell title="Colaboradores" subtitle="Pessoas ativas e conhecimento organizacional">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={add} className="space-y-4 rounded-lg border bg-card p-5 xl:sticky xl:top-6 xl:self-start">
          <div className="flex items-center gap-2"><UserPlus className="size-5 text-primary" /><h2 className="font-bold">Novo colaborador</h2></div>
          <label className="block text-sm font-semibold">Nome<Input className="mt-1.5" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} required /></label>
          <label className="block text-sm font-semibold">Cargo<Input className="mt-1.5" placeholder="Ex.: Analista de sistemas" value={job} onChange={(e) => setJob(e.target.value)} required /></label>
          <label className="block text-sm font-semibold">Área<Input className="mt-1.5" list="areas" placeholder="Ex.: Financeiro" value={area} onChange={(e) => setArea(e.target.value)} required /><datalist id="areas">{areas.map((a) => <option key={a} value={a} />)}</datalist></label>
          <label className="block text-sm font-semibold">Tempo de empresa (meses)<Input className="mt-1.5" type="number" min="0" placeholder="Ex.: 24" value={months} onChange={(e) => setMonths(e.target.value)} required />{months && <span className="mt-1 block text-xs font-normal text-muted-foreground">{tenure(Math.max(0, Number(months)))}</span>}</label>
          <Button className="w-full" disabled={!company || saving}>{saving ? "Salvando..." : "Adicionar"}</Button>
        </form>
        <div>
          <SearchBox value={q} onChange={setQ} placeholder="Buscar por nome, cargo ou área" count={shown.length} />
          <div className="overflow-hidden rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="p-4">Nome</th><th className="p-4">Função</th><th className="hidden p-4 md:table-cell">Área</th><th className="hidden p-4 lg:table-cell">Tempo</th><th className="p-4 text-right">Ação</th></tr></thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/40">
                    <td className="p-4 font-semibold">{r.name}</td><td className="p-4">{r.job_title}</td><td className="hidden p-4 md:table-cell">{r.area}</td><td className="hidden p-4 text-muted-foreground lg:table-cell">{tenure(r.tenure_months)}</td>
                    <td className="p-4 text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Desativar colaborador" aria-label={`Desativar ${r.name}`}><UserMinus className="size-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Desativar {r.name}?</AlertDialogTitle><AlertDialogDescription>A pessoa sai da lista de ativos, mas todo o histórico e os cálculos anteriores são mantidos.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => void deactivate(r)}>Desativar</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && <tr><td className="p-8 text-center text-muted-foreground" colSpan={5}>{rows.length ? "Nenhum resultado para a busca." : "Nenhum colaborador ativo. Cadastre o primeiro ao lado."}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export const riskLabel: Record<string, string> = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", CRITICAL: "Crítica" };
export const docLabel: Record<string, string> = { NONE: "Inexistente", PARTIAL: "Parcial", COMPLETE: "Completa" };
export const riskTone: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground",
  MEDIUM: "bg-accent/20 text-foreground",
  HIGH: "bg-destructive/15 text-destructive",
  CRITICAL: "bg-destructive text-destructive-foreground",
};
export const matches = (q: string, ...fields: (string | null | undefined)[]) => {
  const s = q.trim().toLowerCase();
  return !s || fields.some((f) => (f ?? "").toLowerCase().includes(s));
};
export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

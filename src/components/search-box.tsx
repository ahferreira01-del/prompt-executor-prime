import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchBox({ value, onChange, placeholder, count }: { value: string; onChange: (v: string) => void; placeholder: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label={placeholder} className="pl-9" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
      <span className="shrink-0 text-sm text-muted-foreground">{count} {count === 1 ? "item" : "itens"}</span>
    </div>
  );
}

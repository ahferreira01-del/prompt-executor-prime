import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
export type Company = { id:string; name:string; segment:string; employee_count:number };
export function useWorkspace() {
 const [company,setCompany]=useState<Company|null>(null); const [loading,setLoading]=useState(true);
 const refresh=useCallback(async()=>{ setLoading(true); const {data}=await supabase.from("companies").select("id,name,segment,employee_count").order("created_at").limit(1).maybeSingle(); setCompany(data); setLoading(false); },[]);
 useEffect(()=>{ void refresh(); },[refresh]);
 return {company,loading,refresh};
}

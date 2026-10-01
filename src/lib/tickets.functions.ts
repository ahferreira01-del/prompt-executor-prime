import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ticketInput=z.object({companyId:z.string().uuid(),content:z.string().min(10).max(8000),employeeId:z.string().uuid().nullable()});
export const classifyTicket=createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((input)=>ticketInput.parse(input)).handler(async({data,context})=>{
  const response=await fetch("https://ai.gateway.lovable.dev/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${process.env['LOVABLE_API_KEY']!}`,"Content-Type":"application/json"},body:JSON.stringify({model:"openai/gpt-6-astra",messages:[{role:"system",content:"Classifique o chamado corporativo. Responda somente JSON válido com technology, category e subject, cada campo curto. Não faça cálculos de risco."},{role:"user",content:data.content}],response_format:{type:"json_object"}})});
  let classification={technology:"Não identificada",category:"Geral",subject:"Chamado não classificado"};
  if(response.ok){const raw=await response.json() as {choices?:Array<{message?:{content?:string}}>};const text=raw.choices?.[0]?.message?.content;if(text){try{const parsed=JSON.parse(text) as Partial<typeof classification>;classification={technology:String(parsed.technology??classification.technology),category:String(parsed.category??classification.category),subject:String(parsed.subject??classification.subject)}}catch{classification.subject=text.slice(0,120)}}}
  const{data:ticket,error}=await context.supabase.from("tickets").insert({company_id:data.companyId,content:data.content,employee_id:data.employeeId}).select("id").single();if(error)throw new Error("Não foi possível salvar o chamado.");
  const{error:classificationError}=await context.supabase.from("ticket_classifications").insert({company_id:data.companyId,ticket_id:ticket.id,...classification});if(classificationError)throw new Error("Não foi possível salvar a classificação.");
  return{ticketId:ticket.id,...classification};
});
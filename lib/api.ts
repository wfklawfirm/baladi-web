const BASE = process.env.NEXT_PUBLIC_API_URL || "https://web-production-f481a.up.railway.app";
function authHeaders(token: string) { return { "Content-Type": "application/json", Authorization: `Bearer ${token}` }; }

export async function login(username: string, password: string) {
  const res = await fetch(`${BASE}/api/login`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,password}) });
  if (!res.ok) throw new Error((await res.json()).detail||"فشل تسجيل الدخول");
  return res.json() as Promise<{access_token:string;username:string;municipality:string}>;
}
export async function register(username: string, password: string, municipality: string) {
  const res = await fetch(`${BASE}/api/register`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username,password,municipality}) });
  if (!res.ok) throw new Error((await res.json()).detail||"فشل إنشاء الحساب");
  return res.json();
}
export function streamAsk(token: string, question: string, onChunk: (c:string)=>void): ()=>void {
  const ctrl = new AbortController();
  (async()=>{ try {
    const res = await fetch(`${BASE}/api/ask`,{method:"POST",headers:authHeaders(token),body:JSON.stringify({question}),signal:ctrl.signal});
    const reader=res.body!.getReader(); const dec=new TextDecoder();
    while(true){const{done,value}=await reader.read();if(done)break;const text=dec.decode(value);for(const line of text.split("\n")){if(line.startsWith("data: ")){const d=line.slice(6);if(d==="[DONE]")break;try{onChunk(JSON.parse(d).content??"");}catch{}}}}
  }catch(e:unknown){if(e instanceof Error&&e.name!=="AbortError")throw e;}})();
  return ()=>ctrl.abort();
}
export async function listProcedures(token:string){const res=await fetch(`${BASE}/api/procedures`,{headers:authHeaders(token)});if(!res.ok)throw new Error("تعذّر تحميل الإجراءات");return res.json();}
export async function startWorkflow(token:string,procedure_id:string,municipality:string){const res=await fetch(`${BASE}/api/workflows/start`,{method:"POST",headers:authHeaders(token),body:JSON.stringify({procedure_id,municipality})});if(!res.ok)throw new Error("تعذّر بدء سير العمل");return res.json();}
export async function advanceWorkflow(token:string,workflow_id:string,action:string){const res=await fetch(`${BASE}/api/workflows/${workflow_id}/advance`,{method:"POST",headers:authHeaders(token),body:JSON.stringify({action})});if(!res.ok)throw new Error("تعذّر تقديم الخطوة");return res.json();}
export async function listTemplates(token:string){const res=await fetch(`${BASE}/api/document-templates`,{headers:authHeaders(token)});if(!res.ok)throw new Error("تعذّر تحميل القوالب");return res.json();}
export async function generateDocumentAI(token:string,template_id:string,context:string,municipality:string){const res=await fetch(`${BASE}/api/documents/generate-ai`,{method:"POST",headers:authHeaders(token),body:JSON.stringify({template_id,context,municipality})});if(!res.ok)throw new Error("تعذّر توليد المستند");return res.json();}
export async function createMeeting(token:string,data:any){const res=await fetch(`${BASE}/api/meetings`,{method:"POST",headers:authHeaders(token),body:JSON.stringify(data)});if(!res.ok)throw new Error("تعذّر إنشاء الاجتماع");return res.json();}
export async function listMeetings(token:string){const res=await fetch(`${BASE}/api/meetings`,{headers:authHeaders(token)});if(!res.ok)throw new Error("تعذّر تحميل الاجتماعات");return res.json();}
export async function generateMinutes(token:string,meeting_id:string,notes:string){const res=await fetch(`${BASE}/api/meetings/${meeting_id}/generate-minutes`,{method:"POST",headers:authHeaders(token),body:JSON.stringify({notes})});if(!res.ok)throw new Error("تعذّر توليد المحضر");return res.json();}
export async function classifyProcurement(token:string,description:string,estimated_value:number,contract_type:string){const res=await fetch(`${BASE}/api/procurement/classify`,{method:"POST",headers:authHeaders(token),body:JSON.stringify({description,estimated_value,contract_type})});if(!res.ok)throw new Error("تعذّر تصنيف المشتريات");return res.json();}

export interface ProcedureSummary{id:string;name:string;category:string;description:string;estimated_days:number;step_count:number;}
export interface ProcedureStep{step:number;title:string;description:string;responsible_party:string;duration_days:number;documents_needed:string[];}
export interface WorkflowState{workflow_id:string;procedure_id:string;procedure_name:string;municipality:string;current_step:number;total_steps:number;status:string;current_step_info:ProcedureStep;completed_steps:number[];progress_percent:number;started_at:string;updated_at:string;}
export interface TemplateSummary{id:string;name:string;category:string;description:string;field_count:number;}
export interface GeneratedDocument{document_id:string;template_id:string;template_name:string;fields:Record<string,string>;content:string;municipality:string;generated_at:string;}
export interface Meeting{meeting_id:string;title:string;municipality:string;meeting_date:string;agenda_items:string[];attendees:string[];status:string;created_at:string;minutes?:string;}
export interface ProcurementResult{contract_type:string;estimated_value:number;procedure:string;approving_authority:string;committee_required:boolean;legal_basis:string;required_steps:string[];timeline_days:number;notes:string;warning?:string;}

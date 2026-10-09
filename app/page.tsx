"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { loadSession, clearSession, UserSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { LandingView } from "@/components/LandingView";
import { streamAsk, listProcedures, startWorkflow, advanceWorkflow, listTemplates, generateDocumentAI, createMeeting, listMeetings, generateMinutes, classifyProcurement, WorkflowState, TemplateSummary, Meeting, ProcurementResult, ProcedureSummary } from "@/lib/api";

type View = "home"|"chat"|"procedures"|"documents"|"meetings"|"procurement";
interface Msg { role:"user"|"assistant"; content:string; streaming?:boolean; }
const card:React.CSSProperties={background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"20px 22px",marginBottom:14};
const btnP:React.CSSProperties={background:"var(--primary)",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",cursor:"pointer",fontFamily:"var(--font-arabic),sans-serif",fontSize:14,fontWeight:600};
const inp:React.CSSProperties={width:"100%",padding:"10px 13px",border:"1px solid var(--border)",borderRadius:8,fontFamily:"var(--font-arabic),sans-serif",fontSize:14,color:"var(--text-primary)",background:"#fff",direction:"rtl"};

function Spin(){return(<div style={{display:"flex",justifyContent:"center",padding:"80px 0"}}><div style={{width:32,height:32,border:"3px solid var(--border)",borderTopColor:"var(--primary)",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/></div>);}

function ChatView({token}:{token:string}){
  const [msgs,setMsgs]=useState<Msg[]>([]);
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const stopRef=useRef<(()=>void)|null>(null);
  const btm=useRef<HTMLDivElement>(null);
  const send=()=>{
    const q=input.trim();if(!q||loading)return;
    setInput("");setLoading(true);
    setMsgs(p=>[...p,{role:"user",content:q},{role:"assistant",content:"",streaming:true}]);
    let buf="";
    stopRef.current=streamAsk(token,q,(chunk)=>{
      buf+=chunk;
      setMsgs(p=>{const c=[...p];c[c.length-1]={role:"assistant",content:buf,streaming:true};return c;});
    });
    setTimeout(()=>{setMsgs(p=>{const c=[...p];if(c[c.length-1]?.streaming)c[c.length-1]={...c[c.length-1],streaming:false};return c;});setLoading(false);},8000);
  };
  useEffect(()=>{btm.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  return(
    <div style={{display:"flex",flexDirection:"column",height:"100vh",maxWidth:760,margin:"0 auto",padding:"24px 24px 0"}}>
      <h2 style={{fontWeight:700,fontSize:20,color:"var(--navy)",marginBottom:20}}>الاستشارة القانونية</h2>
      <div style={{flex:1,overflowY:"auto",paddingBottom:20}}>
        {msgs.length===0&&<div style={{textAlign:"center",padding:"60px 0",color:"var(--text-muted)"}}><div style={{fontSize:40,marginBottom:12}}>⚖️</div><div>اطرح سؤالك القانوني أو الإداري البلدي</div></div>}
        {msgs.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-start":"flex-end",marginBottom:14}}>
            <div style={{maxWidth:"82%",background:m.role==="user"?"var(--primary)":"var(--card)",color:m.role==="user"?"#fff":"var(--text-primary)",border:m.role==="assistant"?"1px solid var(--border)":"none",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"13px 16px",lineHeight:1.85,fontSize:14,direction:"rtl",textAlign:"right"}}>
              <div dangerouslySetInnerHTML={{__html:m.content.replace(/\n/g,"<br/>")}}/>
              {m.streaming&&<span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:"currentColor",opacity:0.5,marginRight:4}}>▋</span>}
            </div>
          </div>
        ))}
        <div ref={btm}/>
      </div>
      <div style={{padding:"14px 0 20px",borderTop:"1px solid var(--border)",display:"flex",gap:10}}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder="اكتب سؤالك القانوني هنا..." rows={2} style={{...inp,resize:"none",lineHeight:1.6,flex:1}}/>
        <button onClick={send} disabled={loading||!input.trim()} style={{...btnP,opacity:(loading||!input.trim())?0.5:1,flexShrink:0,alignSelf:"flex-end"}}>{loading?"...":"إرسال"}</button>
      </div>
    </div>
  );
}

function MeetingsView({token,municipality}:{token:string;municipality:string}){
  const [meets,setMeets]=useState<Meeting[]>([]);
  const [loading,setLoading]=useState(true);const [showC,setShowC]=useState(false);
  const [form,setForm]=useState({title:"",date:"",agenda:""});
  const [sel,setSel]=useState<Meeting|null>(null);const [notes,setNotes]=useState("");const [mins,setMins]=useState("");const [gen,setGen]=useState(false);
  const load=()=>listMeetings(token).then(r=>{setMeets(r.meetings);setLoading(false);}).catch(()=>setLoading(false));
  useEffect(()=>{load();},[token]);
  const create=async()=>{if(!form.title||!form.date)return;await createMeeting(token,{title:form.title,municipality,meeting_date:form.date,agenda_items:form.agenda.split("\n").filter(Boolean)});setForm({title:"",date:"",agenda:""});setShowC(false);load();};
  const genMins=async()=>{if(!sel)return;setGen(true);const r=await generateMinutes(token,sel.meeting_id,notes);setMins(r.minutes);setGen(false);};
  if(loading)return<Spin/>;
  return(
    <div style={{maxWidth:820,margin:"0 auto",padding:"24px 24px 80px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
        <div><h2 style={{fontWeight:700,fontSize:20,color:"var(--navy)",marginBottom:4}}>جلسات المجلس</h2><p style={{color:"var(--text-muted)",fontSize:13.5}}>إدارة اجتماعات مجلس البلدية</p></div>
        <button onClick={()=>setShowC(!showC)} style={btnP}>+ جلسة جديدة</button>
      </div>
      {showC&&<div style={{...card,marginBottom:24,background:"#fafbfc"}}>
        <h3 style={{fontWeight:700,fontSize:15,color:"var(--navy)",marginBottom:16}}>إنشاء جلسة جديدة</h3>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="عنوان الجلسة" style={inp}/>
          <input value={form.date} onChange={e=>setForm({...form,date:e.target.value})} type="datetime-local" style={inp}/>
          <textarea value={form.agenda} onChange={e=>setForm({...form,agenda:e.target.value})} placeholder="بنود جدول الأعمال (سطر لكل بند)" rows={4} style={{...inp,resize:"vertical"}}/>
          <div style={{display:"flex",gap:8}}><button onClick={create} style={btnP}>إنشاء</button><button onClick={()=>setShowC(false)} style={{...btnP,background:"transparent",color:"var(--text-secondary)",border:"1px solid var(--border)"}}>إلغاء</button></div>
        </div>
      </div>}
      {sel?(
        <div>
          <button onClick={()=>{setSel(null);setMins("");}} style={{...btnP,background:"transparent",color:"var(--primary)",border:"1px solid var(--primary)",marginBottom:20}}>← العودة</button>
          <div style={card}>
            <h3 style={{fontWeight:700,fontSize:17,color:"var(--navy)",marginBottom:8}}>{sel.title}</h3>
            <p style={{fontSize:13,color:"var(--text-muted)",marginBottom:16}}>{new Date(sel.meeting_date).toLocaleString("ar-LB")}</p>
            <h4 style={{fontWeight:600,fontSize:14,marginBottom:8}}>جدول الأعمال:</h4>
            <ul style={{paddingRight:20,marginBottom:20}}>{sel.agenda_items.map((a,i)=><li key={i} style={{fontSize:13.5,color:"var(--text-secondary)",lineHeight:1.8}}>{a}</li>)}</ul>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="ملاحظات الجلسة..." rows={4} style={{...inp,resize:"vertical",marginBottom:12}}/>
            <button onClick={genMins} disabled={gen} style={{...btnP,opacity:gen?0.5:1}}>{gen?"جاري التوليد...":"توليد المحضر بالذكاء الاصطناعي"}</button>
          </div>
          {mins&&<div style={{...card,marginTop:16}}><h4 style={{fontWeight:700,fontSize:15,color:"var(--navy)",marginBottom:12}}>محضر الجلسة</h4><pre style={{whiteSpace:"pre-wrap",fontFamily:"var(--font-arabic),sans-serif",fontSize:13.5,lineHeight:2,direction:"rtl"}}>{mins}</pre></div>}
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {meets.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--text-muted)"}}>لا توجد جلسات. أنشئ جلسة جديدة.</div>}
          {meets.map(m=><div key={m.meeting_id} onClick={()=>setSel(m)} style={{...card,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:0}}>
            <div><div style={{fontWeight:600,fontSize:15}}>{m.title}</div><div style={{fontSize:12.5,color:"var(--text-muted)",marginTop:3}}>{new Date(m.meeting_date).toLocaleDateString("ar-LB")} · {m.agenda_items.length} بنود</div></div>
            <span style={{fontSize:11.5,fontWeight:600,padding:"4px 10px",borderRadius:20,background:m.status==="completed"?"#f0faf4":"#fff8f0",color:m.status==="completed"?"#2d7a4f":"#9a5a10"}}>{m.status==="completed"?"مكتملة":"قادمة"}</span>
          </div>)}
        </div>
      )}
    </div>
  );
}

function ProcurementView({token}:{token:string}){
  const [form,setForm]=useState({description:"",value:"",type:"توريد"});
  const [result,setResult]=useState<ProcurementResult|null>(null);const [loading,setLoading]=useState(false);
  const classify=async()=>{setLoading(true);setResult(null);try{setResult(await classifyProcurement(token,form.description,parseFloat(form.value),form.type));}finally{setLoading(false);}};
  return(
    <div style={{maxWidth:760,margin:"0 auto",padding:"24px 24px 80px"}}>
      <h2 style={{fontWeight:700,fontSize:20,color:"var(--navy)",marginBottom:6}}>المشتريات العامة</h2>
      <p style={{color:"var(--text-muted)",fontSize:13.5,marginBottom:24}}>تصنيف إجراءات الشراء وفق قانون 244/2021</p>
      <div style={card}>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={{fontSize:13.5,color:"var(--text-secondary)",display:"block",marginBottom:6}}>نوع العقد</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{...inp,width:"auto"}}><option value="توريد">توريد</option><option value="خدمات">خدمات</option><option value="أعمال">أعمال</option></select></div>
          <div><label style={{fontSize:13.5,color:"var(--text-secondary)",display:"block",marginBottom:6}}>القيمة التقديرية (ل.ل.)</label><input value={form.value} onChange={e=>setForm({...form,value:e.target.value})} type="number" placeholder="75000000" style={inp}/></div>
          <div><label style={{fontSize:13.5,color:"var(--text-secondary)",display:"block",marginBottom:6}}>وصف الشراء</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="صف البضاعة أو الخدمة المطلوبة..." rows={3} style={{...inp,resize:"vertical"}}/></div>
          <button onClick={classify} disabled={loading||!form.description||!form.value} style={{...btnP,opacity:(loading||!form.description||!form.value)?0.5:1,alignSelf:"flex-start"}}>{loading?"جاري التصنيف...":"تصنيف الإجراء"}</button>
        </div>
      </div>
      {result&&<div style={{...card,marginTop:20}}>
        <h3 style={{fontWeight:700,fontSize:16,color:"var(--navy)",marginBottom:16}}>نتيجة التصنيف</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          {[{label:"الإجراء المطلوب",value:result.procedure},{label:"جهة الإقرار",value:result.approving_authority},{label:"المدة التقديرية",value:`${result.timeline_days} يوم`},{label:"لجنة الفحص",value:result.committee_required?"مطلوبة":"غير مطلوبة"}].map(x=>(
            <div key={x.label} style={{background:"var(--bg)",borderRadius:8,padding:"10px 14px"}}><div style={{fontSize:11.5,color:"var(--text-muted)",marginBottom:3}}>{x.label}</div><div style={{fontWeight:600,fontSize:14,color:"var(--navy)"}}>{x.value}</div></div>
          ))}
        </div>
        <div style={{marginBottom:12}}><div style={{fontSize:12.5,color:"var(--text-muted)",marginBottom:4}}>الأساس القانوني:</div><div style={{fontSize:13.5,color:"var(--text-secondary)"}}>{result.legal_basis}</div></div>
        <div><div style={{fontSize:12.5,color:"var(--text-muted)",marginBottom:6}}>الخطوات المطلوبة:</div><ul style={{paddingRight:20}}>{result.required_steps.map((s,i)=><li key={i} style={{fontSize:13.5,color:"var(--text-secondary)",lineHeight:1.8}}>{s}</li>)}</ul></div>
        {result.warning&&<div style={{marginTop:14,padding:"10px 14px",background:"#fffbf0",border:"1px solid #f0d060",borderRadius:8,fontSize:12.5,color:"#7a5a10"}}>⚠️ {result.warning}</div>}
      </div>}
    </div>
  );
}

export default function HomePage(){
  const router=useRouter();
  const [session,setSession]=useState<UserSession|null>(null);
  const [view,setView]=useState<View>("home");
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{setMounted(true);const s=loadSession();if(!s){router.push("/login");return;}setSession(s);},[router]);
  if(!mounted||!session)return null;
  return(
    <div style={{display:"flex",minHeight:"100vh",background:"var(--bg)"}}>
      <Sidebar session={session} activeView={view} onNavigate={setView} onLogout={()=>router.push("/login")}/>
      <main style={{flex:1,overflowY:"auto",minHeight:"100vh"}}>
        {view==="home"&&<LandingView municipality={session.municipality} username={session.username} onNavigate={setView}/>}
        {view==="chat"&&<ChatView token={session.token}/>}
        {view==="procedures"&&<ProceduresView token={session.token} municipality={session.municipality}/>}
        {view==="documents"&&<DocumentsView token={session.token} municipality={session.municipality}/>}
        {view==="meetings"&&<MeetingsView token={session.token} municipality={session.municipality}/>}
        {view==="procurement"&&<ProcurementView token={session.token}/>}
      </main>
    </div>
  );
}

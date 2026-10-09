"use client";
import { useState } from "react";
import { clearSession, UserSession } from "@/lib/auth";
type View = "home"|"chat"|"procedures"|"documents"|"meetings"|"procurement";
interface SidebarProps { session: UserSession; activeView: View; onNavigate: (v:View)=>void; onLogout: ()=>void; }
const NAV = [
  {view:"home" as View, label:"الرئيسية"},
  {view:"chat" as View, label:"استشارة قانونية"},
  {view:"procedures" as View, label:"إنجاز معاملة"},
  {view:"documents" as View, label:"إعداد مستند"},
  {view:"meetings" as View, label:"جلسات المجلس"},
  {view:"procurement" as View, label:"المشتريات العامة"},
];
export function Sidebar({session,activeView,onNavigate,onLogout}:SidebarProps){
  const [collapsed,setCollapsed]=useState(false);
  return(
    <aside style={{width:collapsed?60:240,minHeight:"100vh",background:"var(--navy)",display:"flex",flexDirection:"column",transition:"width 0.25s ease",flexShrink:0,position:"relative",zIndex:10}}>
      <div style={{padding:collapsed?"20px 0":"20px 16px",borderBottom:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:collapsed?"center":"space-between",gap:8}}>
        {!collapsed&&<div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:32,height:32,background:"var(--primary)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff"}}>ب</div><span style={{color:"#fff",fontWeight:700,fontSize:15}}>بلدي AI</span></div>}
        {collapsed&&<div style={{width:32,height:32,background:"var(--primary)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff"}}>ب</div>}
        <button onClick={()=>setCollapsed(!collapsed)} style={{background:"rgba(255,255,255,0.07)",border:"none",borderRadius:6,padding:"4px 6px",cursor:"pointer",color:"rgba(255,255,255,0.6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{collapsed?<polyline points="9 18 15 12 9 6"/>:<polyline points="15 18 9 12 15 6"/>}</svg>
        </button>
      </div>
      {!collapsed&&<div style={{margin:"12px 12px 4px",padding:"8px 10px",background:"rgba(255,255,255,0.05)",borderRadius:8,fontSize:12,color:"rgba(255,255,255,0.5)"}}><div style={{fontWeight:600,color:"rgba(255,255,255,0.8)",fontSize:13,marginBottom:2}}>{session.municipality}</div><div>{session.username}</div></div>}
      <nav style={{flex:1,padding:"8px",display:"flex",flexDirection:"column",gap:2}}>
        {NAV.map(item=>{const active=activeView===item.view;return(
          <button key={item.view} onClick={()=>onNavigate(item.view)} style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"9px 0":"9px 10px",justifyContent:collapsed?"center":"flex-start",borderRadius:8,border:"none",cursor:"pointer",background:active?"var(--primary)":"transparent",color:active?"#fff":"rgba(255,255,255,0.55)",fontFamily:"var(--font-arabic),sans-serif",fontSize:13.5,fontWeight:active?600:400,width:"100%",textAlign:"right"}}
            onMouseEnter={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.07)";}}
            onMouseLeave={e=>{if(!active)(e.currentTarget as HTMLButtonElement).style.background="transparent";}}>
            {!collapsed&&<span>{item.label}</span>}
            {collapsed&&<span style={{fontSize:10,color:"rgba(255,255,255,0.5)"}}>{item.label.slice(0,2)}</span>}
          </button>
        );})}
      </nav>
      <div style={{padding:"12px 8px",borderTop:"1px solid rgba(255,255,255,0.08)"}}>
        <button onClick={()=>{clearSession();onLogout();}} style={{display:"flex",alignItems:"center",gap:10,padding:collapsed?"9px 0":"9px 10px",justifyContent:collapsed?"center":"flex-start",borderRadius:8,border:"none",cursor:"pointer",background:"transparent",color:"rgba(255,255,255,0.4)",fontFamily:"var(--font-arabic),sans-serif",fontSize:13,width:"100%"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {!collapsed&&<span>خروج</span>}
        </button>
      </div>
    </aside>
  );
}

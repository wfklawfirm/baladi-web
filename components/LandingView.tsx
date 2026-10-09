"use client";
type View = "home"|"chat"|"procedures"|"documents"|"meetings"|"procurement";
interface LandingViewProps { municipality:string; username:string; onNavigate:(v:View)=>void; }
const CARDS=[
  {view:"chat" as View,title:"استشارة قانونية",subtitle:"اسأل عن أي مسألة قانونية أو إدارية بلدية",detail:"تفسير القوانين، استيضاح الإجراءات، أسئلة قانون البلديات",color:"#870E29"},
  {view:"procedures" as View,title:"إنجاز معاملة",subtitle:"تتبّع خطوات المعاملات البلدية خطوة بخطوة",detail:"قرارات المجلس، إشغال الأملاك، الشكاوى، المشتريات",color:"#14263D"},
  {view:"documents" as View,title:"إعداد مستند",subtitle:"أنشئ وثائق رسمية بالذكاء الاصطناعي",detail:"قرارات، محاضر، كتب رسمية، إعلانات مناقصات",color:"#2D5F8A"},
  {view:"meetings" as View,title:"جلسات المجلس",subtitle:"أدِر الاجتماعات وأنشئ المحاضر آلياً",detail:"جداول الأعمال، المحاضر التلقائية، قرارات الجلسات",color:"#4A7C59"},
];
const QQ=["ما هي شروط إصدار قرار مجلس بلدي؟","كيف تُعقد مناقصة عامة وفق قانون 244/2021؟","ما هي صلاحيات رئيس البلدية المنفردة؟","كيف تتم معالجة شكوى مواطن في البلدية؟"];
export function LandingView({municipality,username,onNavigate}:LandingViewProps){
  const h=new Date().getHours();
  const g=h<12?"صباح الخير":h<17?"مساء الخير":"مساء النور";
  return(
    <div style={{maxWidth:820,margin:"0 auto",padding:"40px 28px 80px"}}>
      <div style={{marginBottom:40}}>
        <h1 style={{fontSize:"clamp(1.4rem,3vw,2rem)",fontWeight:700,color:"var(--navy)",lineHeight:1.35,marginBottom:8}}>{g}، {username}</h1>
        <p style={{color:"var(--text-secondary)",fontSize:14.5}}>بلدية {municipality} — كيف يمكن لبلدي AI مساعدتك اليوم؟</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16,marginBottom:48}}>
        {CARDS.map(c=>(
          <button key={c.view} onClick={()=>onNavigate(c.view)}
            style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:14,padding:"22px 20px",cursor:"pointer",textAlign:"right",display:"flex",flexDirection:"column",gap:12,position:"relative",overflow:"hidden",transition:"box-shadow 0.18s,transform 0.18s"}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 8px 30px rgba(0,0,0,0.10)";e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}>
            <div style={{position:"absolute",top:0,right:0,width:4,height:"100%",background:c.color,borderRadius:"0 14px 14px 0"}}/>
            <div style={{width:48,height:48,background:c.color+"12",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",color:c.color,fontSize:22}}>◈</div>
            <div>
              <div style={{fontWeight:700,fontSize:16,color:"var(--text-primary)",marginBottom:5}}>{c.title}</div>
              <div style={{fontSize:13.5,color:"var(--text-secondary)",lineHeight:1.55,marginBottom:8}}>{c.subtitle}</div>
              <div style={{fontSize:12,color:"var(--text-muted)"}}>{c.detail}</div>
            </div>
          </button>
        ))}
      </div>
      <div>
        <h2 style={{fontSize:13.5,fontWeight:600,color:"var(--text-muted)",marginBottom:12}}>أسئلة شائعة</h2>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {QQ.map((q,i)=>(
            <button key={i} onClick={()=>onNavigate("chat")}
              style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:10,padding:"11px 14px",cursor:"pointer",textAlign:"right",color:"var(--text-primary)",fontSize:13.5,fontFamily:"var(--font-arabic),sans-serif",display:"flex",alignItems:"center",gap:10,transition:"background 0.15s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--bg-dark)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="var(--card)";}}>
              <span style={{color:"var(--primary)",flexShrink:0}}>؟</span>{q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

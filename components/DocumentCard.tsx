'use client'

import { useState } from 'react'
import {
  CheckCircle, XCircle, AlertCircle, Copy, Download, Printer,
  ChevronDown, ChevronUp, FileText, Users, Clock, AlertTriangle,
  Footprints, Star, ThumbsUp, ThumbsDown, GitBranch, Info,
  Gavel, ArrowRightLeft, HelpCircle, Building, Zap,
} from 'lucide-react'
import type { DocumentAnalysis, AnalysisOption, OptionType } from '@/lib/types'
import { loadSettings, applySettings } from '@/lib/settings'
import clsx from 'clsx'

interface Props { analysis: DocumentAnalysis }

// ── Option type styling ────────────────────────────────────────────────────
const OPTION_CONFIG: Record<OptionType, { label: string; icon: React.ReactNode; pill: string; border: string; bg: string }> = {
  approve:      { label: 'قبول',         icon: <CheckCircle size={14}/>,    pill: 'bg-emerald-100 text-emerald-700 border-emerald-200', border: 'border-emerald-300', bg: 'bg-emerald-50' },
  reject:       { label: 'رفض',          icon: <XCircle size={14}/>,         pill: 'bg-red-100 text-red-700 border-red-200',             border: 'border-red-300',     bg: 'bg-red-50'     },
  conditional:  { label: 'قبول مشروط',   icon: <GitBranch size={14}/>,       pill: 'bg-amber-100 text-amber-700 border-amber-200',       border: 'border-amber-300',   bg: 'bg-amber-50'   },
  refer:        { label: 'إحالة',        icon: <ArrowRightLeft size={14}/>,   pill: 'bg-blue-100 text-blue-700 border-blue-200',          border: 'border-blue-300',    bg: 'bg-blue-50'    },
  defer:        { label: 'تأجيل',        icon: <Clock size={14}/>,            pill: 'bg-slate-100 text-slate-600 border-slate-200',       border: 'border-slate-300',   bg: 'bg-slate-50'   },
  request_info: { label: 'استيضاح',     icon: <HelpCircle size={14}/>,       pill: 'bg-purple-100 text-purple-700 border-purple-200',    border: 'border-purple-300',  bg: 'bg-purple-50'  },
  council_vote: { label: 'إحالة للمجلس', icon: <Gavel size={14}/>,           pill: 'bg-navy/10 text-navy border-navy/20',               border: 'border-navy/30',     bg: 'bg-navy/5'     },
}

const VALIDITY_CONFIG = {
  valid:      { icon: <CheckCircle size={15}/>, label: 'الطلب صحيح قانونياً',         cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
  invalid:    { icon: <XCircle size={15}/>,     label: 'الطلب مرفوض / غير مستوفٍ',   cls: 'bg-red-50 border-red-200 text-red-700'             },
  needs_info: { icon: <AlertCircle size={15}/>, label: 'يحتاج معلومات إضافية',        cls: 'bg-amber-50 border-amber-200 text-amber-700'       },
}

const URGENCY_CONFIG: Record<string, { cls: string; dot: string }> = {
  'عاجل':        { cls: 'text-red-600 bg-red-50 border-red-200',   dot: 'bg-red-500'   },
  'عادي':        { cls: 'text-stone-600 bg-stone-50 border-stone-200', dot: 'bg-stone-400' },
  'غير_عاجل':   { cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-400' },
}

function printDecision(option: AnalysisOption, analysis: DocumentAnalysis) {
  const settings = loadSettings()
  const today    = new Date().toLocaleDateString('ar-LB', { year: 'numeric', month: 'long', day: 'numeric' })
  const mun      = settings.municipality ? `بلدية ${settings.municipality}` : 'بلدية [_______________]'
  const mayor    = settings.mayor        || '[رئيس البلدية]'
  const region   = settings.region       ? `قضاء ${settings.region}` : '[القضاء]'
  const phone    = settings.phone        || '[رقم الهاتف]'
  const filled   = applySettings(option.template, settings)

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><title>${option.title} — ${mun}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Naskh Arabic',Arial,sans-serif;direction:rtl;background:#fff;color:#1a1a1a;font-size:13pt;line-height:2;padding:36px 56px}
  .lh{text-align:center;border-bottom:3px double #8b1a2b;padding-bottom:14px;margin-bottom:22px}
  .lh h1{font-size:17pt;font-weight:700;color:#8b1a2b}.lh h2{font-size:13pt;font-weight:600;color:#333;margin-top:3px}
  .lh .ref{font-size:10pt;color:#555;margin-top:6px}
  .badge{display:inline-block;background:#8b1a2b;color:#fff;padding:3px 14px;border-radius:20px;font-size:11pt;font-weight:600;margin-bottom:18px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:18px;font-size:11pt}
  .grid .lbl{color:#666;font-weight:600}
  .section{margin-bottom:18px}.section h3{font-size:12pt;font-weight:700;color:#1a3a5c;border-bottom:1px solid #d0d8e4;padding-bottom:3px;margin-bottom:8px}
  .tmpl{background:#fafafa;border:1px solid #ccc;border-radius:6px;padding:18px 22px;white-space:pre-wrap;font-size:12pt;line-height:2.1}
  .sigs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:44px}
  .sig{text-align:center;border-top:1px solid #999;padding-top:7px;font-size:11pt;color:#444}
  .sig p.sp{margin-top:56px;color:#aaa;font-size:10pt}
  .footer{margin-top:44px;text-align:center;font-size:9pt;color:#aaa;border-top:1px solid #eee;padding-top:10px}
  @media print{body{padding:18px 36px}button{display:none!important}}
</style></head>
<body>
<div class="lh">
  <h1>الجمهورية اللبنانية</h1><h2>${mun}</h2>
  <div class="ref">${region} &nbsp;|&nbsp; ${phone}</div>
  <div class="ref">رقم: [___] / ${new Date().getFullYear()} &nbsp;|&nbsp; التاريخ: ${today}</div>
</div>
<div style="text-align:center"><span class="badge">${option.title}</span></div>
<div class="grid">
  <div><span class="lbl">نوع الوثيقة:</span> ${analysis.doc_type}</div>
  <div><span class="lbl">الجهة المختصة:</span> ${analysis.authority || '[___]'}</div>
  <div><span class="lbl">صاحب القرار:</span> ${analysis.decision_maker || '[___]'}</div>
  <div><span class="lbl">المهلة القانونية:</span> ${analysis.time_limits || 'لا توجد مهلة محددة'}</div>
</div>
${analysis.legal_basis ? `<div class="section"><h3>الأساس القانوني</h3><p>${analysis.legal_basis}</p></div>` : ''}
<div class="section"><h3>نص ${option.title}</h3><div class="tmpl">${filled}</div></div>
${analysis.required_signatures?.length > 0 ? `<div class="section"><h3>التواقيع المطلوبة</h3><ul>${analysis.required_signatures.map((s,i)=>`<li>${i+1}. ${s}</li>`).join('')}</ul></div>` : ''}
<div class="sigs">
  <div class="sig"><p>${mayor}</p><p>رئيس البلدية</p><p class="sp">التوقيع: _______________</p></div>
  <div class="sig"><p>الختم الرسمي</p><p class="sp">_______________________</p></div>
</div>
<div class="footer">وثيقة صادرة عن نظام Baladi AI — يُرجى مراجعة المستشار القانوني قبل التوقيع</div>
<script>window.onload=()=>window.print()</script>
</body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

export default function DocumentCard({ analysis }: Props) {
  const [activeOption, setActiveOption] = useState<string | null>(
    // Default to recommended option if available
    analysis.recommended_option?.split(' ')[0] || null
  )
  const [copied, setCopied]   = useState(false)
  const [showDocs, setShowDocs]   = useState(false)
  const [showSteps, setShowSteps] = useState(false)
  const [showLegal, setShowLegal] = useState(false)

  const validity = VALIDITY_CONFIG[analysis.validity] ?? VALIDITY_CONFIG.needs_info
  const selectedOption = analysis.options.find(o => o.id === activeOption)
  const optCfg = selectedOption ? (OPTION_CONFIG[selectedOption.type as OptionType] ?? OPTION_CONFIG.approve) : null
  const urgCfg = URGENCY_CONFIG[analysis.urgency] ?? URGENCY_CONFIG['عادي']

  // Determine which option is "recommended"
  const recommendedId = analysis.recommended_option?.split(/[\s—:]/)[0]?.trim()

  async function copyTemplate() {
    if (!selectedOption) return
    await navigator.clipboard.writeText(selectedOption.template)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function downloadTemplate() {
    if (!selectedOption) return
    const blob = new Blob([selectedOption.template], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `${selectedOption.title}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white border border-warm-border rounded-2xl overflow-hidden shadow-sm w-full max-w-2xl" dir="rtl">

      {/* ── Header ── */}
      <div className="bg-gradient-to-l from-burgundy/8 to-transparent border-b border-warm-border px-4 py-3 flex items-center gap-3">
        <FileText size={16} className="text-burgundy shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-stone-800">{analysis.doc_type}</p>
            {analysis.request_category && analysis.request_category !== 'أخرى' && (
              <span className="text-[10px] bg-burgundy/10 text-burgundy px-1.5 py-0.5 rounded-md border border-burgundy/15">
                {analysis.request_category.replace(/_/g, ' ')}
              </span>
            )}
          </div>
        </div>
        {/* Urgency badge */}
        <span className={clsx('flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border shrink-0', urgCfg.cls)}>
          <span className={clsx('w-1.5 h-1.5 rounded-full', urgCfg.dot)} />
          {analysis.urgency?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="p-4 space-y-4">

        {/* ── Validity ── */}
        <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium', validity.cls)}>
          {validity.icon}
          <span>{validity.label}</span>
        </div>
        {analysis.validity_reason && (
          <p className="text-sm text-stone-600 leading-relaxed -mt-2">{analysis.validity_reason}</p>
        )}

        {/* ── Summary ── */}
        <div>
          <h4 className="text-xs font-semibold text-warm-muted mb-1 uppercase tracking-wide">ملخص الوثيقة</h4>
          <p className="text-sm text-stone-700 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* ── Decision maker + Authority ── */}
        <div className="grid grid-cols-2 gap-3">
          {analysis.authority && (
            <div className="bg-warm-bg rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Building size={11} className="text-warm-muted" />
                <h4 className="text-[10px] font-semibold text-warm-muted uppercase">الجهة المختصة</h4>
              </div>
              <p className="text-xs text-stone-700 leading-5">{analysis.authority}</p>
            </div>
          )}
          {analysis.decision_maker && (
            <div className="bg-warm-bg rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Gavel size={11} className="text-warm-muted" />
                <h4 className="text-[10px] font-semibold text-warm-muted uppercase">صاحب القرار</h4>
              </div>
              <p className="text-xs text-stone-700 leading-5">{analysis.decision_maker.replace(/_/g, ' ')}</p>
            </div>
          )}
          {analysis.time_limits && (
            <div className="bg-warm-bg rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Clock size={11} className="text-warm-muted" />
                <h4 className="text-[10px] font-semibold text-warm-muted uppercase">المهل القانونية</h4>
              </div>
              <p className="text-xs text-stone-700 leading-5">{analysis.time_limits}</p>
            </div>
          )}
          {analysis.required_signatures?.length > 0 && (
            <div className="bg-warm-bg rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1 mb-0.5">
                <Users size={11} className="text-warm-muted" />
                <h4 className="text-[10px] font-semibold text-warm-muted uppercase">التواقيع المطلوبة</h4>
              </div>
              <p className="text-xs text-stone-700 leading-5">{analysis.required_signatures.join(' — ')}</p>
            </div>
          )}
        </div>

        {/* ── Legal basis (collapsible) ── */}
        {analysis.legal_basis && (
          <div>
            <button
              onClick={() => setShowLegal(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-burgundy transition-colors"
            >
              {showLegal ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              <Info size={12} />
              الأساس القانوني
            </button>
            {showLegal && (
              <div className="mt-2 bg-navy/5 border border-navy/10 rounded-lg px-3 py-2.5">
                <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{analysis.legal_basis}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Required docs (collapsible) ── */}
        {analysis.required_docs?.length > 0 && (
          <div>
            <button
              onClick={() => setShowDocs(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-warm-muted hover:text-stone-700 transition-colors"
            >
              {showDocs ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              المستندات المطلوبة ({analysis.required_docs.length})
            </button>
            {showDocs && (
              <ul className="mt-2 space-y-1">
                {analysis.required_docs.map((d, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="text-burgundy mt-0.5 shrink-0">•</span>{d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Risks ── */}
        {analysis.risks && (
          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-700 mb-0.5">مخاطر وتحذيرات</h4>
              <p className="text-sm text-amber-800 leading-relaxed">{analysis.risks}</p>
            </div>
          </div>
        )}

        {/* ══════════════ OPTIONS SECTION ══════════════ */}
        {analysis.options?.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-warm-muted uppercase tracking-wide">خيارات القرار المتاحة</h4>
              {recommendedId && (
                <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                  <Star size={10} fill="currentColor" />
                  الموصى به محدد تلقائياً
                </span>
              )}
            </div>

            {/* Option chips */}
            <div className="flex flex-wrap gap-2">
              {analysis.options.map(opt => {
                const cfg = OPTION_CONFIG[opt.type as OptionType] ?? OPTION_CONFIG.approve
                const isActive = activeOption === opt.id
                const isRec    = opt.id === recommendedId
                return (
                  <button
                    key={opt.id}
                    onClick={() => setActiveOption(isActive ? null : opt.id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all relative',
                      isActive
                        ? `${cfg.bg} ${cfg.border} border-2 text-stone-800`
                        : 'bg-warm-bg border-warm-border text-stone-600 hover:border-stone-300'
                    )}
                  >
                    {cfg.icon}
                    {opt.title}
                    {isRec && (
                      <span className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                        <Star size={8} fill="white" color="white" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Selected option detail */}
            {selectedOption && optCfg && (
              <div className={clsx('rounded-xl border-2 overflow-hidden', optCfg.border)}>

                {/* Option header */}
                <div className={clsx('px-4 py-2.5 flex items-center gap-2', optCfg.bg)}>
                  {optCfg.icon}
                  <span className="text-sm font-bold text-stone-800">{selectedOption.title}</span>
                  {selectedOption.id === recommendedId && (
                    <span className="mr-auto flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                      <Star size={9} fill="currentColor" />
                      موصى به
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="px-4 py-3 border-b border-warm-border">
                  <p className="text-sm text-stone-700 leading-relaxed">{selectedOption.description}</p>
                </div>

                {/* Pros / Cons */}
                {(selectedOption.pros || selectedOption.cons) && (
                  <div className="grid grid-cols-2 divide-x divide-x-reverse divide-warm-border border-b border-warm-border">
                    {selectedOption.pros && (
                      <div className="px-3 py-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <ThumbsUp size={11} className="text-emerald-600" />
                          <span className="text-[10px] font-semibold text-emerald-600 uppercase">مزايا</span>
                        </div>
                        <p className="text-xs text-stone-600 leading-5">{selectedOption.pros}</p>
                      </div>
                    )}
                    {selectedOption.cons && (
                      <div className="px-3 py-2.5">
                        <div className="flex items-center gap-1 mb-1">
                          <ThumbsDown size={11} className="text-red-500" />
                          <span className="text-[10px] font-semibold text-red-500 uppercase">تحفظات</span>
                        </div>
                        <p className="text-xs text-stone-600 leading-5">{selectedOption.cons}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Template */}
                {selectedOption.template && (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 bg-navy/5">
                      <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-navy" />
                        <span className="text-xs font-semibold text-navy">نموذج القرار / الكتاب الرسمي</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={copyTemplate} className="flex items-center gap-1 text-xs text-stone-600 hover:text-burgundy transition-colors px-1.5 py-0.5 rounded hover:bg-white/60">
                          <Copy size={11} /> {copied ? 'تم!' : 'نسخ'}
                        </button>
                        <button onClick={downloadTemplate} className="flex items-center gap-1 text-xs text-stone-600 hover:text-burgundy transition-colors px-1.5 py-0.5 rounded hover:bg-white/60">
                          <Download size={11} /> تحميل
                        </button>
                        <button
                          onClick={() => printDecision(selectedOption, analysis)}
                          className="flex items-center gap-1 text-xs text-white bg-burgundy hover:bg-burgundy/90 px-2 py-1 rounded-md transition-colors"
                        >
                          <Printer size={11} /> طباعة PDF
                        </button>
                      </div>
                    </div>
                    <pre className="px-4 py-3 text-sm text-stone-700 whitespace-pre-wrap font-sans leading-7 max-h-72 overflow-y-auto text-right bg-white">
                      {selectedOption.template}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Next steps ── */}
        {analysis.next_steps?.length > 0 && (
          <div>
            <button
              onClick={() => setShowSteps(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-warm-muted hover:text-stone-700 transition-colors"
            >
              {showSteps ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
              <Footprints size={12} />
              الخطوات التالية المقترحة
            </button>
            {showSteps && (
              <ol className="mt-2 space-y-1">
                {analysis.next_steps.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                    <span className="w-5 h-5 rounded-full bg-burgundy text-white text-[10px] flex items-center justify-center shrink-0 font-bold mt-0.5">{i+1}</span>
                    {s}
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* ── Recommendations ── */}
        {analysis.recommendations && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
            <h4 className="text-xs font-semibold text-emerald-700 mb-0.5">توصيات</h4>
            <p className="text-sm text-emerald-800 leading-relaxed">{analysis.recommendations}</p>
          </div>
        )}
      </div>
    </div>
  )
}

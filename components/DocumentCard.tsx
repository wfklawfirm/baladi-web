'use client'

import { useState } from 'react'
import {
  CheckCircle, XCircle, AlertCircle, Copy, Download, Printer,
  ChevronDown, ChevronUp, FileText, Users, Clock, AlertTriangle, Footprints,
} from 'lucide-react'
import type { DocumentAnalysis, AnalysisOption } from '@/lib/types'
import { loadSettings, applySettings } from '@/lib/settings'
import clsx from 'clsx'

interface Props {
  analysis: DocumentAnalysis
}

const VALIDITY_CONFIG = {
  valid: {
    icon: <CheckCircle size={16} />,
    label: 'الطلب صحيح قانونياً',
    cls: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  invalid: {
    icon: <XCircle size={16} />,
    label: 'الطلب مرفوض قانونياً',
    cls: 'bg-red-50 border-red-200 text-red-700',
  },
  needs_info: {
    icon: <AlertCircle size={16} />,
    label: 'يحتاج إلى معلومات إضافية',
    cls: 'bg-amber-50 border-amber-200 text-amber-700',
  },
}

/** Open a print window with official Lebanese municipal document formatting */
function printDecision(option: AnalysisOption, analysis: DocumentAnalysis) {
  const settings = loadSettings()
  const today = new Date().toLocaleDateString('ar-LB', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  const mun    = settings.municipality ? `بلدية ${settings.municipality}` : 'بلدية [_______________]'
  const mayor  = settings.mayor        || '[رئيس البلدية]'
  const region = settings.region       ? `قضاء ${settings.region}` : '[القضاء]'
  const phone  = settings.phone        || '[رقم الهاتف]'

  // Apply settings to the template
  const filledTemplate = applySettings(option.template, settings)

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${option.title} — ${mun}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Noto Naskh Arabic', 'Arial', sans-serif;
    direction: rtl;
    background: #fff;
    color: #1a1a1a;
    font-size: 14pt;
    line-height: 2;
    padding: 40px 60px;
  }
  .letterhead {
    text-align: center;
    border-bottom: 3px double #8b1a2b;
    padding-bottom: 16px;
    margin-bottom: 24px;
  }
  .letterhead h1 { font-size: 18pt; font-weight: 700; color: #8b1a2b; }
  .letterhead h2 { font-size: 14pt; font-weight: 600; color: #333; margin-top: 4px; }
  .letterhead .ref { font-size: 11pt; color: #555; margin-top: 8px; }
  .doc-type {
    background: #f8f4f0;
    border: 1px solid #d9c7b8;
    border-radius: 6px;
    padding: 10px 16px;
    margin-bottom: 20px;
    font-weight: 700;
    color: #8b1a2b;
    font-size: 15pt;
    text-align: center;
  }
  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
    margin-bottom: 20px;
    font-size: 12pt;
  }
  .meta-grid .label { color: #666; font-weight: 600; }
  .section { margin-bottom: 20px; }
  .section h3 {
    font-size: 13pt;
    font-weight: 700;
    color: #1a3a5c;
    border-bottom: 1px solid #d0d8e4;
    padding-bottom: 4px;
    margin-bottom: 10px;
  }
  .template-box {
    background: #fafafa;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 20px 24px;
    white-space: pre-wrap;
    font-size: 13pt;
    line-height: 2.2;
    margin-bottom: 20px;
  }
  .signatures {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    margin-top: 40px;
  }
  .sig-box {
    text-align: center;
    border-top: 1px solid #999;
    padding-top: 8px;
    font-size: 12pt;
    color: #444;
  }
  .footer {
    margin-top: 48px;
    text-align: center;
    font-size: 10pt;
    color: #888;
    border-top: 1px solid #eee;
    padding-top: 12px;
  }
  @media print {
    body { padding: 20px 40px; }
    button { display: none !important; }
  }
</style>
</head>
<body>

<div class="letterhead">
  <h1>الجمهورية اللبنانية</h1>
  <h2>${mun}</h2>
  <div class="ref">${region} &nbsp;|&nbsp; ${phone}</div>
  <div class="ref">رقم: [___] / ${new Date().getFullYear()} &nbsp;|&nbsp; التاريخ: ${today}</div>
</div>

<div class="doc-type">${option.title} — ${analysis.doc_type}</div>

<div class="meta-grid">
  <div><span class="label">الجهة المختصة:</span> ${analysis.authority || '[___]'}</div>
  <div><span class="label">المهلة القانونية:</span> ${analysis.time_limits || 'لا توجد مهلة محددة'}</div>
  <div><span class="label">الوضع القانوني:</span> ${analysis.validity === 'valid' ? 'صحيح' : analysis.validity === 'invalid' ? 'مرفوض' : 'يحتاج استيضاح'}</div>
  <div><span class="label">السند القانوني:</span> ${analysis.legal_basis?.split('\n')[0] || '[___]'}</div>
</div>

<div class="section">
  <h3>ملخص الوثيقة</h3>
  <p>${analysis.summary}</p>
</div>

${analysis.legal_basis ? `<div class="section">
  <h3>الأساس القانوني</h3>
  <p>${analysis.legal_basis}</p>
</div>` : ''}

<div class="section">
  <h3>نص ${option.title}</h3>
  <div class="template-box">${filledTemplate}</div>
</div>

${analysis.required_signatures?.length > 0 ? `<div class="section">
  <h3>التواقيع والموافقات المطلوبة</h3>
  <ul>${analysis.required_signatures.map((s, i) => `<li>${i + 1}. ${s}</li>`).join('')}</ul>
</div>` : ''}

<div class="signatures">
  ${analysis.required_signatures?.slice(0, 2).map(s => `
  <div class="sig-box">
    <p>${s}</p>
    <p style="margin-top:60px; color:#aaa; font-size:11pt;">التوقيع: _______________</p>
  </div>`).join('') || `
  <div class="sig-box">
    <p>رئيس البلدية — ${mayor}</p>
    <p style="margin-top:60px; color:#aaa; font-size:11pt;">التوقيع: _______________</p>
  </div>
  <div class="sig-box">
    <p>الختم الرسمي</p>
    <p style="margin-top:60px; color:#aaa; font-size:11pt;">_______________________</p>
  </div>`}
</div>

<div class="footer">
  وثيقة صادرة عن نظام Baladi AI — للاستخدام الداخلي — يُرجى مراجعة المستشار القانوني للتحقق قبل التوقيع
</div>

<script>window.onload = () => window.print();</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

export default function DocumentCard({ analysis }: Props) {
  const [activeOption, setActiveOption] = useState<string | null>(null)
  const [copied, setCopied]             = useState(false)
  const [showDocs, setShowDocs]         = useState(false)
  const [showSteps, setShowSteps]       = useState(false)

  const validity = VALIDITY_CONFIG[analysis.validity] ?? VALIDITY_CONFIG.needs_info
  const selectedOption = analysis.options.find(o => o.id === activeOption)

  async function copyTemplate() {
    if (!selectedOption) return
    await navigator.clipboard.writeText(selectedOption.template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function downloadTemplate() {
    if (!selectedOption) return
    const blob = new Blob([selectedOption.template], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${selectedOption.title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white border border-warm-border rounded-2xl overflow-hidden shadow-sm w-full max-w-2xl" dir="rtl">

      {/* Header */}
      <div className="bg-gradient-to-l from-burgundy/5 to-transparent border-b border-warm-border px-4 py-3 flex items-center gap-2">
        <FileText size={16} className="text-burgundy shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-warm-muted">نوع الوثيقة</p>
          <p className="text-sm font-semibold text-stone-800">{analysis.doc_type}</p>
        </div>
      </div>

      <div className="p-4 space-y-4">

        {/* Validity badge */}
        <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium', validity.cls)}>
          {validity.icon}
          <span>{validity.label}</span>
        </div>
        {analysis.validity_reason && (
          <p className="text-sm text-stone-600 leading-relaxed">{analysis.validity_reason}</p>
        )}

        {/* Summary */}
        <div>
          <h4 className="text-xs font-semibold text-warm-muted mb-1 uppercase tracking-wide">ملخص الوثيقة</h4>
          <p className="text-sm text-stone-700 leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Legal basis */}
        {analysis.legal_basis && (
          <div className="bg-navy/5 border border-navy/10 rounded-lg px-3 py-2.5">
            <h4 className="text-xs font-semibold text-navy mb-1">الأساس القانوني</h4>
            <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-line">{analysis.legal_basis}</p>
          </div>
        )}

        {/* Authority + Time limits */}
        <div className="grid grid-cols-2 gap-3">
          {analysis.authority && (
            <div className="bg-warm-bg rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Users size={12} className="text-warm-muted" />
                <h4 className="text-xs font-semibold text-warm-muted">الجهة المختصة</h4>
              </div>
              <p className="text-sm text-stone-700">{analysis.authority}</p>
            </div>
          )}
          {analysis.time_limits && (
            <div className="bg-warm-bg rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1 mb-1">
                <Clock size={12} className="text-warm-muted" />
                <h4 className="text-xs font-semibold text-warm-muted">المهل القانونية</h4>
              </div>
              <p className="text-sm text-stone-700">{analysis.time_limits}</p>
            </div>
          )}
        </div>

        {/* Required signatures */}
        {analysis.required_signatures?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-warm-muted mb-1.5">التواقيع والموافقات المطلوبة</h4>
            <ul className="space-y-1">
              {analysis.required_signatures.map((s, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-stone-700">
                  <span className="w-4 h-4 rounded-full bg-burgundy/10 text-burgundy text-[10px] flex items-center justify-center shrink-0 font-bold">{i+1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required docs (collapsible) */}
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
                    <span className="text-burgundy mt-0.5">•</span>{d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Risks */}
        {analysis.risks && (
          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
            <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-amber-700 mb-0.5">مخاطر وتحذيرات</h4>
              <p className="text-sm text-amber-800 leading-relaxed">{analysis.risks}</p>
            </div>
          </div>
        )}

        {/* ── Options / Decision templates ─────────────────────────────── */}
        {analysis.options?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-warm-muted mb-2 uppercase tracking-wide">الخيارات المتاحة</h4>
            <div className="flex flex-wrap gap-2 mb-3">
              {analysis.options.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setActiveOption(activeOption === opt.id ? null : opt.id)}
                  className={clsx(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    activeOption === opt.id
                      ? 'bg-burgundy text-white border-burgundy'
                      : 'bg-warm-bg border-warm-border text-stone-700 hover:border-burgundy/50'
                  )}
                >
                  {opt.title}
                </button>
              ))}
            </div>

            {selectedOption && (
              <div className="border border-warm-border rounded-xl overflow-hidden">
                {/* Option description */}
                <div className="bg-warm-bg px-4 py-3 border-b border-warm-border">
                  <p className="text-sm text-stone-700 leading-relaxed">{selectedOption.description}</p>
                </div>

                {/* Template */}
                {selectedOption.template && (
                  <>
                    <div className="flex items-center justify-between px-4 py-2 bg-navy/5 border-b border-warm-border">
                      <span className="text-xs font-semibold text-navy">نموذج القرار / الكتاب الرسمي</span>
                      <div className="flex gap-3">
                        <button
                          onClick={copyTemplate}
                          className="flex items-center gap-1 text-xs text-stone-600 hover:text-burgundy transition-colors"
                        >
                          <Copy size={12} />
                          {copied ? 'تم النسخ!' : 'نسخ'}
                        </button>
                        <button
                          onClick={downloadTemplate}
                          className="flex items-center gap-1 text-xs text-stone-600 hover:text-burgundy transition-colors"
                        >
                          <Download size={12} />
                          تحميل
                        </button>
                        <button
                          onClick={() => printDecision(selectedOption, analysis)}
                          className="flex items-center gap-1 text-xs text-white bg-burgundy hover:bg-burgundy/90 px-2 py-1 rounded-md transition-colors"
                        >
                          <Printer size={12} />
                          طباعة PDF
                        </button>
                      </div>
                    </div>
                    <pre className="px-4 py-3 text-sm text-stone-700 whitespace-pre-wrap font-sans leading-7 max-h-72 overflow-y-auto text-right">
                      {selectedOption.template}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Next steps (collapsible) */}
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

        {/* Recommendations */}
        {analysis.recommendations && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2.5">
            <h4 className="text-xs font-semibold text-emerald-700 mb-1">توصيات</h4>
            <p className="text-sm text-emerald-800 leading-relaxed">{analysis.recommendations}</p>
          </div>
        )}
      </div>
    </div>
  )
}

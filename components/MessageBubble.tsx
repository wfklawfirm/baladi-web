'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronUp, Mic, FileText, Copy, Download, Printer, CheckCircle, FileDown, FileSignature, ListOrdered, AlertTriangle, BookOpen, Lightbulb } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import type { Message, FollowUpAction, ActionType } from '@/lib/types'
import { CONFIDENCE_CONFIG } from '@/lib/types'
import DocumentCard from './DocumentCard'
import { loadSettings, applySettings } from '@/lib/settings'
import clsx from 'clsx'

interface Props {
  message: Message
  onFollowUp?: (q: string) => void
  onClarify?: (prompt: string) => void
}

// ── Template block parser ─────────────────────────────────────────────────────
interface TemplatePart { type: 'text'; content: string }
interface TemplateBlock { type: 'template'; title: string; content: string }
type Part = TemplatePart | TemplateBlock

function parseContent(raw: string): Part[] {
  const parts: Part[] = []
  const regex = /<TEMPLATE:([^>]+)>([\s\S]*?)<\/TEMPLATE>/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = regex.exec(raw)) !== null) {
    if (m.index > last) {
      parts.push({ type: 'text', content: raw.slice(last, m.index).trim() })
    }
    parts.push({ type: 'template', title: m[1].trim(), content: m[2].trim() })
    last = m.index + m[0].length
  }
  if (last < raw.length) {
    const tail = raw.slice(last).trim()
    if (tail) parts.push({ type: 'text', content: tail })
  }
  return parts
}

// ── Template card ─────────────────────────────────────────────────────────────
function TemplateCard({ title, content }: { title: string; content: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownload() {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `${title}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    const settings = loadSettings()
    const filled   = applySettings(content, settings)
    const mun      = settings.municipality ? `بلدية ${settings.municipality}` : 'بلدية [_______________]'
    const mayor    = settings.mayor        || '[رئيس البلدية]'
    const region   = settings.region       ? `قضاء ${settings.region}` : '[القضاء]'
    const phone    = settings.phone        || '[رقم الهاتف]'
    const today    = new Date().toLocaleDateString('ar-LB', { year: 'numeric', month: 'long', day: 'numeric' })

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>${title} — ${mun}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;500;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Naskh Arabic',Arial,sans-serif;direction:rtl;background:#fff;color:#111;font-size:12.5pt;line-height:2.0;padding:28px 56px}

  /* ── ترويسة رسمية ── */
  .header{display:grid;grid-template-columns:80px 1fr 80px;align-items:center;border-bottom:4px double #8b1a2b;padding-bottom:16px;margin-bottom:6px}
  .logo-box{display:flex;align-items:center;justify-content:center}
  .cedar{font-size:44px;line-height:1}
  .header-center{text-align:center}
  .republic{font-size:11pt;font-weight:600;color:#555;letter-spacing:0.5px}
  .ministry{font-size:10pt;color:#777;margin-top:2px}
  .mun-name{font-size:18pt;font-weight:700;color:#8b1a2b;margin-top:6px}
  .subline{font-size:10pt;color:#666;margin-top:3px}
  .ref-box{text-align:left;font-size:10pt;color:#555;line-height:1.8}

  /* ── شريط المرجع ── */
  .refbar{display:flex;justify-content:space-between;font-size:10pt;color:#555;padding:8px 0;border-bottom:1px solid #ddd;margin-bottom:20px}

  /* ── عنوان القرار ── */
  .doc-title{text-align:center;margin:18px 0 22px}
  .doc-title .badge{display:inline-block;background:#8b1a2b;color:#fff;padding:5px 28px;border-radius:4px;font-size:13pt;font-weight:700;letter-spacing:0.3px}

  /* ── جسم الوثيقة ── */
  .body{white-space:pre-wrap;font-size:12.5pt;line-height:2.2;text-align:justify;border:1px solid #e8e8e8;border-radius:4px;padding:20px 24px;background:#fafafa}

  /* ── منطقة التوقيع ── */
  .sigs{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:50px;text-align:center}
  .sig-box{border-top:1px solid #999;padding-top:8px;font-size:10.5pt}
  .sig-label{font-weight:600;color:#333}
  .sig-space{height:52px}

  /* ── تذييل ── */
  .footer{margin-top:36px;text-align:center;font-size:8.5pt;color:#aaa;border-top:1px solid #eee;padding-top:8px;display:flex;justify-content:space-between}

  @media print{
    body{padding:14px 36px;font-size:11.5pt}
    .no-print{display:none!important}
    .body{border:none;padding:0;background:transparent}
    @page{margin:1.5cm 2cm;size:A4}
  }
</style>
</head>
<body>

<!-- ترويسة -->
<div class="header">
  <div class="logo-box"><div class="cedar">🌲</div></div>
  <div class="header-center">
    <div class="republic">الجمهورية اللبنانية</div>
    <div class="ministry">وزارة الداخلية والبلديات</div>
    <div class="mun-name">${mun}</div>
    <div class="subline">${region}</div>
  </div>
  <div class="ref-box">
    <div>هاتف: ${phone}</div>
    <div>التاريخ:</div>
    <div style="border-bottom:1px solid #aaa;width:120px;margin-top:4px">&nbsp;</div>
  </div>
</div>

<!-- شريط المرجع -->
<div class="refbar">
  <span>رقم القرار: _____ / ${new Date().getFullYear()}</span>
  <span>التاريخ: ${today}</span>
  <span>المرجع: _____</span>
</div>

<!-- عنوان القرار -->
<div class="doc-title">
  <span class="badge">${title}</span>
</div>

<!-- جسم الوثيقة -->
<div class="body">${filled.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>

<!-- منطقة التوقيع -->
<div class="sigs">
  <div class="sig-box">
    <div class="sig-label">أمين سر البلدية</div>
    <div class="sig-space"></div>
    <div style="font-size:10pt;color:#555">الاسم: ___________________</div>
  </div>
  <div class="sig-box">
    <div class="sig-label">رئيس البلدية</div>
    <div class="sig-space"></div>
    <div style="font-size:10pt;color:#555">${mayor}</div>
  </div>
</div>

<!-- الختم -->
<div style="text-align:center;margin-top:32px;color:#ccc;font-size:10pt">[ختم البلدية الرسمي]</div>

<!-- تذييل -->
<div class="footer">
  <span>وثيقة مُنشأة بواسطة نظام Baladi AI</span>
  <span>يُرجى مراجعة المستشار القانوني قبل التوقيع الرسمي</span>
  <span>${today}</span>
</div>

<script>window.onload=()=>window.print()</script>
</body></html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="rounded-xl border-2 border-navy/20 overflow-hidden my-3" dir="rtl">
      {/* Header */}
      <div className="bg-navy/8 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileDown size={14} className="text-navy shrink-0" />
          <span className="text-sm font-bold text-navy">{title}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-stone-600 hover:text-navy px-2 py-1 rounded hover:bg-white/60 transition-colors"
          >
            {copied ? <CheckCircle size={11} className="text-emerald-500" /> : <Copy size={11} />}
            {copied ? 'تم' : 'نسخ'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 text-xs text-stone-600 hover:text-navy px-2 py-1 rounded hover:bg-white/60 transition-colors"
          >
            <Download size={11} /> تحميل
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 text-xs text-white bg-burgundy hover:bg-burgundy/90 px-2.5 py-1 rounded-md transition-colors"
          >
            <Printer size={11} /> طباعة PDF
          </button>
        </div>
      </div>
      {/* Content */}
      <pre className="px-5 py-4 text-sm text-stone-700 whitespace-pre-wrap font-sans leading-7 max-h-96 overflow-y-auto bg-white text-right">
        {content}
      </pre>
    </div>
  )
}

// ── Action Cards ─────────────────────────────────────────────────────────────
const ACTION_STYLES: Record<ActionType, { icon: React.ReactNode; bg: string; border: string; text: string; badge: string }> = {
  template: {
    icon: <FileSignature size={15} />,
    bg: 'bg-burgundy/5 hover:bg-burgundy/10',
    border: 'border-burgundy/20 hover:border-burgundy/40',
    text: 'text-burgundy',
    badge: 'bg-burgundy/10 text-burgundy',
  },
  steps: {
    icon: <ListOrdered size={15} />,
    bg: 'bg-navy/5 hover:bg-navy/10',
    border: 'border-navy/20 hover:border-navy/35',
    text: 'text-navy',
    badge: 'bg-navy/10 text-navy',
  },
  risks: {
    icon: <AlertTriangle size={15} />,
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-200 hover:border-amber-300',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
  },
  law: {
    icon: <BookOpen size={15} />,
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-200 hover:border-emerald-300',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  example: {
    icon: <Lightbulb size={15} />,
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200 hover:border-purple-300',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
  },
  question: {
    icon: <span className="text-sm">↩</span>,
    bg: 'bg-warm-bg hover:bg-stone-100',
    border: 'border-warm-border hover:border-stone-300',
    text: 'text-stone-600',
    badge: 'bg-stone-100 text-stone-500',
  },
}

const ACTION_LABELS: Record<ActionType, string> = {
  template: 'نموذج',
  steps:    'خطوات',
  risks:    'مخاطر',
  law:      'القانون',
  example:  'مثال',
  question: 'متابعة',
}

function ActionCards({ actions, onAction }: { actions: FollowUpAction[]; onAction: (prompt: string) => void }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {actions.map((action, i) => {
        const type   = (action.type as ActionType) in ACTION_STYLES ? action.type as ActionType : 'question'
        const styles = ACTION_STYLES[type]
        return (
          <button
            key={i}
            onClick={() => onAction(action.prompt)}
            className={clsx(
              'flex items-start gap-2.5 p-3 rounded-xl border text-right transition-all duration-150 group',
              styles.bg, styles.border
            )}
          >
            <span className={clsx('mt-0.5 shrink-0', styles.text)}>{styles.icon}</span>
            <div className="flex-1 min-w-0">
              <span className={clsx('text-[10px] font-semibold px-1.5 py-0.5 rounded-md mb-1 inline-block', styles.badge)}>
                {ACTION_LABELS[type]}
              </span>
              <p className={clsx('text-xs font-medium leading-5', styles.text)}>{action.label}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Phase label ──────────────────────────────────────────────────────────────
function PhaseIndicator({ phase }: { phase?: 'searching' | 'generating' }) {
  const [dots, setDots] = useState('.')
  useEffect(() => {
    const id = setInterval(() => setDots(d => d.length >= 3 ? '.' : d + '.'), 400)
    return () => clearInterval(id)
  }, [])
  const label = phase === 'generating' ? 'جاري الإجابة' : 'جاري البحث في القوانين'
  return (
    <span className="text-sm text-warm-muted italic select-none">
      {label}<span className="tracking-widest">{dots}</span>
    </span>
  )
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
// Single persistent timer — never jumps to full content immediately.
// active streaming  → 3 chars/tick @ 20ms  ≈ 150 chars/sec (visible typing)
// streaming done    → 12 chars/tick @ 20ms (quickly catches up)
function useTypewriter(fullContent: string, isStreaming: boolean): string {
  const [displayed, setDisplayed] = useState('')
  const fullRef   = useRef(fullContent)
  const activeRef = useRef(isStreaming)
  fullRef.current   = fullContent
  activeRef.current = isStreaming

  useEffect(() => {
    const id = setInterval(() => {
      setDisplayed(prev => {
        const full = fullRef.current
        if (prev.length >= full.length) return prev
        const step = activeRef.current ? 3 : 12
        return full.slice(0, Math.min(prev.length + step, full.length))
      })
    }, 20)
    return () => clearInterval(id)
  }, []) // single timer for the lifetime of this message

  return displayed
}

// ── Clarification bubble — option type styles ────────────────────────────────
const CLARIFY_OPTION_STYLES = {
  law: {
    icon: <BookOpen size={14} />,
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    border: 'border-emerald-200 hover:border-emerald-400',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-700',
    numBg: 'bg-emerald-600',
    label: 'قانون',
  },
  steps: {
    icon: <ListOrdered size={14} />,
    bg: 'bg-[#EEF4FF] hover:bg-[#E0ECFF]',
    border: 'border-[#C3D8F7] hover:border-navy/40',
    text: 'text-navy',
    badge: 'bg-navy/10 text-navy',
    numBg: 'bg-navy',
    label: 'خطوات',
  },
  template: {
    icon: <FileSignature size={14} />,
    bg: 'bg-[#FDF4F5] hover:bg-[#FAE8EB]',
    border: 'border-[#EDD0D4] hover:border-burgundy/40',
    text: 'text-burgundy',
    badge: 'bg-burgundy/10 text-burgundy',
    numBg: 'bg-burgundy',
    label: 'نموذج',
  },
  risks: {
    icon: <AlertTriangle size={14} />,
    bg: 'bg-amber-50 hover:bg-amber-100',
    border: 'border-amber-200 hover:border-amber-400',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-700',
    numBg: 'bg-amber-500',
    label: 'مخاطر',
  },
  example: {
    icon: <Lightbulb size={14} />,
    bg: 'bg-purple-50 hover:bg-purple-100',
    border: 'border-purple-200 hover:border-purple-400',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700',
    numBg: 'bg-purple-600',
    label: 'مثال',
  },
}
const ARABIC_NUMS = ['١', '٢', '٣', '٤', '٥']

// ── Clarification bubble ─────────────────────────────────────────────────────
function ClarificationBubble({
  loading,
  options,
  docSummary,
  onPick,
}: {
  loading?: boolean
  options?: { label: string; prompt: string; type?: string }[]
  docSummary?: string
  onPick?: (prompt: string) => void
}) {
  if (loading) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="bg-white border border-warm-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          <div className="flex items-center gap-1.5 h-5">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </div>
        </div>
      </div>
    )
  }
  if (!options || options.length === 0) return null

  return (
    <div className="flex justify-end animate-slide-up">
      <div className="max-w-[88%] w-full">
        <div className="bg-white border border-warm-border rounded-2xl rounded-tl-sm overflow-hidden shadow-sm">

          {/* ── Header ─────────────────────────────────────────────── */}
          <div className="px-5 pt-4 pb-3.5 border-b border-[#F0F4F8]">
            {docSummary && (
              <div className="mb-3.5 pb-3.5 border-b border-[#F0F4F8]">
                <p className="text-[10px] font-bold text-warm-muted uppercase tracking-[0.12em] mb-1.5">
                  ما قرأته في الوثيقة
                </p>
                <p className="text-[13px] text-stone-600 leading-[1.75]">{docSummary}</p>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full bg-burgundy shrink-0"
                style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
              />
              <p className="text-[12.5px] font-semibold text-[#1B2F4E]">
                حللنا سؤالك — اختر ما يناسبك:
              </p>
            </div>
          </div>

          {/* ── Options ────────────────────────────────────────────── */}
          <div className="p-3 flex flex-col gap-2">
            {options.map((opt, i) => {
              const typeKey = (opt.type && opt.type in CLARIFY_OPTION_STYLES)
                ? opt.type as keyof typeof CLARIFY_OPTION_STYLES
                : 'steps'
              const s = CLARIFY_OPTION_STYLES[typeKey]
              return (
                <button
                  key={i}
                  onClick={() => onPick?.(opt.prompt)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border text-right transition-all duration-200 group',
                    s.bg, s.border
                  )}
                >
                  {/* Arabic number badge */}
                  <div
                    className={clsx(
                      'shrink-0 w-[26px] h-[26px] rounded-full flex items-center justify-center',
                      'text-[12px] font-bold text-white leading-none',
                      s.numBg
                    )}
                  >
                    {ARABIC_NUMS[i] ?? i + 1}
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <span className={clsx('shrink-0 opacity-80', s.text)}>{s.icon}</span>
                    <span className={clsx('text-[13.5px] font-semibold leading-snug', s.text)}>
                      {opt.label}
                    </span>
                  </div>

                  {/* Type badge */}
                  <span
                    className={clsx(
                      'shrink-0 text-[10px] font-bold px-2.5 py-0.5 rounded-full',
                      s.badge
                    )}
                  >
                    {s.label}
                  </span>

                  {/* Hover arrow */}
                  <span
                    className={clsx(
                      'shrink-0 text-[13px] font-bold opacity-0 group-hover:opacity-100',
                      'transition-all duration-150 group-hover:-translate-x-0.5',
                      s.text
                    )}
                  >
                    ←
                  </span>
                </button>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MessageBubble({ message, onFollowUp, onClarify }: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false)

  // ── User message ─────────────────────────────────────────────────────────
  if (message.role === 'user') {
    return (
      <div className="flex justify-start animate-slide-up">
        <div className="max-w-[75%]">
          <div className="bg-burgundy text-white rounded-2xl rounded-tr-sm px-4 py-3">
            {message.attachedFile && (
              <div className="flex items-center gap-1.5 mb-2 text-white/80 text-xs">
                <FileText size={12} />
                <span>{message.attachedFile}</span>
              </div>
            )}
            {message.isVoice && (
              <div className="flex items-center gap-1.5 mb-1 text-white/70 text-xs">
                <Mic size={11} />
                <span>رسالة صوتية</span>
              </div>
            )}
            {message.content && (
              <p className="text-sm leading-6">{message.content}</p>
            )}
            {!message.content && message.attachedFile && (
              <p className="text-sm leading-6 text-white/80 italic">تحليل الوثيقة…</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Assistant — clarification bubble ────────────────────────────────────
  if (message.clarifyLoading || message.clarifyOptions) {
    return (
      <ClarificationBubble
        loading={message.clarifyLoading}
        options={message.clarifyOptions}
        docSummary={message.clarifyDocSummary}
        onPick={onClarify}
      />
    )
  }

  // ── Assistant — document analysis ────────────────────────────────────────
  const conf        = message.confidence ? CONFIDENCE_CONFIG[message.confidence] : null
  const isStreaming = !!message.streaming && !message.error

  if (message.analysis) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[90%] w-full">
          <DocumentCard analysis={message.analysis} />
          <div className="flex items-center gap-3 mt-2 px-1">
            {conf && (
              <span className={clsx('flex items-center gap-1 text-xs', conf.color)}>
                <span className={clsx('w-1.5 h-1.5 rounded-full', conf.dot)} />
                {conf.label}
              </span>
            )}
            {message.duration_ms != null && (
              <span className="text-xs text-warm-muted">{(message.duration_ms / 1000).toFixed(1)}ث</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Assistant — streaming / text answer ──────────────────────────────────
  // Always typewrite — even after streaming ends the timer catches up smoothly
  const displayed    = useTypewriter(message.content || '', isStreaming)
  const isTyping     = displayed.length < (message.content || '').length
  const showCursor   = isStreaming || isTyping
  const showPhase    = isStreaming && !message.content
  const parts        = parseContent(displayed)
  const hasTemplates = parts.some(p => p.type === 'template')

  return (
    <div className="flex justify-end animate-slide-up">
      <div className={clsx('w-full', hasTemplates ? 'max-w-[92%]' : 'max-w-[85%]')}>
        <div className="bg-white border border-warm-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          {message.error ? (
            <p className="text-sm text-red-500">{message.content}</p>
          ) : (
            <div className="prose-ar">
              {showPhase ? (
                <PhaseIndicator phase={message.streamPhase} />
              ) : (
                <>
                  {parts.map((part, i) =>
                    part.type === 'template' ? (
                      <TemplateCard key={i} title={part.title} content={part.content} />
                    ) : (
                      <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{part.content}</ReactMarkdown>
                    )
                  )}
                  {showCursor && (
                    <span
                      className="inline-block w-0.5 h-4 bg-burgundy ml-0.5 align-middle"
                      style={{ animation: 'pulse 0.8s cubic-bezier(0.4,0,0.6,1) infinite' }}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Meta row — show only when typewriter finished */}
        {!message.error && !isStreaming && !isTyping && (
          <div className="flex items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-3">
              {conf && (
                <span className={clsx('flex items-center gap-1 text-xs', conf.color)}>
                  <span className={clsx('w-1.5 h-1.5 rounded-full', conf.dot)} />
                  {conf.label}
                </span>
              )}
              {message.duration_ms != null && (
                <span className="text-xs text-warm-muted">{(message.duration_ms / 1000).toFixed(1)}ث</span>
              )}
              {message.chunks_used != null && (
                <span className="text-xs text-warm-muted">{message.chunks_used} مصادر</span>
              )}
            </div>

            {message.sources && message.sources.length > 0 && (
              <button
                onClick={() => setSourcesOpen(o => !o)}
                className="flex items-center gap-1 text-xs text-warm-muted hover:text-navy transition-colors"
              >
                {sourcesOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                المصادر ({message.sources.length})
              </button>
            )}
          </div>
        )}

        {/* Action Cards */}
        {!isStreaming && !isTyping && message.actions && message.actions.length > 0 && onFollowUp && (
          <ActionCards actions={message.actions} onAction={onFollowUp} />
        )}

        {/* Sources */}
        {sourcesOpen && message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-2 animate-fade-in">
            {message.sources.map((s, i) => (
              <div key={s.chunk_id} className="bg-white border border-warm-border rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-burgundy">[{i + 1}]</span>
                    <span className="text-xs font-medium text-navy line-clamp-1">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] bg-burgundy/10 text-burgundy px-1.5 py-0.5 rounded">{s.domain_name}</span>
                    <span className="text-[10px] text-warm-muted">{(s.score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-xs text-stone-500 leading-5 line-clamp-2">{s.text_preview}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function LoadingBubble() {
  return (
    <div className="flex justify-end animate-fade-in">
      <div className="bg-white border border-warm-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
        <div className="flex items-center gap-1.5 h-5">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      </div>
    </div>
  )
}

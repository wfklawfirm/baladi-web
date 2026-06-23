'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronUp, Mic, FileText, Copy, Download, Printer, CheckCircle, FileDown } from 'lucide-react'
import { useState } from 'react'
import type { Message } from '@/lib/types'
import { CONFIDENCE_CONFIG } from '@/lib/types'
import DocumentCard from './DocumentCard'
import { loadSettings, applySettings } from '@/lib/settings'
import clsx from 'clsx'

interface Props {
  message: Message
  onFollowUp?: (q: string) => void
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
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Naskh Arabic',Arial,sans-serif;direction:rtl;background:#fff;color:#1a1a1a;font-size:13pt;line-height:2.1;padding:36px 52px}
  .lh{text-align:center;border-bottom:3px double #8b1a2b;padding-bottom:14px;margin-bottom:24px}
  .lh h1{font-size:17pt;font-weight:700;color:#8b1a2b}
  .lh h2{font-size:13pt;font-weight:600;color:#333;margin-top:3px}
  .lh .ref{font-size:10pt;color:#666;margin-top:5px}
  .badge{display:inline-block;background:#8b1a2b;color:#fff;padding:3px 14px;border-radius:20px;font-size:11pt;font-weight:600;margin-bottom:20px}
  .body{white-space:pre-wrap;font-size:12.5pt;line-height:2.2}
  .footer{margin-top:48px;text-align:center;font-size:9pt;color:#aaa;border-top:1px solid #eee;padding-top:10px}
  @media print{body{padding:18px 32px}button{display:none!important}}
</style>
</head>
<body>
<div class="lh">
  <h1>الجمهورية اللبنانية</h1>
  <h2>${mun}</h2>
  <div class="ref">${region} &nbsp;|&nbsp; ${phone}</div>
  <div class="ref">التاريخ: ${today}</div>
</div>
<div style="text-align:center"><span class="badge">${title}</span></div>
<div class="body">${filled.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
<div class="footer">وثيقة صادرة عن نظام Baladi AI — يُرجى مراجعة المستشار القانوني قبل التوقيع الرسمي</div>
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

// ── Main component ────────────────────────────────────────────────────────────
export default function MessageBubble({ message, onFollowUp }: Props) {
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
  const parts = parseContent(message.content || '')
  const hasTemplates = parts.some(p => p.type === 'template')

  return (
    <div className="flex justify-end animate-slide-up">
      <div className={clsx('w-full', hasTemplates ? 'max-w-[92%]' : 'max-w-[85%]')}>
        <div className="bg-white border border-warm-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          {message.error ? (
            <p className="text-sm text-red-500">{message.content}</p>
          ) : (
            <div className="prose-ar">
              {isStreaming ? (
                <>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || ''}</ReactMarkdown>
                  <span
                    className="inline-block w-0.5 h-4 bg-burgundy ml-0.5 align-middle"
                    style={{ animation: 'pulse 1s cubic-bezier(0.4,0,0.6,1) infinite' }}
                  />
                </>
              ) : (
                parts.map((part, i) =>
                  part.type === 'template' ? (
                    <TemplateCard key={i} title={part.title} content={part.content} />
                  ) : (
                    <ReactMarkdown key={i} remarkPlugins={[remarkGfm]}>{part.content}</ReactMarkdown>
                  )
                )
              )}
            </div>
          )}
        </div>

        {/* Meta row */}
        {!message.error && !isStreaming && (
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

        {/* Follow-up chips */}
        {!isStreaming && message.follow_up && message.follow_up.length > 0 && onFollowUp && (
          <div className="mt-3 flex flex-col gap-1.5">
            {message.follow_up.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(q)}
                className="text-right text-xs text-navy bg-navy/5 border border-navy/15 hover:bg-navy/10 hover:border-navy/30 rounded-xl px-3 py-2 transition-all leading-5"
              >
                ↩ {q}
              </button>
            ))}
          </div>
        )}

        {/* Sources */}
        {sourcesOpen && message.sources && message.sources.length > 0 && (
          <div className="mt-2 space-y-2 animate-fade-in">
            {message.sources.map((s, i) => (
              <div key={s.chunk_id} className="bg-warm-bg border border-warm-border rounded-xl px-4 py-3">
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

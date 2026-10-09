'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import clsx from 'clsx'

// Shared building blocks for the /workspace pages. Tokens come from tailwind.config.ts
// (burgundy, navy, warm) so the look stays consistent with /assistant.

export const inputCls =
  'w-full rounded-lg border border-warm-border bg-white px-3 py-2.5 text-sm text-stone-800 ' +
  'placeholder:text-stone-400 outline-none transition-colors focus:border-burgundy focus:ring-2 focus:ring-burgundy/10'

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-burgundy px-4 py-2.5 text-sm font-medium text-white ' +
  'transition-colors hover:bg-burgundy-dark disabled:cursor-not-allowed disabled:opacity-50'

export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-warm-border bg-white px-4 py-2.5 text-sm ' +
  'font-medium text-navy transition-colors hover:bg-warm-bg disabled:cursor-not-allowed disabled:opacity-50'

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold leading-tight text-navy sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-7 text-warm-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Spinner({ label = 'جارٍ التحميل…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-warm-muted" role="status">
      <Loader2 size={16} className="animate-spin" />
      {label}
    </div>
  )
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <div className="flex-1 leading-6">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 font-medium underline underline-offset-2">
          إعادة المحاولة
        </button>
      )}
    </div>
  )
}

export function Notice({ tone = 'amber', children }: { tone?: 'amber' | 'blue'; children: ReactNode }) {
  return (
    <div
      className={clsx(
        'rounded-xl border px-4 py-3 text-[13px] leading-7',
        tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900',
      )}
    >
      {children}
    </div>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('rounded-2xl border border-warm-border bg-white p-5', className)}>{children}</div>
}

export function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="mb-1.5 block text-[13px] font-medium text-stone-700">
      {children}
      {required && <span className="mr-1 text-burgundy" aria-label="مطلوب">*</span>}
    </span>
  )
}

export function copyText(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }
  return Promise.reject(new Error('clipboard unavailable'))
}

/** Opens a print-ready page for an official document or minutes. */
export function printDocument(title: string, body: string, municipality: string) {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${esc(title)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
@page { size: A4; margin: 22mm 20mm; }
body { font-family: 'Noto Naskh Arabic', Arial, sans-serif; color:#111; font-size:13pt; line-height:2; }
.head { text-align:center; border-bottom:3px double #8A0F24; padding-bottom:10px; margin-bottom:24px; }
.head h1 { font-size:16pt; color:#8A0F24; margin:0; } .head p { margin:2px 0 0; font-size:10.5pt; color:#555; }
pre { white-space:pre-wrap; font-family:inherit; margin:0; }
</style></head><body>
<div class="head"><h1>${esc(municipality ? 'بلدية ' + municipality : 'البلدية')}</h1><p>${esc(title)}</p></div>
<pre>${esc(body)}</pre>
<script>window.onload=function(){window.print()}</script></body></html>`
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  return true
}

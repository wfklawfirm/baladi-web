'use client'

import { Send } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { Domain } from '@/lib/types'
import { DOMAIN_OPTIONS } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  onSend: (query: string, domain: Domain) => void
  loading: boolean
  initialValue?: string
}

export default function InputBar({ onSend, loading, initialValue = '' }: Props) {
  const [query, setQuery]   = useState(initialValue)
  const [domain, setDomain] = useState<Domain>('auto')
  const textareaRef          = useRef<HTMLTextAreaElement>(null)

  // Accept pre-filled query (from example pills)
  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue)
      textareaRef.current?.focus()
    }
  }, [initialValue])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px'
  }, [query])

  function handleSend() {
    const q = query.trim()
    if (!q || loading) return
    onSend(q, domain)
    setQuery('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="fixed bottom-0 right-0 left-0 bg-warm-bg border-t border-warm-border px-4 py-3 z-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-end gap-2 bg-white border border-warm-border rounded-2xl px-4 py-3 shadow-sm focus-within:border-burgundy/50 transition-colors">
          {/* Domain selector */}
          <select
            value={domain}
            onChange={e => setDomain(e.target.value as Domain)}
            className="text-xs text-stone-600 bg-warm-bg border border-warm-border rounded-lg px-2 py-1.5 outline-none cursor-pointer shrink-0 mb-0.5"
          >
            {DOMAIN_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          {/* Divider */}
          <div className="w-px h-5 bg-warm-border self-center shrink-0" />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="اطرح سؤالك البلدي…"
            rows={1}
            disabled={loading}
            className={clsx(
              'flex-1 bg-transparent text-sm text-stone-800 placeholder-warm-muted outline-none resize-none leading-6 max-h-36 text-right',
              loading && 'opacity-50 cursor-not-allowed'
            )}
          />

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!query.trim() || loading}
            className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
              query.trim() && !loading
                ? 'bg-burgundy text-white hover:bg-burgundy-dark'
                : 'bg-warm-bg text-warm-muted cursor-not-allowed'
            )}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-warm-muted border-t-burgundy rounded-full animate-spin" />
            ) : (
              <Send size={15} className="rotate-180" />
            )}
          </button>
        </div>

        <p className="text-[10px] text-warm-muted text-center mt-1.5">
          هذه المنصة تقدم معلومات قانونية أولية ولا تُعدّ استشارة قانونية. راجع مستشاراً قانونياً للمسائل الخلافية.
        </p>
      </div>
    </div>
  )
}

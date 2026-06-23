'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDown, ChevronUp, Mic, FileText } from 'lucide-react'
import { useState } from 'react'
import type { Message } from '@/lib/types'
import { CONFIDENCE_CONFIG } from '@/lib/types'
import DocumentCard from './DocumentCard'
import clsx from 'clsx'

interface Props { message: Message }

export default function MessageBubble({ message }: Props) {
  const [sourcesOpen, setSourcesOpen] = useState(false)

  if (message.role === 'user') {
    return (
      <div className="flex justify-start animate-slide-up">
        <div className="max-w-[75%]">
          <div className="bg-burgundy text-white rounded-2xl rounded-tr-sm px-4 py-3">
            {/* File chip */}
            {message.attachedFile && (
              <div className="flex items-center gap-1.5 mb-2 text-white/80 text-xs">
                <FileText size={12} />
                <span>{message.attachedFile}</span>
              </div>
            )}
            {/* Voice indicator */}
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

  // ── Assistant message ──────────────────────────────────────────────────────
  const conf = message.confidence ? CONFIDENCE_CONFIG[message.confidence] : null

  // Document analysis result
  if (message.analysis) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[90%] w-full">
          <DocumentCard analysis={message.analysis} />
          {/* Meta */}
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

  // Regular text answer
  return (
    <div className="flex justify-end animate-slide-up">
      <div className="max-w-[85%] w-full">
        <div className="bg-white border border-warm-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
          {message.error ? (
            <p className="text-sm text-red-500">{message.content}</p>
          ) : (
            <div className="prose-ar">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {!message.error && (
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

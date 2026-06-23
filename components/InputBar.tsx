'use client'

import { Send, Paperclip, Mic, MicOff, X, FileText } from 'lucide-react'
import { useState, useRef, useEffect, useCallback } from 'react'
import type { Domain } from '@/lib/types'
import { DOMAIN_OPTIONS } from '@/lib/types'
import { transcribeAudio } from '@/lib/api'
import clsx from 'clsx'

interface Props {
  onSend: (query: string, domain: Domain, file?: File) => void
  loading: boolean
  initialValue?: string
}

export default function InputBar({ onSend, loading, initialValue = '' }: Props) {
  const [query, setQuery]           = useState(initialValue)
  const [domain, setDomain]         = useState<Domain>('auto')
  const [attachedFile, setFile]     = useState<File | null>(null)
  const [recording, setRecording]   = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [recSeconds, setRecSeconds] = useState(0)

  const textareaRef  = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecRef  = useRef<MediaRecorder | null>(null)
  const chunksRef    = useRef<Blob[]>([])
  const timerRef     = useRef<NodeJS.Timeout | null>(null)

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
    if ((!q && !attachedFile) || loading) return
    onSend(q, domain, attachedFile ?? undefined)
    setQuery('')
    setFile(null)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setFile(f)
    e.target.value = ''
  }

  // ── Voice recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      mr.ondataavailable = e => chunksRef.current.push(e.data)
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setTranscribing(true)
        try {
          const text = await transcribeAudio(blob)
          setQuery(prev => (prev ? prev + ' ' + text : text))
        } catch {
          // ignore transcription error silently
        } finally {
          setTranscribing(false)
        }
      }
      mr.start()
      mediaRecRef.current = mr
      setRecording(true)
      setRecSeconds(0)
      timerRef.current = setInterval(() => setRecSeconds(s => s + 1), 1000)
    } catch {
      alert('يرجى السماح بالوصول إلى الميكروفون')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop()
    mediaRecRef.current = null
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const canSend = (query.trim() || attachedFile) && !loading && !recording

  return (
    <div className="bg-warm-bg border-t border-warm-border px-4 py-3">
      <div className="max-w-3xl mx-auto">

        {/* Attached file chip */}
        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="flex items-center gap-1.5 bg-burgundy/10 border border-burgundy/20 text-burgundy text-xs rounded-lg px-2.5 py-1">
              <FileText size={12} />
              <span className="max-w-[200px] truncate">{attachedFile.name}</span>
              <button
                onClick={() => setFile(null)}
                className="hover:text-burgundy-dark ml-0.5"
              >
                <X size={11} />
              </button>
            </div>
            <span className="text-[10px] text-warm-muted">سيتم تحليل هذه الوثيقة</span>
          </div>
        )}

        <div className="flex items-end gap-2 bg-white border border-warm-border rounded-2xl px-3 py-3 shadow-sm focus-within:border-burgundy/50 transition-colors">

          {/* Domain selector — hidden on mobile to save space */}
          <select
            value={domain}
            onChange={e => setDomain(e.target.value as Domain)}
            className="hidden sm:block text-xs text-stone-600 bg-warm-bg border border-warm-border rounded-lg px-2 py-1.5 outline-none cursor-pointer shrink-0 mb-0.5"
          >
            {DOMAIN_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <div className="hidden sm:block w-px h-5 bg-warm-border self-center shrink-0" />

          {/* Text input */}
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder={recording ? '🔴 جارٍ التسجيل…' : attachedFile ? 'اكتب سؤالك حول الوثيقة (اختياري)…' : 'اطرح سؤالك البلدي…'}
            rows={1}
            disabled={loading || recording}
            className={clsx(
              'flex-1 bg-transparent text-sm text-stone-800 placeholder-warm-muted outline-none resize-none leading-6 max-h-36 text-right',
              (loading || recording) && 'opacity-50 cursor-not-allowed'
            )}
          />

          {/* Attach file */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || recording}
            title="إرفاق وثيقة"
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all',
              attachedFile
                ? 'bg-burgundy/10 text-burgundy'
                : 'text-warm-muted hover:text-stone-600 hover:bg-warm-bg'
            )}
          >
            <Paperclip size={16} />
          </button>

          {/* Voice recording */}
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={loading || transcribing}
            title={recording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
            className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all relative',
              recording
                ? 'bg-red-500 text-white'
                : transcribing
                ? 'bg-amber-500 text-white'
                : 'text-warm-muted hover:text-stone-600 hover:bg-warm-bg'
            )}
          >
            {transcribing ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : recording ? (
              <>
                <MicOff size={14} />
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-red-500 font-medium whitespace-nowrap">
                  {recSeconds}ث
                </span>
              </>
            ) : (
              <Mic size={16} />
            )}
          </button>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all',
              canSend
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}

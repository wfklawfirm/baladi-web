'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import LandingView from '@/components/LandingView'
import MessageBubble, { LoadingBubble } from '@/components/MessageBubble'
import InputBar from '@/components/InputBar'
import { ask, analyzeDocument } from '@/lib/api'
import type { Message, Conversation, Domain } from '@/lib/types'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const STORAGE_KEY = 'baladi_conversations'

function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return parsed.map((c: Conversation) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      messages: c.messages.map((m: Message) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    }))
  } catch {
    return []
  }
}

function saveConversations(convs: Conversation[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs))
}

export default function AssistantPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId]           = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [prefill, setPrefill]             = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setConversations(loadConversations()) }, [])

  const activeConv = conversations.find(c => c.id === activeId) ?? null
  const messages   = activeConv?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations)
  }, [conversations])

  // ── Helpers ───────────────────────────────────────────────────────────────
  function addMessage(convId: string, msg: Message) {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, msg] } : c)
    )
  }

  const newChat    = useCallback(() => { setActiveId(null); setPrefill('') }, [])
  const selectChat = useCallback((id: string) => { setActiveId(id); setPrefill('') }, [])
  const deleteChat = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(null)
  }, [activeId])

  // ── Send handler — routes to analyzeDocument or ask ───────────────────────
  const handleAsk = useCallback(async (query: string, domain: Domain, file?: File) => {
    if (loading) return

    const userMsg: Message = {
      id: uid(), role: 'user', content: query, timestamp: new Date(),
      attachedFile: file?.name,
    }

    let convId = activeId
    if (!convId) {
      convId = uid()
      const title = file ? `📄 ${file.name}` : query.slice(0, 50)
      setConversations(prev => [
        { id: convId!, title, messages: [userMsg], createdAt: new Date() },
        ...prev,
      ])
      setActiveId(convId)
    } else {
      addMessage(convId, userMsg)
    }

    setPrefill('')
    setLoading(true)

    try {
      if (file) {
        // ── Document analysis path ───────────────────────────────────────────
        const analysis = await analyzeDocument(file, query || undefined)
        const assistantMsg: Message = {
          id: uid(), role: 'assistant', content: '',
          analysis,
          confidence: analysis.confidence,
          duration_ms: analysis.duration_ms,
          sources: analysis.sources,
          timestamp: new Date(),
        }
        addMessage(convId, assistantMsg)
      } else {
        // ── Regular Q&A path ─────────────────────────────────────────────────
        const result = await ask({ query, domain, top_k: 10 })
        const assistantMsg: Message = {
          id: uid(), role: 'assistant',
          content: result.answer,
          sources: result.sources,
          confidence: result.confidence,
          duration_ms: result.duration_ms,
          chunks_used: result.chunks_used,
          timestamp: new Date(),
        }
        addMessage(convId, assistantMsg)
      }
    } catch (err) {
      addMessage(convId, {
        id: uid(), role: 'assistant',
        content: `حدث خطأ: ${err instanceof Error ? err.message : 'تعذّر الاتصال بالخادم'}`,
        timestamp: new Date(), error: true,
      })
    } finally {
      setLoading(false)
    }
  }, [activeId, loading])

  const handleExampleAsk = useCallback((q: string) => { setPrefill(q) }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-warm-bg">
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-warm-border bg-warm-bg/80 backdrop-blur-sm">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-warm-bg text-warm-muted transition-colors"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="flex-1" />
          {activeConv && (
            <span className="text-xs text-warm-muted">{activeConv.messages.length} رسالة</span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <LandingView onAsk={handleExampleAsk} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 pt-6 pb-44 space-y-5">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && <LoadingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <InputBar
          onSend={handleAsk}
          loading={loading}
          initialValue={prefill}
        />
      </main>
    </div>
  )
}

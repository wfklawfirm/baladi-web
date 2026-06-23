'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import LandingView from '@/components/LandingView'
import MessageBubble, { LoadingBubble } from '@/components/MessageBubble'
import InputBar from '@/components/InputBar'
import { ask } from '@/lib/api'
import type { Message, Conversation, Domain } from '@/lib/types'

// ── uuid polyfill (tiny inline) ───────────────────────────────────────────────
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

  // Load from localStorage on mount
  useEffect(() => {
    setConversations(loadConversations())
  }, [])

  // Active conversation
  const activeConv = conversations.find(c => c.id === activeId) ?? null
  const messages   = activeConv?.messages ?? []

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Persist on change
  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations)
  }, [conversations])

  // ── Actions ───────────────────────────────────────────────────────────────
  const newChat = useCallback(() => {
    setActiveId(null)
    setPrefill('')
  }, [])

  const selectChat = useCallback((id: string) => {
    setActiveId(id)
    setPrefill('')
  }, [])

  const deleteChat = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(null)
  }, [activeId])

  const handleAsk = useCallback(async (query: string, domain: Domain) => {
    if (loading) return

    // User message
    const userMsg: Message = {
      id: uid(), role: 'user', content: query, timestamp: new Date(),
    }

    // Ensure conversation exists
    let convId = activeId
    if (!convId) {
      convId = uid()
      const newConv: Conversation = {
        id: convId,
        title: query.slice(0, 50),
        messages: [userMsg],
        createdAt: new Date(),
      }
      setConversations(prev => [newConv, ...prev])
      setActiveId(convId)
    } else {
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, userMsg] }
            : c
        )
      )
    }

    setPrefill('')
    setLoading(true)

    try {
      const result = await ask({ query, domain, top_k: 8 })

      const assistantMsg: Message = {
        id:         uid(),
        role:       'assistant',
        content:    result.answer,
        sources:    result.sources,
        confidence: result.confidence,
        duration_ms: result.duration_ms,
        chunks_used: result.chunks_used,
        timestamp:  new Date(),
      }

      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, assistantMsg] }
            : c
        )
      )
    } catch (err) {
      const errMsg: Message = {
        id:        uid(),
        role:      'assistant',
        content:   `حدث خطأ: ${err instanceof Error ? err.message : 'تعذّر الاتصال بالخادم'}`,
        timestamp: new Date(),
        error:     true,
      }
      setConversations(prev =>
        prev.map(c =>
          c.id === convId
            ? { ...c, messages: [...c.messages, errMsg] }
            : c
        )
      )
    } finally {
      setLoading(false)
    }
  }, [activeId, loading])

  // Handle example pill click (landing page)
  const handleExampleAsk = useCallback((q: string) => {
    setPrefill(q)
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-warm-bg">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onNewChat={newChat}
        onSelectChat={selectChat}
        onDeleteChat={deleteChat}
        onToggle={() => setSidebarOpen(o => !o)}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top bar */}
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
          {/* Confidence badge for active query */}
          {activeConv && (
            <span className="text-xs text-warm-muted">
              {activeConv.messages.length} رسالة
            </span>
          )}
        </header>

        {/* Chat area / Landing */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <LandingView onAsk={handleExampleAsk} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 pt-6 pb-40 space-y-5">
              {messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && <LoadingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Fixed input bar */}
        <InputBar
          onSend={handleAsk}
          loading={loading}
          initialValue={prefill}
        />
      </main>
    </div>
  )
}

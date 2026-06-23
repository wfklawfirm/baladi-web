'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Menu, Settings, FileDown } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import LandingView from '@/components/LandingView'
import MessageBubble, { LoadingBubble } from '@/components/MessageBubble'
import InputBar from '@/components/InputBar'
import SettingsModal from '@/components/SettingsModal'
import { askStream, analyzeDocument } from '@/lib/api'
import type { HistoryMessage } from '@/lib/api'
import type { Message, Conversation, Domain } from '@/lib/types'
import { loadSettings } from '@/lib/settings'

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

const STORAGE_KEY      = 'baladi_conversations'
const MAX_HISTORY_TURNS = 6

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
  } catch { return [] }
}

function saveConversations(convs: Conversation[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(convs))
}

function buildHistory(messages: Message[]): HistoryMessage[] {
  return messages
    .filter(m => !m.error && !m.analysis && m.content.trim())
    .slice(-MAX_HISTORY_TURNS)
    .map(m => ({ role: m.role, content: m.content }))
}

/** Export current conversation as a print-ready HTML page */
function exportConversation(conv: Conversation) {
  const settings = loadSettings()
  const mun = settings.municipality ? `بلدية ${settings.municipality}` : 'Baladi AI'
  const today = new Date().toLocaleDateString('ar-LB', { year: 'numeric', month: 'long', day: 'numeric' })

  const rows = conv.messages.map(m => {
    if (m.role === 'user') {
      return `<div class="msg user"><div class="label">المستخدم</div><div class="bubble user-b">${m.attachedFile ? `<span class="chip">📄 ${m.attachedFile}</span>` : ''}${m.content || ''}</div></div>`
    }
    if (m.analysis) {
      return `<div class="msg assistant"><div class="label">Baladi AI — تحليل وثيقة</div><div class="bubble asst-b"><strong>${m.analysis.doc_type}</strong><br/>${m.analysis.summary}</div></div>`
    }
    return `<div class="msg assistant"><div class="label">Baladi AI</div><div class="bubble asst-b">${(m.content || '').replace(/\n/g, '<br/>')}</div></div>`
  }).join('\n')

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>محادثة — ${conv.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;600;700&display=swap');
  body { font-family: 'Noto Naskh Arabic', Arial, sans-serif; direction: rtl; background:#fff; color:#1a1a1a; padding:40px 60px; font-size:13pt; line-height:2; }
  .header { text-align:center; border-bottom:3px double #8b1a2b; padding-bottom:16px; margin-bottom:32px; }
  .header h1 { font-size:17pt; font-weight:700; color:#8b1a2b; }
  .header p { font-size:11pt; color:#666; margin-top:4px; }
  .msg { margin-bottom:20px; }
  .label { font-size:10pt; font-weight:700; color:#888; margin-bottom:4px; }
  .bubble { padding:12px 16px; border-radius:12px; font-size:12pt; line-height:1.9; }
  .user-b { background:#f9f0f2; border:1px solid #e8d0d5; max-width:80%; }
  .asst-b { background:#f4f6f9; border:1px solid #d4d9e4; }
  .chip { display:inline-block; background:#8b1a2b22; color:#8b1a2b; padding:2px 8px; border-radius:6px; font-size:10pt; margin-bottom:6px; }
  .footer { margin-top:48px; text-align:center; font-size:10pt; color:#aaa; border-top:1px solid #eee; padding-top:12px; }
  @media print { body { padding:20px 30px; } }
</style>
</head>
<body>
<div class="header">
  <h1>${mun}</h1>
  <p>سجل محادثة — ${conv.title}</p>
  <p>${today} | ${conv.messages.length} رسالة</p>
</div>
${rows}
<div class="footer">صادر عن نظام Baladi AI — للاستخدام الداخلي</div>
<script>window.onload = () => window.print();</script>
</body></html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return
  win.document.write(html)
  win.document.close()
}

export default function AssistantPage() {
  const [sidebarOpen, setSidebarOpen]   = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId]           = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [streaming, setStreaming]         = useState(false)
  const [prefill, setPrefill]             = useState('')
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setConversations(loadConversations()) }, [])

  const activeConv = conversations.find(c => c.id === activeId) ?? null
  const messages   = activeConv?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, streaming])

  useEffect(() => {
    if (conversations.length > 0) saveConversations(conversations)
  }, [conversations])

  function appendMessage(convId: string, msg: Message) {
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, msg] } : c)
    )
  }

  function patchMessage(convId: string, msgId: string, patch: Partial<Message>) {
    setConversations(prev =>
      prev.map(c => c.id !== convId ? c : {
        ...c,
        messages: c.messages.map(m => m.id === msgId ? { ...m, ...patch } : m),
      })
    )
  }

  const newChat    = useCallback(() => { setActiveId(null); setPrefill('') }, [])
  const selectChat = useCallback((id: string) => { setActiveId(id); setPrefill('') }, [])
  const deleteChat = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeId === id) setActiveId(null)
  }, [activeId])

  const handleAsk = useCallback(async (query: string, domain: Domain, file?: File) => {
    if (loading || streaming) return

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
      appendMessage(convId, userMsg)
    }

    setPrefill('')

    try {
      if (file) {
        setLoading(true)
        const analysis = await analyzeDocument(file, query || undefined)
        appendMessage(convId, {
          id: uid(), role: 'assistant', content: '',
          analysis, confidence: analysis.confidence,
          duration_ms: analysis.duration_ms, sources: analysis.sources,
          timestamp: new Date(),
        })
        return
      }

      setStreaming(true)
      const assistantId = uid()
      const t0 = Date.now()
      const currentMsgs = conversations.find(c => c.id === convId)?.messages ?? []
      const history = buildHistory([...currentMsgs, userMsg])

      appendMessage(convId, {
        id: assistantId, role: 'assistant',
        content: '', timestamp: new Date(), streaming: true,
      })

      let fullContent = ''

      for await (const chunk of askStream({ query, domain, top_k: 10, history })) {
        if (chunk.error) throw new Error(chunk.error)
        if (chunk.delta) {
          fullContent += chunk.delta
          patchMessage(convId, assistantId, { content: fullContent })
        }
        if (chunk.done) {
          patchMessage(convId, assistantId, {
            content: fullContent,
            sources: chunk.sources ?? [],
            confidence: chunk.confidence,
            chunks_used: chunk.chunks_used,
            duration_ms: Date.now() - t0,
            streaming: false,
            follow_up: chunk.follow_up ?? [],
          })
        }
      }

    } catch (err) {
      appendMessage(convId, {
        id: uid(), role: 'assistant',
        content: `حدث خطأ: ${err instanceof Error ? err.message : 'تعذّر الاتصال بالخادم'}`,
        timestamp: new Date(), error: true,
      })
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }, [activeId, loading, streaming, conversations])

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

      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
        <header className="flex items-center gap-2 px-4 py-3 border-b border-warm-border bg-warm-bg/80 backdrop-blur-sm">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-warm-border text-warm-muted transition-colors"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="flex-1" />

          {/* Export conversation */}
          {activeConv && activeConv.messages.length > 0 && (
            <button
              onClick={() => exportConversation(activeConv)}
              title="تصدير المحادثة كـ PDF"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-warm-muted hover:text-stone-700 hover:bg-warm-border transition-colors"
            >
              <FileDown size={14} />
              تصدير
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => setSettingsOpen(true)}
            title="إعدادات البلدية"
            className="p-1.5 rounded-lg hover:bg-warm-border text-warm-muted hover:text-stone-700 transition-colors"
          >
            <Settings size={16} />
          </button>

          {activeConv && (
            <span className="text-xs text-warm-muted pr-1">{activeConv.messages.length} رسالة</span>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <LandingView onAsk={handleExampleAsk} />
          ) : (
            <div className="max-w-3xl mx-auto px-4 pt-6 pb-44 space-y-5">
              {messages.map(msg => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onFollowUp={(q) => handleAsk(q, 'auto')}
                />
              ))}
              {loading && <LoadingBubble />}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <InputBar
          onSend={handleAsk}
          loading={loading || streaming}
          initialValue={prefill}
        />
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

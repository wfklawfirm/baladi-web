import type { Domain, Source, DocumentAnalysis } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('baladi_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export interface AuthPayload { username: string; password: string; municipality?: string; phone?: string; email?: string }
export interface AuthResult  { token: string; username: string; municipality: string; expires_at: string; days_remaining: number }

export async function apiRegister(p: AuthPayload): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  })
  const data = await res.json().catch(() => ({ detail: res.statusText }))
  if (!res.ok) throw new Error(data.detail ?? 'Registration error')
  return data
}

export async function apiLogin(p: { username: string; password: string }): Promise<AuthResult> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(p),
  })
  const data = await res.json().catch(() => ({ detail: res.statusText }))
  if (!res.ok) throw new Error(data.detail ?? 'Login error')
  return data
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AskPayload {
  query: string
  top_k?: number
  domain?: Domain
  history?: HistoryMessage[]
}

export interface AskResult {
  answer: string
  sources: Source[]
  confidence: 'high' | 'medium' | 'low'
  duration_ms: number
  chunks_used: number
  query: string
}

export interface StreamChunk {
  delta?: string
  done?: boolean
  error?: string
  sources?: Source[]
  confidence?: 'high' | 'medium' | 'low'
  chunks_used?: number
  query?: string
  follow_up?: string[]
}

/**
 * Streaming Q&A — yields delta strings, then a final {done: true, sources, confidence, ...} chunk.
 */
export async function* askStream(payload: AskPayload): AsyncGenerator<StreamChunk> {
  const res = await fetch(`${API_URL}/api/ask/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({
      query:   payload.query,
      top_k:   payload.top_k ?? 10,
      domain:  payload.domain === 'auto' ? null : payload.domain ?? null,
      history: payload.history ?? [],
    }),
  })

  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Stream error')
  }

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer    = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw) continue
      try { yield JSON.parse(raw) as StreamChunk } catch { /* ignore */ }
    }
  }
}

export async function ask(payload: AskPayload): Promise<AskResult> {
  const res = await fetch(`${API_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({
      query:   payload.query,
      top_k:   payload.top_k ?? 10,
      domain:  payload.domain === 'auto' ? null : payload.domain ?? null,
      history: payload.history ?? [],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'API error')
  }
  return res.json()
}

export async function analyzeDocument(
  file: File,
  query?: string,
): Promise<DocumentAnalysis> {
  const form = new FormData()
  form.append('file', file)
  if (query) form.append('query', query)

  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { ...authHeader() },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Analysis error')
  }
  return res.json()
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData()
  form.append('audio', blob, 'recording.webm')

  const res = await fetch(`${API_URL}/api/transcribe`, {
    method: 'POST',
    headers: { ...authHeader() },
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Transcription error')
  }
  const data = await res.json()
  return data.text
}

export async function checkHealth(): Promise<{ status: string; points: number }> {
  const res = await fetch(`${API_URL}/api/health`, { cache: 'no-store' })
  if (!res.ok) throw new Error('API unavailable')
  return res.json()
}

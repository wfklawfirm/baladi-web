import type { Domain, Source, DocumentAnalysis } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface AskPayload {
  query: string
  top_k?: number
  domain?: Domain
}

export interface AskResult {
  answer: string
  sources: Source[]
  confidence: 'high' | 'medium' | 'low'
  duration_ms: number
  chunks_used: number
  query: string
}

export async function ask(payload: AskPayload): Promise<AskResult> {
  const res = await fetch(`${API_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query:  payload.query,
      top_k:  payload.top_k ?? 10,
      domain: payload.domain === 'auto' ? null : payload.domain ?? null,
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

'use client'

import { useState, useRef } from 'react'
import {
  Lock, Plus, Upload, List, Trash2, CheckCircle,
  XCircle, Loader2, FileText, ChevronDown, LogOut,
  Database, AlertTriangle, Eye, EyeOff,
} from 'lucide-react'
import { DOMAIN_OPTIONS } from '@/lib/types'
import clsx from 'clsx'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://baladi-api-n1tg.onrender.com'

type Tab = 'add-text' | 'upload-doc' | 'chunks'

interface Chunk {
  chunk_id: string
  title: string
  text_preview: string
  domain: string
  domain_name: string
  added_by: string
}

interface Toast { msg: string; ok: boolean }

// ── Admin API helpers ─────────────────────────────────────────────────────────
async function adminFetch(path: string, secret: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers ?? {}),
      'x-admin-secret': secret,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'خطأ غير معروف')
  }
  return res.json()
}

export default function AdminPage() {
  const [secret, setSecret]       = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [authed, setAuthed]       = useState(false)
  const [authErr, setAuthErr]     = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [tab, setTab]             = useState<Tab>('add-text')
  const [toast, setToast]         = useState<Toast | null>(null)
  const [loading, setLoading]     = useState(false)

  // Add-text form
  const [title, setTitle]         = useState('')
  const [text, setText]           = useState('')
  const [domain, setDomain]       = useState('D01')
  const [source, setSource]       = useState('')

  // Upload form
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDomain, setUploadDomain] = useState('D01')
  const [uploadSource, setUploadSource] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Chunks list
  const [chunks, setChunks]       = useState<Chunk[]>([])
  const [chunksLoaded, setChunksLoaded] = useState(false)

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setAuthErr('')
    setAuthLoading(true)
    try {
      await adminFetch('/api/admin/chunks?limit=1', secret)
      setAuthed(true)
    } catch (err: unknown) {
      setAuthErr(err instanceof Error ? err.message : 'كلمة السر غير صحيحة')
    } finally {
      setAuthLoading(false)
    }
  }

  // ── Add text chunk ─────────────────────────────────────────────────────────
  async function handleAddText(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !text.trim()) return
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/add-chunk', secret, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, text, domain, source: source || title }),
      })
      showToast(`✅ تم إضافة ${res.inserted} chunk(s) إلى قاعدة البيانات`, true)
      setTitle(''); setText(''); setSource('')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'خطأ', false)
    } finally {
      setLoading(false)
    }
  }

  // ── Upload document ────────────────────────────────────────────────────────
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!uploadFile) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', uploadFile)
    fd.append('domain', uploadDomain)
    fd.append('source', uploadSource || uploadFile.name)
    try {
      const res = await adminFetch('/api/admin/upload-doc', secret, {
        method: 'POST',
        body: fd,
      })
      showToast(`✅ تم فهرسة ${res.inserted} مقطع من الملف`, true)
      setUploadFile(null); setUploadSource('')
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'خطأ في الرفع', false)
    } finally {
      setLoading(false)
    }
  }

  // ── Load chunks ────────────────────────────────────────────────────────────
  async function loadChunks() {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/chunks?limit=100', secret)
      setChunks(res.chunks)
      setChunksLoaded(true)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'خطأ في التحميل', false)
    } finally {
      setLoading(false)
    }
  }

  // ── Delete chunk ───────────────────────────────────────────────────────────
  async function handleDelete(chunk_id: string) {
    if (!confirm('هل أنت متأكد من حذف هذا المقطع؟')) return
    try {
      await adminFetch(`/api/admin/chunks/${chunk_id}`, secret, { method: 'DELETE' })
      setChunks(prev => prev.filter(c => c.chunk_id !== chunk_id))
      showToast('تم الحذف', true)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'خطأ في الحذف', false)
    }
  }

  // ── Password gate ─────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-warm-bg flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl border border-warm-border shadow-sm w-full max-w-sm p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-burgundy/10 flex items-center justify-center mb-4">
              <Lock size={24} className="text-burgundy" />
            </div>
            <h1 className="text-xl font-bold text-stone-800">لوحة تحكم Admin</h1>
            <p className="text-sm text-warm-muted mt-1">Baladi AI — إدارة قاعدة المعرفة</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="كلمة سر المشرف"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                className="w-full bg-warm-bg border border-warm-border rounded-xl px-4 py-3 text-sm outline-none focus:border-burgundy/60 text-right pr-10"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted hover:text-stone-600"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {authErr && (
              <p className="text-sm text-red-500 text-center">{authErr}</p>
            )}

            <button
              type="submit"
              disabled={!secret || authLoading}
              className="w-full bg-burgundy text-white rounded-xl py-3 text-sm font-semibold hover:bg-burgundy/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {authLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              دخول
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Admin dashboard ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-warm-bg" dir="rtl">

      {/* Toast */}
      {toast && (
        <div className={clsx(
          'fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border transition-all',
          toast.ok
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-700'
        )}>
          {toast.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-warm-border px-6 py-4 flex items-center gap-3">
        <Database size={18} className="text-burgundy" />
        <div className="flex-1">
          <h1 className="text-base font-bold text-stone-800">لوحة تحكم Baladi AI</h1>
          <p className="text-xs text-warm-muted">إدارة قاعدة المعرفة البلدية</p>
        </div>
        <button
          onClick={() => { setAuthed(false); setSecret('') }}
          className="flex items-center gap-1.5 text-xs text-warm-muted hover:text-red-500 transition-colors"
        >
          <LogOut size={14} />
          خروج
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-warm-border rounded-xl p-1 mb-6">
          {([
            { id: 'add-text', icon: <Plus size={14}/>, label: 'إضافة نص' },
            { id: 'upload-doc', icon: <Upload size={14}/>, label: 'رفع ملف' },
            { id: 'chunks', icon: <List size={14}/>, label: 'المقاطع المضافة' },
          ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'chunks' && !chunksLoaded) loadChunks() }}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-burgundy text-white'
                  : 'text-stone-600 hover:bg-warm-bg'
              )}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Tab: Add text ── */}
        {tab === 'add-text' && (
          <form onSubmit={handleAddText} className="bg-white rounded-2xl border border-warm-border p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">عنوان المعلومة *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="مثال: المادة 49 من قانون البلديات — صلاحيات رئيس البلدية"
                className="w-full bg-warm-bg border border-warm-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-burgundy/60 text-right"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1.5">النص / المعلومة *</label>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="أدخل النص الكامل — القانون، المادة، القرار، النموذج، التعميم، الإجراء..."
                rows={8}
                className="w-full bg-warm-bg border border-warm-border rounded-xl px-4 py-3 text-sm outline-none focus:border-burgundy/60 text-right resize-none leading-7"
                required
              />
              <p className="text-[10px] text-warm-muted mt-1">{text.length} حرف — سيتم تقسيمه إلى مقاطع تلقائياً إذا تجاوز 600 حرف</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">المجال</label>
                <select
                  value={domain}
                  onChange={e => setDomain(e.target.value)}
                  className="w-full bg-warm-bg border border-warm-border rounded-xl px-3 py-2.5 text-sm outline-none text-right"
                >
                  {DOMAIN_OPTIONS.filter(o => o.value !== 'auto').map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">المصدر (اختياري)</label>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="مثال: قانون 118/1977"
                  className="w-full bg-warm-bg border border-warm-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-burgundy/60 text-right"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !title.trim() || !text.trim()}
              className="w-full bg-burgundy text-white rounded-xl py-3 text-sm font-semibold hover:bg-burgundy/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              إضافة إلى قاعدة البيانات
            </button>
          </form>
        )}

        {/* ── Tab: Upload doc ── */}
        {tab === 'upload-doc' && (
          <form onSubmit={handleUpload} className="bg-white rounded-2xl border border-warm-border p-6 space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className={clsx(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                uploadFile ? 'border-burgundy/40 bg-burgundy/5' : 'border-warm-border hover:border-burgundy/30 hover:bg-warm-bg'
              )}
            >
              {uploadFile ? (
                <div className="flex items-center justify-center gap-2 text-burgundy">
                  <FileText size={20} />
                  <span className="font-medium text-sm">{uploadFile.name}</span>
                  <span className="text-xs text-warm-muted">({(uploadFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <>
                  <Upload size={28} className="text-warm-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-stone-600">اسحب الملف هنا أو اضغط للاختيار</p>
                  <p className="text-xs text-warm-muted mt-1">PDF، Word، TXT</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">المجال</label>
                <select
                  value={uploadDomain}
                  onChange={e => setUploadDomain(e.target.value)}
                  className="w-full bg-warm-bg border border-warm-border rounded-xl px-3 py-2.5 text-sm outline-none text-right"
                >
                  {DOMAIN_OPTIONS.filter(o => o.value !== 'auto').map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 mb-1.5">اسم المصدر (اختياري)</label>
                <input
                  type="text"
                  value={uploadSource}
                  onChange={e => setUploadSource(e.target.value)}
                  placeholder="مثال: مرسوم 2522"
                  className="w-full bg-warm-bg border border-warm-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-burgundy/60 text-right"
                />
              </div>
            </div>

            <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-5">
                الملف سيُقسَّم تلقائياً إلى مقاطع وسيُفهرَس في Qdrant ليصبح متاحاً فوراً للبحث
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !uploadFile}
              className="w-full bg-burgundy text-white rounded-xl py-3 text-sm font-semibold hover:bg-burgundy/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              رفع وفهرسة الملف
            </button>
          </form>
        )}

        {/* ── Tab: Chunks list ── */}
        {tab === 'chunks' && (
          <div className="bg-white rounded-2xl border border-warm-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-border">
              <div className="flex items-center gap-2">
                <Database size={15} className="text-burgundy" />
                <span className="text-sm font-semibold text-stone-800">المقاطع المضافة يدوياً</span>
                <span className="text-xs bg-burgundy/10 text-burgundy px-2 py-0.5 rounded-full">{chunks.length}</span>
              </div>
              <button
                onClick={loadChunks}
                disabled={loading}
                className="text-xs text-warm-muted hover:text-stone-600 flex items-center gap-1 transition-colors"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : null}
                تحديث
              </button>
            </div>

            {loading && !chunksLoaded ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-burgundy animate-spin" />
              </div>
            ) : chunks.length === 0 ? (
              <div className="text-center py-12 text-warm-muted text-sm">
                لا توجد مقاطع مضافة بعد
              </div>
            ) : (
              <div className="divide-y divide-warm-border">
                {chunks.map(c => (
                  <div key={c.chunk_id} className="flex items-start gap-3 px-5 py-4 hover:bg-warm-bg transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-semibold text-stone-800 truncate">{c.title}</p>
                        <span className="text-[10px] bg-warm-bg border border-warm-border text-stone-500 px-1.5 py-0.5 rounded shrink-0">
                          {c.domain_name || c.domain}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 leading-5 line-clamp-2">{c.text_preview}</p>
                      <p className="text-[10px] text-warm-muted mt-1 font-mono">{c.chunk_id}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(c.chunk_id)}
                      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-warm-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

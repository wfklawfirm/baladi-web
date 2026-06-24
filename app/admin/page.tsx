'use client'

import { useState, useRef } from 'react'
import {
  Lock, Plus, Upload, List, Trash2, CheckCircle,
  XCircle, Loader2, FileText, ChevronDown, LogOut,
  Database, AlertTriangle, Eye, EyeOff, Users, RefreshCw,
  BarChart2, TrendingUp, Clock, MessageSquare, Activity,
} from 'lucide-react'
import { DOMAIN_OPTIONS } from '@/lib/types'
import clsx from 'clsx'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'https://baladi-api-n1tg.onrender.com'

type Tab = 'add-text' | 'upload-doc' | 'chunks' | 'users' | 'analytics'

interface AnalyticsData {
  total_queries: number
  unique_users: number
  avg_response_ms: number
  top_domain: string | null
  top_questions: { query: string; count: number }[]
  per_user: { username: string; count: number; last: string; municipality: string }[]
  domain_dist: { domain: string; count: number; pct: number }[]
  confidence_dist: { confidence: string; count: number }[]
  query_type_dist: { type: string; count: number }[]
  daily_counts: { date: string; count: number }[]
}

interface UserRecord {
  username: string
  municipality: string
  phone: string
  email?: string
  created_at: string
  expires_at: string
  last_login?: string
}

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

  // Users list
  const [users, setUsers]         = useState<UserRecord[]>([])
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [extendDays, setExtendDays] = useState<Record<string, number>>({})

  // Analytics
  const [analytics, setAnalytics]       = useState<AnalyticsData | null>(null)
  const [analyticsLoaded, setAnalyticsLoaded] = useState(false)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

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

  // ── Load users ────────────────────────────────────────────────────────────
  async function loadUsers() {
    setLoading(true)
    try {
      const res = await adminFetch('/api/admin/users', secret)
      setUsers(res.users)
      setUsersLoaded(true)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'خطأ في تحميل المستخدمين', false)
    } finally {
      setLoading(false)
    }
  }

  // ── Load analytics ────────────────────────────────────────────────────────
  async function loadAnalytics() {
    setAnalyticsLoading(true)
    try {
      const res = await adminFetch('/api/admin/analytics', secret)
      setAnalytics(res)
      setAnalyticsLoaded(true)
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'خطأ في تحميل التحليلات', false)
    } finally {
      setAnalyticsLoading(false)
    }
  }

  // ── Extend trial ──────────────────────────────────────────────────────────
  async function handleExtend(username: string) {
    const days = extendDays[username] ?? 7
    try {
      await adminFetch(`/api/admin/users/${username}/extend`, secret, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })
      showToast(`✅ تم تمديد اشتراك ${username} بـ ${days} أيام`, true)
      loadUsers()
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'خطأ في التمديد', false)
    }
  }

  function userStatus(expires_at: string): { label: string; cls: string } {
    const exp = new Date(expires_at)
    const now = new Date()
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / 86400000)
    if (daysLeft < 0) return { label: 'منتهٍ', cls: 'bg-red-100 text-red-700' }
    if (daysLeft <= 1) return { label: `${daysLeft} يوم`, cls: 'bg-amber-100 text-amber-700' }
    return { label: `${daysLeft} أيام`, cls: 'bg-emerald-100 text-emerald-700' }
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
        <div className="flex gap-1 bg-white border border-warm-border rounded-xl p-1 mb-6 flex-wrap">
          {([
            { id: 'add-text', icon: <Plus size={14}/>, label: 'إضافة نص' },
            { id: 'upload-doc', icon: <Upload size={14}/>, label: 'رفع ملف' },
            { id: 'chunks', icon: <List size={14}/>, label: 'المقاطع' },
            { id: 'users', icon: <Users size={14}/>, label: 'المستخدمون' },
            { id: 'analytics', icon: <BarChart2 size={14}/>, label: 'التحليلات' },
          ] as { id: Tab; icon: React.ReactNode; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                if (t.id === 'chunks' && !chunksLoaded) loadChunks()
                if (t.id === 'users' && !usersLoaded) loadUsers()
                if (t.id === 'analytics' && !analyticsLoaded) loadAnalytics()
              }}
              className={clsx(
                'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all min-w-[80px]',
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
        {/* ── Tab: Users ── */}
        {tab === 'users' && (
          <div className="bg-white rounded-2xl border border-warm-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-border">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-burgundy" />
                <span className="text-sm font-semibold text-stone-800">المستخدمون المسجّلون</span>
                <span className="text-xs bg-burgundy/10 text-burgundy px-2 py-0.5 rounded-full">{users.length}</span>
              </div>
              <button
                onClick={loadUsers}
                disabled={loading}
                className="text-xs text-warm-muted hover:text-stone-600 flex items-center gap-1 transition-colors"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                تحديث
              </button>
            </div>

            {loading && !usersLoaded ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-burgundy animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-warm-muted text-sm">لا يوجد مستخدمون بعد</div>
            ) : (
              <div className="divide-y divide-warm-border">
                {users.map(u => {
                  const status = userStatus(u.expires_at)
                  const created = new Date(u.created_at).toLocaleDateString('ar-LB')
                  const expires = new Date(u.expires_at).toLocaleDateString('ar-LB')
                  return (
                    <div key={u.username} className="px-5 py-4 hover:bg-warm-bg transition-colors">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-sm font-semibold text-stone-800 font-mono">{u.username}</span>
                            <span className={clsx('text-[10px] px-2 py-0.5 rounded-full font-medium', status.cls)}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mb-0.5">🏛 {u.municipality}</p>
                          <p className="text-xs text-stone-500">📞 {u.phone}{u.email ? ` · ✉ ${u.email}` : ''}</p>
                          <p className="text-[10px] text-warm-muted mt-1">
                            تسجيل: {created} · انتهاء: {expires}
                            {u.last_login ? ` · آخر دخول: ${new Date(u.last_login).toLocaleDateString('ar-LB')}` : ''}
                          </p>
                        </div>

                        {/* Extend trial */}
                        <div className="flex items-center gap-2 shrink-0">
                          <select
                            value={extendDays[u.username] ?? 7}
                            onChange={e => setExtendDays(prev => ({ ...prev, [u.username]: +e.target.value }))}
                            className="text-xs bg-warm-bg border border-warm-border rounded-lg px-2 py-1.5 outline-none"
                          >
                            {[3,7,14,30,60,90].map(d => <option key={d} value={d}>{d} أيام</option>)}
                          </select>
                          <button
                            onClick={() => handleExtend(u.username)}
                            className="text-xs bg-navy/10 text-navy hover:bg-navy/20 px-3 py-1.5 rounded-lg font-medium transition-colors"
                          >
                            تمديد
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Analytics ── */}
        {tab === 'analytics' && (
          <div className="space-y-5">
            {/* Refresh button */}
            <div className="flex justify-end">
              <button
                onClick={loadAnalytics}
                disabled={analyticsLoading}
                className="flex items-center gap-1.5 text-xs text-warm-muted hover:text-stone-600 transition-colors"
              >
                {analyticsLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                تحديث البيانات
              </button>
            </div>

            {analyticsLoading && !analyticsLoaded ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={28} className="text-burgundy animate-spin" />
              </div>
            ) : !analytics ? (
              <div className="text-center py-12 text-warm-muted text-sm">لا توجد بيانات بعد</div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: <MessageSquare size={16} className="text-burgundy" />, value: analytics.total_queries.toLocaleString('ar-EG'), label: 'إجمالي الاستفسارات' },
                    { icon: <Users size={16} className="text-navy" />, value: analytics.unique_users.toString(), label: 'مستخدمون نشطون' },
                    { icon: <Clock size={16} className="text-amber-600" />, value: `${(analytics.avg_response_ms / 1000).toFixed(1)}ث`, label: 'متوسط وقت الاستجابة' },
                    { icon: <TrendingUp size={16} className="text-emerald-600" />, value: analytics.top_domain ?? '—', label: 'أكثر مجال استخداماً' },
                  ].map((card, i) => (
                    <div key={i} className="bg-white border border-warm-border rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {card.icon}
                        <span className="text-xs text-warm-muted">{card.label}</span>
                      </div>
                      <p className="text-xl font-bold text-stone-800 leading-none">{card.value}</p>
                    </div>
                  ))}
                </div>

                {/* Daily activity chart */}
                <div className="bg-white border border-warm-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Activity size={15} className="text-burgundy" />
                    <span className="text-sm font-semibold text-stone-800">النشاط اليومي — آخر 14 يوماً</span>
                  </div>
                  {(() => {
                    const maxCount = Math.max(...analytics.daily_counts.map(d => d.count), 1)
                    return (
                      <div className="flex items-end gap-1 h-20">
                        {analytics.daily_counts.map(d => (
                          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                            <div
                              className="w-full rounded-t bg-burgundy/70 group-hover:bg-burgundy transition-colors"
                              style={{ height: `${Math.max(4, (d.count / maxCount) * 72)}px` }}
                            />
                            {/* Tooltip */}
                            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
                              <div className="bg-stone-800 text-white text-[10px] rounded px-1.5 py-0.5 whitespace-nowrap">
                                {d.count} • {d.date.slice(5)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  <div className="flex justify-between mt-1">
                    <span className="text-[9px] text-warm-muted">{analytics.daily_counts[0]?.date.slice(5)}</span>
                    <span className="text-[9px] text-warm-muted">{analytics.daily_counts[analytics.daily_counts.length - 1]?.date.slice(5)}</span>
                  </div>
                </div>

                {/* Top questions */}
                <div className="bg-white border border-warm-border rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-warm-border">
                    <MessageSquare size={15} className="text-burgundy" />
                    <span className="text-sm font-semibold text-stone-800">الأسئلة الأكثر تكراراً</span>
                  </div>
                  {analytics.top_questions.length === 0 ? (
                    <p className="text-sm text-warm-muted text-center py-8">لا توجد بيانات بعد</p>
                  ) : (
                    <div className="divide-y divide-warm-border">
                      {analytics.top_questions.map((q, i) => {
                        const maxQ = analytics.top_questions[0]?.count || 1
                        return (
                          <div key={i} className="px-5 py-3">
                            <div className="flex items-center justify-between gap-3 mb-1.5">
                              <p className="text-sm text-stone-700 leading-5 flex-1 text-right">{q.query}</p>
                              <span className="shrink-0 text-xs font-bold text-burgundy bg-burgundy/10 rounded-full px-2 py-0.5">
                                ×{q.count}
                              </span>
                            </div>
                            <div className="w-full bg-warm-bg rounded-full h-1.5">
                              <div
                                className="bg-burgundy/60 h-1.5 rounded-full transition-all"
                                style={{ width: `${(q.count / maxQ) * 100}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Two-column: Domain dist + Confidence dist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Domain distribution */}
                  <div className="bg-white border border-warm-border rounded-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-warm-border">
                      <span className="text-sm font-semibold text-stone-800">توزيع المجالات</span>
                    </div>
                    <div className="p-4 space-y-2.5">
                      {analytics.domain_dist.slice(0, 8).map((d, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-stone-600 font-mono">{d.domain}</span>
                            <span className="text-warm-muted">{d.count} ({d.pct}%)</span>
                          </div>
                          <div className="w-full bg-warm-bg rounded-full h-1.5">
                            <div
                              className="bg-navy/50 h-1.5 rounded-full"
                              style={{ width: `${d.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confidence + type dist */}
                  <div className="space-y-4">
                    <div className="bg-white border border-warm-border rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-warm-border">
                        <span className="text-sm font-semibold text-stone-800">مستوى الثقة</span>
                      </div>
                      <div className="p-4 space-y-2.5">
                        {analytics.confidence_dist.map((c, i) => {
                          const total = analytics.confidence_dist.reduce((s, x) => s + x.count, 0) || 1
                          const pct = Math.round((c.count / total) * 100)
                          const color = c.confidence === 'high' ? 'bg-emerald-400' : c.confidence === 'medium' ? 'bg-amber-400' : 'bg-red-400'
                          const label = c.confidence === 'high' ? 'عالية' : c.confidence === 'medium' ? 'متوسطة' : 'منخفضة'
                          return (
                            <div key={i}>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-stone-600">{label}</span>
                                <span className="text-warm-muted">{c.count} ({pct}%)</span>
                              </div>
                              <div className="w-full bg-warm-bg rounded-full h-1.5">
                                <div className={`${color} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="bg-white border border-warm-border rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-warm-border">
                        <span className="text-sm font-semibold text-stone-800">نوع الاستخدام</span>
                      </div>
                      <div className="p-4 flex gap-3">
                        {analytics.query_type_dist.map((t, i) => {
                          const total = analytics.query_type_dist.reduce((s, x) => s + x.count, 0) || 1
                          const pct = Math.round((t.count / total) * 100)
                          const label = t.type === 'ask' ? 'نص' : t.type === 'analyze' ? 'وثيقة' : t.type
                          return (
                            <div key={i} className="flex-1 text-center bg-warm-bg rounded-xl py-3">
                              <p className="text-lg font-bold text-navy">{pct}%</p>
                              <p className="text-xs text-warm-muted mt-0.5">{label}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-user table */}
                <div className="bg-white border border-warm-border rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-warm-border">
                    <Users size={15} className="text-burgundy" />
                    <span className="text-sm font-semibold text-stone-800">نشاط المستخدمين</span>
                  </div>
                  <div className="divide-y divide-warm-border">
                    {analytics.per_user.slice(0, 20).map((u, i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-3">
                        <span className="text-xs text-warm-muted w-5 text-center shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono text-stone-700 truncate">{u.username}</p>
                          {u.municipality && <p className="text-[10px] text-warm-muted">{u.municipality}</p>}
                        </div>
                        <span className="text-xs font-bold text-burgundy shrink-0">{u.count} سؤال</span>
                        <span className="text-[10px] text-warm-muted shrink-0 hidden sm:block">
                          {u.last ? new Date(u.last).toLocaleDateString('ar-LB') : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

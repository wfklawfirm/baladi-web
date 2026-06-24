'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { apiLogin, apiRegister } from '@/lib/api'
import { setAuth } from '@/lib/auth'
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from 'lucide-react'
import clsx from 'clsx'

type Tab = 'login' | 'register'

export default function LoginPage() {
  const router  = useRouter()
  const [tab, setTab]         = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPwd, setShowPwd] = useState(false)

  // Login fields
  const [lUser, setLUser] = useState('')
  const [lPwd,  setLPwd]  = useState('')

  // Register fields
  const [rUser, setRUser] = useState('')
  const [rPwd,  setRPwd]  = useState('')
  const [rMun,  setRMun]  = useState('')
  const [rPhone,setRPhone]= useState('')
  const [rEmail,setREmail]= useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiLogin({ username: lUser.trim(), password: lPwd })
      setAuth(res.token, res)
      router.replace('/assistant')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await apiRegister({
        username: rUser.trim(), password: rPwd,
        municipality: rMun.trim(), phone: rPhone.trim(), email: rEmail.trim(),
      })
      setAuth(res.token, res)
      router.replace('/assistant')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full text-sm text-stone-800 bg-white border border-warm-border rounded-xl px-4 py-3 outline-none focus:border-burgundy/60 focus:ring-1 focus:ring-burgundy/20 transition-all text-right placeholder-warm-muted'

  return (
    <div className="min-h-screen bg-warm-bg flex flex-col items-center justify-center px-4 py-10" dir="rtl">
      {/* Logo + Title */}
      <div className="flex flex-col items-center mb-8">
        <Image src="/logo.png" alt="Baladi AI" width={80} height={80} className="object-contain mb-3 drop-shadow-sm" />
        <h1 className="text-xl font-bold text-navy">Baladi AI</h1>
        <p className="text-sm text-warm-muted mt-1">مستشارك القانوني والإداري البلدي</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-warm-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-warm-border">
          {(['login', 'register'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              className={clsx(
                'flex-1 py-3.5 text-sm font-medium transition-colors',
                tab === t ? 'text-burgundy border-b-2 border-burgundy bg-white' : 'text-warm-muted hover:text-stone-600'
              )}
            >
              {t === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 text-right">
              {error}
            </div>
          )}

          {/* Login form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 text-right">اسم المستخدم</label>
                <input
                  value={lUser} onChange={e => setLUser(e.target.value)}
                  placeholder="اسم المستخدم"
                  required className={inputCls}
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 text-right">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={lPwd} onChange={e => setLPwd(e.target.value)}
                    placeholder="••••••••"
                    required className={clsx(inputCls, 'pl-10')}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted hover:text-stone-600">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60 mt-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {loading ? 'جاري الدخول…' : 'دخول'}
              </button>
            </form>
          )}

          {/* Register form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5 text-right">اسم المستخدم *</label>
                  <input value={rUser} onChange={e => setRUser(e.target.value)}
                    placeholder="user123" required className={inputCls} autoComplete="username" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1.5 text-right">كلمة المرور *</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'}
                      value={rPwd} onChange={e => setRPwd(e.target.value)}
                      placeholder="6+ أحرف" required className={clsx(inputCls, 'pl-9')}
                      autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-warm-muted hover:text-stone-600">
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 text-right">اسم البلدية *</label>
                <input value={rMun} onChange={e => setRMun(e.target.value)}
                  placeholder="مثال: بلدية بشري" required className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 text-right">رقم الهاتف *</label>
                <input value={rPhone} onChange={e => setRPhone(e.target.value)}
                  placeholder="03 000 000" required className={inputCls} type="tel" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5 text-right">البريد الإلكتروني (اختياري)</label>
                <input value={rEmail} onChange={e => setREmail(e.target.value)}
                  placeholder="email@example.com" className={inputCls} type="email" />
              </div>

              {/* Trial notice */}
              <div className="bg-navy/5 border border-navy/15 rounded-xl px-4 py-3 text-xs text-navy/80 text-right leading-5">
                🎁 تجربة مجانية لمدة <strong>3 أيام</strong> — بعدها تواصل مع الإدارة لتجديد الاشتراك
              </div>

              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-60">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                {loading ? 'جاري إنشاء الحساب…' : 'إنشاء الحساب والبدء'}
              </button>
            </form>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-warm-muted text-center">
        للدعم والاستفسار — تواصل مع مدير المنصة
      </p>
    </div>
  )
}

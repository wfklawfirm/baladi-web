'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { apiLogin, apiRegister } from '@/lib/api'
import { setAuth } from '@/lib/auth'
import {
  Eye, EyeOff, Loader2, LogIn, Send,
  AlertCircle, CheckCircle, ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

type View = 'login' | 'register' | 'forgot'

const ROLES = [
  'رئيس بلدية',
  'عضو مجلس بلدي',
  'موظف بلدي',
  'اتحاد بلديات',
  'مستشار قانوني',
  'جهة إدارية أخرى',
]

// ── Shared input / label classes ─────────────────────────────────────────────
const INP = [
  'w-full rounded-xl border border-[#E4E8EF] bg-[#F9FAFB]',
  'px-4 py-[11px] text-sm text-stone-800 text-right',
  'placeholder:text-stone-400 outline-none',
  'transition-all duration-200',
  'hover:border-[#C5CCDA]',
  'focus:bg-white focus:border-[#8A0F24] focus:ring-2 focus:ring-[#8A0F24]/10',
].join(' ')

const LBL = 'block text-[11.5px] font-semibold text-stone-500 mb-1.5 text-right tracking-wide'

const BTN = [
  'w-full flex items-center justify-center gap-2.5',
  'bg-[#8A0F24] text-white text-sm font-semibold',
  'py-3.5 rounded-xl shadow-sm',
  'transition-all duration-200',
  'hover:bg-[#9E1229]',
  'hover:shadow-[0_6px_20px_rgba(138,15,36,0.25)]',
  'active:scale-[0.985]',
  'disabled:opacity-40 disabled:cursor-not-allowed',
].join(' ')

// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()
  const [view,     setView]     = useState<View>('login')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [forgotOk, setForgotOk] = useState(false)

  // login
  const [lUser, setLUser] = useState('')
  const [lPwd,  setLPwd]  = useState('')

  // register
  const [rUser,    setRUser]    = useState('')
  const [rPwd,     setRPwd]     = useState('')
  const [rMun,     setRMun]     = useState('')
  const [rPhone,   setRPhone]   = useState('')
  const [rEmail,   setREmail]   = useState('')
  const [rRole,    setRRole]    = useState('')
  const [rMessage, setRMessage] = useState('')

  // forgot
  const [fContact, setFContact] = useState('')

  // ── handlers (auth logic untouched) ────────────────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await apiLogin({ username: lUser.trim(), password: lPwd })
      setAuth(res.token, res); router.replace('/assistant')
    } catch (err) { setError(err instanceof Error ? err.message : 'حدث خطأ') }
    finally { setLoading(false) }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const res = await apiRegister({
        username:     rUser.trim(),
        password:     rPwd,
        municipality: rMun.trim() + (rRole ? ` — ${rRole}` : ''),
        phone:        rPhone.trim(),
        email:        rEmail.trim(),
      })
      setAuth(res.token, res); router.replace('/assistant')
    } catch (err) { setError(err instanceof Error ? err.message : 'حدث خطأ') }
    finally { setLoading(false) }
  }

  function handleForgot(e: React.FormEvent) {
    e.preventDefault(); setForgotOk(true)
  }

  function go(v: View) {
    setView(v); setError(''); setShowPwd(false); setForgotOk(false)
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12"
      style={{
        backgroundImage:
          'radial-gradient(ellipse 900px 500px at 50% -20px, rgba(138,15,36,0.04) 0%, transparent 70%),' +
          'radial-gradient(ellipse 700px 400px at 50% 100%, rgba(13,36,64,0.03) 0%, transparent 65%)',
      }}
    >

      {/* ── Logo + Brand ──────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center mb-8">

        {/* Logo */}
        <div className="relative mb-5">
          <div
            className="absolute inset-[-16px] rounded-[40px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(138,15,36,0.07) 0%, transparent 68%)' }}
          />
          <div className="relative w-[92px] h-[92px] rounded-[24px] bg-white border border-[#EAECF0] shadow-[0_4px_28px_rgba(0,0,0,0.09)] p-2.5 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Baladi AI"
              fill
              className="object-contain p-1"
              priority
            />
          </div>
        </div>

        {/* Brand pill */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className="h-px w-10 bg-[#E8E8E8]" />
          <span className="text-[10.5px] font-bold tracking-[0.22em] text-[#8A0F24] uppercase">
            Baladi AI
          </span>
          <span className="h-px w-10 bg-[#E8E8E8]" />
        </div>

        <h1 className="text-[20px] font-bold text-[#0D2440] text-center leading-snug mb-1.5">
          منصة ذكية لدعم العمل البلدي
        </h1>
        <p className="text-[13px] text-stone-500 text-center max-w-[300px] leading-[1.7]">
          إجابات موثوقة مبنية على القوانين والمستندات البلدية
        </p>
      </div>

      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-[#E8ECF1] shadow-[0_2px_40px_rgba(0,0,0,0.07)] overflow-hidden">

        {/* Tabs */}
        {view !== 'forgot' && (
          <div className="flex gap-1 p-1.5 bg-[#F5F7FA] border-b border-[#EAECF0]">
            {([
              { id: 'login'    as View, label: 'تسجيل الدخول' },
              { id: 'register' as View, label: 'طلب حساب' },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={clsx(
                  'flex-1 py-2.5 text-[13px] font-semibold rounded-xl transition-all duration-200',
                  view === t.id
                    ? 'bg-white text-[#8A0F24] shadow-sm border border-[#E8ECF1]'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-white/60',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-6 sm:p-7">

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-[13px] rounded-xl px-4 py-3">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ══ LOGIN ══════════════════════════════════════════════════════ */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">

              <div>
                <label className={LBL}>البريد الإلكتروني أو رقم الهاتف</label>
                <input
                  value={lUser} onChange={e => setLUser(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني أو رقم هاتفك"
                  required className={INP} autoComplete="username"
                  dir="ltr" style={{ textAlign: 'right' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    type="button" onClick={() => go('forgot')}
                    className="text-[11px] font-semibold text-[#8A0F24]/65 hover:text-[#8A0F24] transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                  <label className={LBL.replace('mb-1.5 ', '')}>كلمة المرور</label>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={lPwd} onChange={e => setLPwd(e.target.value)}
                    placeholder="••••••••" required
                    className={clsx(INP, 'pl-10')}
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit"
                disabled={loading || !lUser.trim() || !lPwd}
                className={clsx(BTN, 'mt-1')}>
                {loading
                  ? <><Loader2 size={15} className="animate-spin" />جاري الدخول…</>
                  : <><LogIn size={15} />الدخول إلى المنصة</>}
              </button>
            </form>
          )}

          {/* ══ REGISTER ═══════════════════════════════════════════════════ */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">

              <div className="bg-[#F0F5FF] border border-[#D5E2FF] rounded-xl px-4 py-3 text-[11.5px] text-[#2A4899] leading-[1.6] text-right">
                يتم مراجعة الطلبات والتأكد من الصفة الرسمية قبل التفعيل.
              </div>

              <div>
                <label className={LBL}>الاسم الكامل</label>
                <input value={rUser} onChange={e => setRUser(e.target.value)}
                  placeholder="الاسم الكامل" required className={INP} autoComplete="name" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LBL}>البلدية / الاتحاد</label>
                  <input value={rMun} onChange={e => setRMun(e.target.value)}
                    placeholder="مثال: بلدية بشري" required className={INP} />
                </div>
                <div>
                  <label className={LBL}>الصفة</label>
                  <select value={rRole} onChange={e => setRRole(e.target.value)} className={INP}>
                    <option value="">اختر…</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LBL}>رقم الهاتف</label>
                  <input value={rPhone} onChange={e => setRPhone(e.target.value)}
                    placeholder="03 000 000" required className={INP} type="tel"
                    dir="ltr" style={{ textAlign: 'right' }} />
                </div>
                <div>
                  <label className={LBL}>البريد الإلكتروني</label>
                  <input value={rEmail} onChange={e => setREmail(e.target.value)}
                    placeholder="email@…" className={INP} type="email"
                    dir="ltr" style={{ textAlign: 'right' }} />
                </div>
              </div>

              <div>
                <label className={LBL}>سبب طلب الحساب</label>
                <textarea value={rMessage} onChange={e => setRMessage(e.target.value)}
                  placeholder="اذكر باختصار طبيعة عملك وسبب الحاجة للمنصة…"
                  rows={2} className={clsx(INP, 'resize-none leading-6')} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-stone-400">6 أحرف على الأقل</span>
                  <label className={LBL.replace('mb-1.5 ', '')}>كلمة المرور</label>
                </div>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'}
                    value={rPwd} onChange={e => setRPwd(e.target.value)}
                    placeholder="••••••••" required
                    className={clsx(INP, 'pl-10')}
                    autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit"
                disabled={loading || !rUser.trim() || !rMun.trim() || !rPhone.trim() || !rPwd}
                className={BTN}>
                {loading
                  ? <><Loader2 size={15} className="animate-spin" />جاري إرسال الطلب…</>
                  : <><Send size={14} />إرسال طلب تفعيل الحساب</>}
              </button>
            </form>
          )}

          {/* ══ FORGOT ═════════════════════════════════════════════════════ */}
          {view === 'forgot' && (
            <div>
              <button onClick={() => go('login')}
                className="flex items-center gap-1 text-[12px] text-stone-500 hover:text-[#8A0F24] mb-7 transition-colors">
                <ChevronRight size={14} />
                العودة إلى تسجيل الدخول
              </button>

              {forgotOk ? (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-5">
                    <CheckCircle size={28} className="text-emerald-500" />
                  </div>
                  <h3 className="text-base font-bold text-[#0D2440] mb-2">تم إرسال طلبك</h3>
                  <p className="text-[13px] text-stone-500 leading-[1.7] max-w-[260px] mb-6">
                    سيتواصل معك مدير المنصة قريباً لإعادة تعيين كلمة المرور
                  </p>
                  <button onClick={() => go('login')}
                    className="text-[13px] text-[#8A0F24] font-semibold hover:underline">
                    العودة إلى تسجيل الدخول
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-[#0D2440] mb-1.5">نسيت كلمة المرور؟</h2>
                  <p className="text-[13px] text-stone-500 mb-6 leading-[1.7]">
                    أدخل بريدك الإلكتروني أو رقم هاتفك وسيتواصل معك المدير
                  </p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className={LBL}>البريد الإلكتروني أو رقم الهاتف</label>
                      <input value={fContact} onChange={e => setFContact(e.target.value)}
                        placeholder="أدخل بريدك الإلكتروني أو رقم هاتفك"
                        required className={INP}
                        dir="ltr" style={{ textAlign: 'right' }} />
                    </div>
                    <button type="submit" disabled={!fContact.trim()} className={BTN}>
                      <Send size={14} />
                      إرسال طلب الاسترداد
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* Trust chips */}
          {view !== 'forgot' && (
            <div className="flex items-center justify-center gap-1.5 mt-6 pt-5 border-t border-[#F2F4F7] flex-wrap">
              {['قانون البلديات', 'إجراءات إدارية', 'مستندات وقرارات'].map(chip => (
                <span key={chip}
                  className="text-[10px] text-stone-400 border border-[#E8ECF1] rounded-full px-3 py-1 bg-[#F9FAFB]">
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="mt-6 flex flex-col items-center gap-1 text-center">
        <p className="text-[11.5px] text-stone-400">
          للدعم أو تفعيل حساب بلدية — تواصل مع مدير المنصة
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-stone-300">من تطوير</span>
          <span className="text-[12px] font-black text-[#0D2440]/40 tracking-[0.12em]">AIJUR</span>
          <span className="text-[10px] text-stone-300">·</span>
          <span className="text-[10px] text-stone-400">حلول ذكاء اصطناعي قانوني</span>
        </div>
      </div>

    </div>
  )
}

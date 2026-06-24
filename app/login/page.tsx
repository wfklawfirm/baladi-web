'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { apiLogin, apiRegister } from '@/lib/api'
import { setAuth } from '@/lib/auth'
import {
  Eye, EyeOff, Loader2, LogIn, Send,
  AlertCircle, CheckCircle, ArrowRight,
  Building2, Scale, FileCheck,
} from 'lucide-react'
import clsx from 'clsx'

// ── Types & constants ──────────────────────────────────────────────────────────
type View = 'login' | 'register' | 'forgot'

const ROLES = [
  'رئيس بلدية',
  'عضو مجلس بلدي',
  'موظف بلدي',
  'اتحاد بلديات',
  'مستشار قانوني',
  'جهة إدارية أخرى',
]

const TRUST_POINTS = [
  {
    Icon: Scale,
    title: 'مبنية على التشريعات اللبنانية',
    desc: 'القانون 118/1977، مجلس شورى الدولة، والمراسيم التنظيمية',
  },
  {
    Icon: FileCheck,
    title: 'تحليل المستندات فورياً',
    desc: 'قرارات، عقود، نماذج طلبات — فهم فوري ومقترحات واضحة',
  },
  {
    Icon: Building2,
    title: 'خاصة بالعمل البلدي',
    desc: 'إجراءات، تراخيص، موازنة، مناقصات — دقيقة وعملية',
  },
]

// ── Shared input style ─────────────────────────────────────────────────────────
const inp = [
  'w-full bg-[#F8FAFC] border border-[#DDE3EC] rounded-xl',
  'px-4 py-[11px] text-sm text-stone-800 text-right',
  'placeholder:text-stone-400 outline-none',
  'transition-all duration-200',
  'hover:border-[#B0B9C8]',
  'focus:bg-white focus:border-[#8A0F24] focus:ring-2 focus:ring-[#8A0F24]/10',
].join(' ')

const lbl = 'block text-[11px] font-semibold text-stone-500 mb-1.5 text-right tracking-wide uppercase'

// ── Component ──────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter()

  const [view, setView]       = useState<View>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [forgotOk, setForgotOk] = useState(false)

  // ── Login
  const [lUser, setLUser] = useState('')
  const [lPwd,  setLPwd]  = useState('')

  // ── Register
  const [rUser,    setRUser]    = useState('')
  const [rPwd,     setRPwd]     = useState('')
  const [rMun,     setRMun]     = useState('')
  const [rPhone,   setRPhone]   = useState('')
  const [rEmail,   setREmail]   = useState('')
  const [rRole,    setRRole]    = useState('')
  const [rMessage, setRMessage] = useState('')

  // ── Forgot
  const [fContact, setFContact] = useState('')

  // ── Handlers (auth logic untouched) ──────────────────────────────────────────
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

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          LEFT — Form panel
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white px-6 py-12 relative overflow-y-auto">

        {/* Mobile-only brand header */}
        <div className="lg:hidden flex flex-col items-center mb-8 text-center" dir="rtl">
          <div className="relative w-20 h-20 mb-4">
            <div className="absolute inset-0 rounded-2xl bg-[#8A0F24]/15 blur-2xl scale-150 pointer-events-none" />
            <div className="relative w-20 h-20 rounded-2xl border border-[#E2E8F0] shadow-lg bg-white p-1.5">
              <Image src="/logo.png" alt="Baladi AI" fill className="object-contain p-1" priority />
            </div>
          </div>
          <p className="text-[10px] tracking-[0.22em] font-bold text-[#8A0F24] uppercase mb-1.5">Baladi AI</p>
          <h1 className="text-lg font-bold text-[#0B2A4A] leading-snug max-w-[240px]">
            منصة ذكية لدعم العمل البلدي والقانوني
          </h1>
        </div>

        {/* Card */}
        <div className="w-full max-w-[400px]" dir="rtl">

          {/* ── Heading ── */}
          {view !== 'forgot' && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#0B2A4A] leading-tight">
                {view === 'login' ? 'أهلاً بك' : 'طلب الانضمام إلى المنصة'}
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                {view === 'login'
                  ? 'سجّل الدخول للوصول إلى مساعدك البلدي الذكي'
                  : 'أرسل طلبك لتفعيل حساب بلدي رسمي'}
              </p>
            </div>
          )}

          {/* ── Tab switcher ── */}
          {view !== 'forgot' && (
            <div className="flex gap-1 bg-[#F1F5F9] rounded-xl p-1 mb-7">
              {([
                { id: 'login',    label: 'تسجيل الدخول' },
                { id: 'register', label: 'طلب حساب' },
              ] as { id: View; label: string }[]).map(t => (
                <button
                  key={t.id}
                  onClick={() => go(t.id)}
                  className={clsx(
                    'flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200',
                    view === t.id
                      ? 'bg-white text-[#8A0F24] shadow-sm'
                      : 'text-stone-500 hover:text-stone-700',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200/80 text-red-700 text-sm rounded-xl px-4 py-3">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              LOGIN FORM
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className={lbl}>البريد الإلكتروني أو رقم الهاتف</label>
                <input
                  value={lUser} onChange={e => setLUser(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني أو رقم هاتفك"
                  required className={inp} autoComplete="username"
                  dir="ltr" style={{ textAlign: 'right' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    type="button" onClick={() => go('forgot')}
                    className="text-[11px] font-medium text-[#8A0F24]/70 hover:text-[#8A0F24] transition-colors"
                  >
                    نسيت كلمة المرور؟
                  </button>
                  <label className={lbl.replace('mb-1.5', '')}>كلمة المرور</label>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={lPwd} onChange={e => setLPwd(e.target.value)}
                    placeholder="••••••••" required
                    className={clsx(inp, 'pl-10')} autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !lUser.trim() || !lPwd}
                className="w-full flex items-center justify-center gap-2.5 bg-[#8A0F24] text-white font-semibold py-3.5 rounded-xl mt-1 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-[#A01229] hover:shadow-[0_6px_20px_rgba(138,15,36,0.28)] active:scale-[0.985]"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" />جاري الدخول…</>
                  : <><LogIn size={15} />الدخول إلى المنصة</>
                }
              </button>
            </form>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              REGISTER FORM
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="flex items-start gap-2.5 bg-[#0B2A4A]/[0.05] border border-[#0B2A4A]/10 rounded-xl px-4 py-3">
                <span className="text-[#0B2A4A]/40 text-base mt-0.5">🔒</span>
                <p className="text-[11.5px] text-[#0B2A4A]/65 leading-5.5">
                  يتم مراجعة طلبات الحسابات والتأكد من الصفة الرسمية قبل التفعيل.
                </p>
              </div>

              <div>
                <label className={lbl}>الاسم الكامل</label>
                <input value={rUser} onChange={e => setRUser(e.target.value)}
                  placeholder="مثال: أحمد خليل" required className={inp} autoComplete="name" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>البلدية / الاتحاد</label>
                  <input value={rMun} onChange={e => setRMun(e.target.value)}
                    placeholder="مثال: بلدية بشري" required className={inp} />
                </div>
                <div>
                  <label className={lbl}>الصفة</label>
                  <select value={rRole} onChange={e => setRRole(e.target.value)}
                    className={clsx(inp, 'cursor-pointer')}>
                    <option value="">اختر…</option>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={lbl}>رقم الهاتف</label>
                  <input value={rPhone} onChange={e => setRPhone(e.target.value)}
                    placeholder="03 000 000" required className={inp} type="tel"
                    dir="ltr" style={{ textAlign: 'right' }} />
                </div>
                <div>
                  <label className={lbl}>البريد الإلكتروني</label>
                  <input value={rEmail} onChange={e => setREmail(e.target.value)}
                    placeholder="email@…" className={inp} type="email"
                    dir="ltr" style={{ textAlign: 'right' }} />
                </div>
              </div>

              <div>
                <label className={lbl}>سبب طلب الحساب</label>
                <textarea value={rMessage} onChange={e => setRMessage(e.target.value)}
                  placeholder="اذكر باختصار طبيعة عملك وسبب الحاجة للمنصة…"
                  rows={2} className={clsx(inp, 'resize-none leading-6')} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-stone-400">6 أحرف على الأقل</span>
                  <label className={lbl.replace('mb-1.5', '')}>كلمة المرور</label>
                </div>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'}
                    value={rPwd} onChange={e => setRPwd(e.target.value)}
                    placeholder="••••••••" required
                    className={clsx(inp, 'pl-10')} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPwd(p => !p)} tabIndex={-1}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !rUser.trim() || !rMun.trim() || !rPhone.trim() || !rPwd}
                className="w-full flex items-center justify-center gap-2.5 bg-[#8A0F24] text-white font-semibold py-3.5 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-[#A01229] hover:shadow-[0_6px_20px_rgba(138,15,36,0.28)] active:scale-[0.985]"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" />جاري إرسال الطلب…</>
                  : <><Send size={14} />إرسال طلب تفعيل الحساب</>
                }
              </button>
            </form>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              FORGOT PASSWORD
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {view === 'forgot' && (
            <div>
              <button onClick={() => go('login')}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700 mb-7 transition-colors group">
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                العودة إلى تسجيل الدخول
              </button>

              {forgotOk ? (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-5 shadow-sm">
                    <CheckCircle size={28} className="text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0B2A4A] mb-2">تم إرسال طلبك</h3>
                  <p className="text-sm text-stone-500 leading-6 max-w-[280px] mb-6">
                    سيتواصل معك مدير المنصة قريباً على البريد الإلكتروني أو الهاتف الذي أدخلته
                  </p>
                  <button onClick={() => go('login')}
                    className="text-sm text-[#8A0F24] font-semibold hover:underline">
                    العودة إلى تسجيل الدخول
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-[#0B2A4A] mb-1">نسيت كلمة المرور؟</h2>
                  <p className="text-sm text-stone-500 mb-7 leading-6">
                    أدخل بريدك الإلكتروني أو رقم هاتفك وسيتواصل معك مدير المنصة لإعادة التعيين
                  </p>
                  <form onSubmit={handleForgot} className="space-y-4">
                    <div>
                      <label className={lbl}>البريد الإلكتروني أو رقم الهاتف</label>
                      <input value={fContact} onChange={e => setFContact(e.target.value)}
                        placeholder="أدخل بريدك الإلكتروني أو رقم هاتفك"
                        required className={inp}
                        dir="ltr" style={{ textAlign: 'right' }} />
                    </div>
                    <button type="submit" disabled={!fContact.trim()}
                      className="w-full flex items-center justify-center gap-2.5 bg-[#8A0F24] text-white font-semibold py-3.5 rounded-xl transition-all duration-150 disabled:opacity-50 shadow-sm hover:bg-[#A01229] hover:shadow-[0_6px_20px_rgba(138,15,36,0.28)] active:scale-[0.985]">
                      <Send size={14} />
                      إرسال طلب استرداد كلمة المرور
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* ── Trust chips ── */}
          {view !== 'forgot' && (
            <div className="flex items-center justify-center gap-2 mt-7 pt-5 border-t border-[#F0F3F8] flex-wrap">
              {['قانون البلديات', 'إجراءات إدارية', 'مستندات وقرارات'].map(chip => (
                <span key={chip}
                  className="text-[10px] text-stone-400 border border-[#E8ECF1] rounded-full px-3 py-1 bg-[#F8FAFC]">
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* Mobile footer */}
          <div className="lg:hidden mt-7 text-center" dir="rtl">
            <p className="text-[11px] text-stone-400">
              للدعم أو تفعيل حساب بلدية — تواصل مع مدير المنصة
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              من تطوير <span className="font-bold text-[#0B2A4A]/50 tracking-wider">AIJUR</span>
            </p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RIGHT — Brand panel  (hidden on mobile)
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        dir="rtl"
        className="hidden lg:flex lg:w-[52%] flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #081A2E 0%, #0F2440 45%, #0B1E38 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[-80px] right-[-60px] w-[340px] h-[340px] rounded-full opacity-[0.07]"
            style={{ background: 'radial-gradient(circle, #8A0F24 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-60px] left-[-40px] w-[280px] h-[280px] rounded-full opacity-[0.05]"
            style={{ background: 'radial-gradient(circle, #4A80B0 0%, transparent 70%)' }} />
          {/* Subtle grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* ── Top: Logo + Title ── */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="relative inline-block mb-10">
            <div className="absolute inset-0 rounded-[28px] blur-3xl scale-[1.6] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(138,15,36,0.5) 0%, transparent 65%)' }} />
            <div className="relative w-[120px] h-[120px] rounded-[28px] border border-white/10 shadow-2xl overflow-hidden bg-white/5 backdrop-blur-sm p-2.5">
              <Image src="/logo.png" alt="Baladi AI" fill className="object-contain p-1.5" priority />
            </div>
          </div>

          {/* Brand label */}
          <p className="text-[10px] font-bold tracking-[0.3em] text-[#8A0F24]/70 uppercase mb-4">
            Baladi AI
          </p>

          {/* Heading */}
          <h1 className="text-[32px] font-bold text-white leading-[1.25] mb-5">
            منصة ذكية<br />
            لدعم العمل البلدي<br />
            <span className="text-white/55 font-semibold text-[26px]">والقانوني والإداري</span>
          </h1>

          <p className="text-sm text-white/45 leading-7 max-w-[320px] mb-10">
            إجابات موثوقة مبنية على القوانين والمستندات البلدية اللبنانية المعتمدة
          </p>

          {/* Trust points */}
          <div className="space-y-5">
            {TRUST_POINTS.map(({ Icon, title, desc }, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-white/55" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80 mb-0.5">{title}</p>
                  <p className="text-xs text-white/40 leading-5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom: AIJUR section ── */}
        <div className="relative z-10 mt-10">
          <div className="h-px bg-white/10 mb-7" />

          <p className="text-[9px] font-bold tracking-[0.3em] text-white/25 uppercase mb-4">
            من تطوير
          </p>

          <div className="flex items-center gap-4 mb-4">
            <span className="text-[28px] font-black text-white/75 tracking-[0.1em]">AIJUR</span>
            <div className="flex-1 h-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-white/30">نشط</span>
            </div>
          </div>

          <p className="text-xs text-white/35 leading-6 max-w-[300px] mb-5">
            شركة لبنانية متخصصة في بناء حلول الذكاء الاصطناعي القانوني والإداري للبلديات والمؤسسات.
          </p>

          <p className="text-[11px] text-white/25">
            للدعم أو تفعيل حساب بلدية — تواصل مع مدير المنصة
          </p>
        </div>
      </div>

    </div>
  )
}

'use client'

import Image from 'next/image'

// ── Data ──────────────────────────────────────────────────────────────────────

const STATS = [
  { value: '٩٨١٨', label: 'وثيقة قانونية',   color: 'text-[#8A0F24]' },
  { value: '١١٨',  label: 'مادة مُفهرَسة',    color: 'text-[#1B2F4E]' },
  { value: '١٠+',  label: 'مراجع قانونية',   color: 'text-[#8A0F24]' },
  { value: '٩',    label: 'مجالات تخصص',     color: 'text-[#1B2F4E]' },
]

const FEATURES = [
  { icon: '⚖️',  title: 'قانون البلديات',     desc: 'مواد قانونية مُفهرَسة وسهلة البحث' },
  { icon: '📋',  title: 'الإجراءات الإدارية', desc: 'دليل عملي لكل معاملة ومهمة'        },
  { icon: '🏛️', title: 'الرقابة والحوكمة',  desc: 'صلاحيات ومسؤوليات واضحة'           },
  { icon: '📄',  title: 'نماذج رسمية',        desc: 'وثائق جاهزة للاستخدام الفوري'      },
]

const EXAMPLES = [
  { q: 'ما هي صلاحيات رئيس البلدية؟',                      cat: 'صلاحيات' },
  { q: 'كيف يتم إعداد الموازنة البلدية؟',                    cat: 'مالية'    },
  { q: 'ما هي شروط منح ترخيص بناء؟',                       cat: 'تراخيص'  },
  { q: 'ما مدة ولاية المجلس البلدي؟',                        cat: 'انتخابات' },
  { q: 'كيف تُنظَّم مناقصة عامة في البلدية؟',                cat: 'تلزيم'   },
  { q: 'ما هي إجراءات نزع ملكية عقار للمنفعة العامة؟',       cat: 'أملاك'   },
]

interface Props { onAsk: (q: string) => void }

// ─────────────────────────────────────────────────────────────────────────────
export default function LandingView({ onAsk }: Props) {
  return (
    <div
      dir="rtl"
      className="flex flex-col items-center w-full min-h-full px-4 py-6 sm:py-10 animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-xl flex flex-col items-center">

        {/* ── Logo + Brand ──────────────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">

          {/* Logo card */}
          <div className="relative mb-6">
            {/* Outer glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: '-40px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(138,15,36,0.13) 0%, transparent 62%)',
                filter: 'blur(24px)',
              }}
            />
            {/* Logo — large, clean, minimal padding */}
            <div
              className="relative w-48 h-48 sm:w-[196px] sm:h-[196px] rounded-[36px] bg-white overflow-hidden"
              style={{
                boxShadow:
                  '0 0 0 1px rgba(0,0,0,0.05), 0 8px 48px rgba(138,15,36,0.14), 0 3px 14px rgba(0,0,0,0.07)',
              }}
            >
              <Image
                src="/logo.png"
                alt="Baladi AI"
                fill
                className="object-contain p-4"
                priority
              />
            </div>
          </div>

          {/* Brand label */}
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-10 bg-[#E2E8F0]" />
            <span className="text-[10.5px] font-bold tracking-[0.24em] text-[#8A0F24] uppercase">
              Baladi AI
            </span>
            <span className="h-px w-10 bg-[#E2E8F0]" />
          </div>

          {/* Title */}
          <h1 className="text-[22px] sm:text-[28px] font-bold text-[#0D2440] text-center leading-[1.3] mb-2.5">
            منصة ذكية للعمل البلدي والقانوني
          </h1>

          {/* Subtitle */}
          <p className="text-[13.5px] sm:text-sm text-[#6B7280] text-center leading-[1.8] max-w-[320px]">
            إجابات موثوقة مبنية على القوانين والمستندات البلدية اللبنانية
          </p>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────── */}
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
          {STATS.map(s => (
            <div
              key={s.label}
              className="flex flex-col items-center bg-white border border-[#E8ECF1] rounded-2xl py-4 px-3"
              style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}
            >
              <span className={`text-2xl sm:text-3xl font-bold leading-none mb-1.5 ${s.color}`}>
                {s.value}
              </span>
              <span className="text-[10.5px] text-[#9CA3AF] text-center leading-4">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ── Feature cards ─────────────────────────────────────────────── */}
        <div className="w-full grid grid-cols-2 gap-3 mb-7">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="flex flex-col gap-3 rounded-2xl border border-[#E6EBF2] bg-[#F8FAFC] p-4 transition-all duration-200 hover:shadow-sm hover:border-[#D0DAE8] hover:bg-white"
            >
              <span className="text-[26px] leading-none">{f.icon}</span>
              <div>
                <p className="text-[13.5px] font-bold mb-1 leading-snug text-[#1B2F4E]">
                  {f.title}
                </p>
                <p className="text-[11px] sm:text-[11.5px] text-[#8896A8] leading-[1.55]">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 w-full mb-4">
          <div className="flex-1 h-px bg-[#E8ECF1]" />
          <span className="text-[11px] font-semibold text-[#9CA3AF] whitespace-nowrap tracking-wide">
            أسئلة مقترحة
          </span>
          <div className="flex-1 h-px bg-[#E8ECF1]" />
        </div>

        {/* ── Example prompts ───────────────────────────────────────────── */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {EXAMPLES.map(({ q, cat }) => (
            <button
              key={q}
              onClick={() => onAsk(q)}
              className="flex items-start gap-2.5 bg-white border border-[#E8ECF1] rounded-xl px-4 py-3.5 text-right transition-all duration-200 hover:border-[#8A0F24]/35 hover:bg-[#FDF4F5] hover:shadow-sm group"
            >
              <span className="inline-block shrink-0 mt-0.5 text-[9.5px] font-bold text-[#8A0F24] bg-[#8A0F24]/8 rounded-lg px-2 py-[3px] whitespace-nowrap">
                {cat}
              </span>
              <span className="text-[13px] sm:text-[13.5px] text-[#374151] group-hover:text-[#0D2440] leading-[1.55] transition-colors">
                {q}
              </span>
            </button>
          ))}
        </div>

        {/* ── Footer badges ─────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
          {['قانون 118/1977', 'مجلس شورى الدولة', 'منشورات وزارة الداخلية', 'المرسوم 9396'].map(b => (
            <span
              key={b}
              className="text-[10px] text-[#9CA3AF] border border-[#E8ECF1] rounded-full px-3 py-1"
            >
              {b}
            </span>
          ))}
        </div>

      </div>
    </div>
  )
}

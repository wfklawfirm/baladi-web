'use client'

import Image from 'next/image'

const FEATURES = [
  {
    icon: '⚖️',
    title: 'إجابات قانونية مستندة',
    desc: 'مستندة إلى قانون البلديات 118/1977 واجتهادات مجلس شورى الدولة',
  },
  {
    icon: '📋',
    title: 'إجراءات إدارية',
    desc: 'دليل خطوة بخطوة: تراخيص، مناقصات، موازنة، تعيينات',
  },
  {
    icon: '🏛️',
    title: 'رقابة وحوكمة',
    desc: 'صلاحيات القائمقام والمحافظ والوصاية الإدارية على البلديات',
  },
  {
    icon: '📄',
    title: 'مكتبة الوثائق',
    desc: '110+ نموذج بلدي رسمي جاهز، مراسيم ومنشورات وزارية',
  },
]

const EXAMPLES = [
  'ما مدة ولاية المجلس البلدي؟',
  'ما هي صلاحيات رئيس البلدية؟',
  'كيف يتم إعداد الموازنة البلدية؟',
  'ما هي شروط الترشح للانتخابات البلدية؟',
  'كيف تُفتح نقابة عمال في البلدية؟',
]

interface Props {
  onAsk: (q: string) => void
}

export default function LandingView({ onAsk }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 pb-6 animate-fade-in transition-all duration-300">
      {/* Logo */}
      <div className="mb-6">
        <Image
          src="/logo.png"
          alt="Baladi AI"
          width={160}
          height={160}
          className="object-contain drop-shadow-sm"
          priority
        />
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-navy text-center mb-1">
        كيف يمكنني مساعدتك اليوم؟
      </h1>
      <div className="flex items-center gap-3 mb-2">
        <div className="h-px w-16 bg-burgundy/30" />
        <div className="w-1.5 h-1.5 bg-burgundy rounded-full" />
        <div className="h-px w-16 bg-burgundy/30" />
      </div>
      <p className="text-sm text-warm-muted text-center mb-8 max-w-sm">
        اطرح سؤالك القانوني أو الإداري البلدي واحصل على إجابة مستندة إلى المصادر
      </p>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xl mb-8">
        {FEATURES.map(f => (
          <div
            key={f.title}
            className="bg-white border border-warm-border rounded-xl p-4 flex gap-3 items-start hover:border-burgundy/30 hover:shadow-sm transition-all cursor-default"
          >
            <span className="text-xl shrink-0">{f.icon}</span>
            <div>
              <p className="text-sm font-semibold text-navy mb-0.5">{f.title}</p>
              <p className="text-xs text-warm-muted leading-5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Example pills */}
      <div className="flex flex-wrap gap-2 justify-center max-w-xl">
        {EXAMPLES.map(q => (
          <button
            key={q}
            onClick={() => onAsk(q)}
            className="text-xs bg-white border border-warm-border text-stone-600 px-3 py-1.5 rounded-full hover:border-burgundy hover:text-burgundy transition-all"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, FileSearch, FileText, Gavel, Landmark, ListChecks, MessageSquare } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getUser } from '@/lib/auth'

interface Task {
  href: string
  title: string
  desc: string
  detail: string
  icon: LucideIcon
}

// The four things a municipal employee comes here to do.
const TASKS: Task[] = [
  {
    href: '/assistant',
    title: 'استشارة قانونية',
    desc: 'اسأل عن أي مسألة بلدية أو إدارية واحصل على جواب مسنَد إلى النص القانوني.',
    detail: 'قانون البلديات، الصلاحيات، الاجتهادات',
    icon: MessageSquare,
  },
  {
    href: '/workspace/procedures',
    title: 'إنجاز معاملة',
    desc: 'اختر المعاملة وسنرشدك خطوة بخطوة مع المستندات المطلوبة والجهة المختصة.',
    detail: 'إشغال أملاك، قرارات، جلسات، شكاوى',
    icon: ListChecks,
  },
  {
    href: '/workspace/documents',
    title: 'إعداد مستند',
    desc: 'صف الحالة بكلماتك وسنملأ القالب الرسمي لتراجعه وتطبعه.',
    detail: 'قرارات، كتب رسمية، إنذارات، إعلانات',
    icon: FileText,
  },
  {
    href: '/assistant',
    title: 'مراجعة ملف',
    desc: 'ارفع كتاباً أو معاملة أو صورة وسنحلّلها ونقترح الإجراء المناسب.',
    detail: 'PDF، Word، صور، تسجيل صوتي',
    icon: FileSearch,
  },
]

const TOOLS = [
  { href: '/workspace/meetings', title: 'جلسات المجلس', desc: 'جدول الأعمال، التصويت، والمحضر الرسمي', icon: Landmark },
  { href: '/workspace/procurement', title: 'المشتريات العامة', desc: 'تحديد إجراء الشراء وفق قانون 244/2021', icon: Gavel },
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'صباح الخير'
  if (h < 18) return 'مساء الخير'
  return 'مساء النور'
}

function recentChats(): { id: string; title: string }[] {
  try {
    const raw = localStorage.getItem('baladi_conversations')
    if (!raw) return []
    const list = JSON.parse(raw) as { id: string; title: string }[]
    return list.slice(0, 3).map(c => ({ id: c.id, title: c.title }))
  } catch {
    return []
  }
}

export default function WorkspaceHome() {
  const [name, setName] = useState('')
  const [municipality, setMunicipality] = useState('')
  const [recent, setRecent] = useState<{ id: string; title: string }[]>([])

  useEffect(() => {
    const u = getUser()
    setName(u?.username ?? '')
    setMunicipality(u?.municipality ?? '')
    setRecent(recentChats())
  }, [])

  return (
    <div>
      <header className="mb-8 sm:mb-10">
        <p className="text-sm text-warm-muted">
          {greeting()}{name ? `، ${name}` : ''}
          {municipality ? ` — بلدية ${municipality}` : ''}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold leading-snug text-navy sm:text-[32px]">ماذا تريد أن تنجز اليوم؟</h1>
      </header>

      <section aria-label="المهام الرئيسية" className="grid gap-4 sm:grid-cols-2">
        {TASKS.map(({ href, title, desc, detail, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group relative flex min-h-[176px] flex-col overflow-hidden rounded-2xl border border-warm-border bg-white p-5 pr-6
                       transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"
          >
            {/* file-tab edge on the reading-start side */}
            <span className="absolute inset-y-0 right-0 w-1.5 bg-burgundy" aria-hidden />
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-burgundy/[0.07] text-burgundy">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <h2 className="text-lg font-bold text-navy">{title}</h2>
            </div>
            <p className="text-sm leading-7 text-stone-600">{desc}</p>
            <div className="mt-auto flex items-center justify-between pt-4">
              <span className="text-xs text-warm-muted">{detail}</span>
              <ChevronLeft size={18} className="text-burgundy transition-transform group-hover:-translate-x-1" aria-hidden />
            </div>
          </Link>
        ))}
      </section>

      <section aria-label="أدوات المجلس" className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-stone-500">أدوات المجلس والمشتريات</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOOLS.map(({ href, title, desc, icon: Icon }) => (
            <Link
              key={title}
              href={href}
              className="flex items-center gap-4 rounded-xl border border-warm-border bg-warm-bg px-4 py-3.5 transition-colors hover:bg-white
                         focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"
            >
              <Icon size={20} className="shrink-0 text-navy" strokeWidth={1.75} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">{title}</p>
                <p className="truncate text-xs text-warm-muted">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section aria-label="آخر الاستشارات" className="mt-10">
          <h2 className="mb-3 text-sm font-semibold text-stone-500">آخر استشاراتك</h2>
          <ul className="divide-y divide-warm-border rounded-xl border border-warm-border bg-white">
            {recent.map(c => (
              <li key={c.id}>
                <Link href="/assistant" className="flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-warm-bg">
                  <MessageSquare size={14} className="shrink-0 text-warm-muted" />
                  <span className="truncate">{c.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

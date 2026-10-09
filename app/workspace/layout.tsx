'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Clock, FileText, Gavel, Landmark, LayoutGrid, ListChecks, LogOut, Menu, MessageSquare, X,
} from 'lucide-react'
import clsx from 'clsx'
import { clearAuth, getDaysRemaining, getUser, isLoggedIn } from '@/lib/auth'

const NAV = [
  { href: '/workspace',             label: 'الرئيسية',         icon: LayoutGrid },
  { href: '/assistant',             label: 'استشارة قانونية',  icon: MessageSquare },
  { href: '/workspace/procedures',  label: 'إنجاز معاملة',     icon: ListChecks },
  { href: '/workspace/documents',   label: 'إعداد مستند',      icon: FileText },
  { href: '/workspace/meetings',    label: 'جلسات المجلس',     icon: Landmark },
  { href: '/workspace/procurement', label: 'المشتريات العامة', icon: Gavel },
]

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<ReturnType<typeof getUser>>(null)
  const [days, setDays] = useState(0)

  useEffect(() => {
    if (!isLoggedIn()) { router.replace('/login'); return }
    setUser(getUser())
    setDays(getDaysRemaining())
    setReady(true)
  }, [router])

  useEffect(() => { setOpen(false) }, [pathname])

  if (!ready) return <div className="h-screen bg-white" />

  const isActive = (href: string) => (href === '/workspace' ? pathname === href : pathname.startsWith(href))

  const sidebar = (
    <nav className="flex h-full flex-col" aria-label="التنقل الرئيسي">
      <div className="flex items-center gap-2.5 border-b border-warm-border px-4 py-4">
        <Image src="/logo.png" alt="Baladi AI" width={32} height={32} className="rounded-md object-contain" />
        <div className="leading-tight">
          <p className="text-sm font-semibold text-navy">Baladi AI</p>
          {user?.municipality && <p className="text-[11px] text-warm-muted">بلدية {user.municipality}</p>}
        </div>
      </div>

      <ul className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {NAV.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                isActive(href)
                  ? 'bg-white font-semibold text-burgundy shadow-sm ring-1 ring-warm-border'
                  : 'text-stone-600 hover:bg-white/70 hover:text-navy',
              )}
            >
              <Icon size={17} className="shrink-0" />
              {label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="space-y-2 border-t border-warm-border p-3">
        {days > 0 && (
          <p className="flex items-center gap-1.5 px-2 text-xs text-warm-muted">
            <Clock size={12} />
            {days} {days === 1 ? 'يوم' : 'أيام'} متبقية في الاشتراك
          </p>
        )}
        <button
          onClick={() => { clearAuth(); router.replace('/login') }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-stone-500 transition-colors hover:bg-white/70 hover:text-red-600"
        >
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </nav>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Desktop sidebar (right side in RTL) */}
      <aside className="hidden w-64 shrink-0 border-l border-warm-border bg-warm-bg md:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-[82vw] max-w-xs bg-warm-bg shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-warm-border px-4 py-3 md:hidden">
          <button
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'إغلاق القائمة' : 'فتح القائمة'}
            className="rounded-lg p-1.5 text-warm-muted hover:bg-warm-bg"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span className="text-sm font-semibold text-navy">Baladi AI</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-10">{children}</div>
        </main>
      </div>
    </div>
  )
}

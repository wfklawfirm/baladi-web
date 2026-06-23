'use client'

import { Plus, Search, MessageSquare, ChevronLeft, Trash2 } from 'lucide-react'
import Image from 'next/image'
import type { Conversation } from '@/lib/types'
import clsx from 'clsx'

interface Props {
  open: boolean
  conversations: Conversation[]
  activeId: string | null
  onNewChat: () => void
  onSelectChat: (id: string) => void
  onDeleteChat: (id: string) => void
  onToggle: () => void
}

function timeLabel(date: Date): string {
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 1000
  if (diff < 60)        return 'الآن'
  if (diff < 3600)      return `${Math.floor(diff / 60)} دقيقة`
  if (diff < 86400)     return 'اليوم'
  if (diff < 172800)    return 'أمس'
  return date.toLocaleDateString('ar-LB', { month: 'short', day: 'numeric' })
}

export default function Sidebar({
  open, conversations, activeId, onNewChat, onSelectChat, onDeleteChat, onToggle
}: Props) {
  return (
    <>
      {/* Mobile backdrop — closes sidebar on tap outside */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={clsx(
          'flex flex-col bg-white transition-all duration-300',
          // Mobile: fixed overlay drawer from the right
          'fixed inset-y-0 right-0 z-50',
          // Desktop: back to normal flex-item in the row
          'md:static md:h-full md:shrink-0 md:z-auto',
          open ? [
            // Open widths
            'w-[85vw] md:w-64',
            // Borders
            'border-l border-warm-border md:border-l-0 md:border-r md:border-warm-border',
            // Shadow on mobile only
            'shadow-2xl md:shadow-none',
          ] : [
            'w-0 overflow-hidden border-0',
          ],
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-warm-border">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Baladi AI"
              width={32}
              height={32}
              className="object-contain rounded-md"
            />
            <span className="font-semibold text-navy text-sm">Baladi AI</span>
          </div>
          <button
            onClick={onToggle}
            className="p-1 rounded hover:bg-warm-bg text-warm-muted transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        </div>

        {/* New chat */}
        <div className="p-3">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy-dark text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            <Plus size={15} />
            محادثة جديدة
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 bg-warm-bg border border-warm-border rounded-lg px-3 py-2">
            <Search size={13} className="text-warm-muted shrink-0" />
            <input
              type="text"
              placeholder="بحث…"
              className="bg-transparent text-xs text-stone-700 placeholder-warm-muted outline-none w-full text-right"
            />
          </div>
        </div>

        {/* History */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {conversations.length === 0 ? (
            <p className="text-xs text-warm-muted text-center py-8">لا توجد محادثات سابقة</p>
          ) : (
            <>
              <p className="text-[10px] font-semibold text-warm-muted uppercase tracking-wider px-2 mb-2">
                السابقة
              </p>
              <ul className="space-y-0.5">
                {conversations.map(c => (
                  <li key={c.id} className="group relative">
                    <button
                      onClick={() => onSelectChat(c.id)}
                      className={clsx(
                        'w-full text-right flex items-start gap-2 px-2 py-2 rounded-lg text-xs transition-colors',
                        c.id === activeId
                          ? 'bg-burgundy/8 text-navy font-medium'
                          : 'text-stone-600 hover:bg-warm-bg'
                      )}
                    >
                      <MessageSquare size={13} className="mt-0.5 shrink-0 text-warm-muted" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate leading-5">{c.title}</p>
                        <p className="text-warm-muted text-[10px]">{timeLabel(c.createdAt)}</p>
                      </div>
                    </button>
                    {/* Delete on hover */}
                    <button
                      onClick={e => { e.stopPropagation(); onDeleteChat(c.id) }}
                      className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 p-0.5 rounded text-warm-muted hover:text-red-500 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-warm-border p-3">
          <p className="text-[10px] text-warm-muted text-center leading-4">
            مساعد بلدي متخصص بالقانون اللبناني
          </p>
        </div>
      </aside>
    </>
  )
}

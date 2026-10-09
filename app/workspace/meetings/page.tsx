'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, Copy, Plus, Printer } from 'lucide-react'
import clsx from 'clsx'
import {
  ApiError, createMeeting, generateMinutes, getMeeting, updateAgendaItem,
  type AgendaItem, type Meeting,
} from '@/lib/modules-api'
import { getUser } from '@/lib/auth'
import {
  btnGhost, btnPrimary, Card, copyText, ErrorBanner, inputCls, Label, Notice, PageHeader, printDocument,
} from '@/components/workspace/ui'

// Meetings live on this device first. The server keeps them in memory only, so a server
// restart can drop them; we therefore re-create a meeting on the server from the local
// copy whenever we need it (e.g. to generate the minutes).
const STORE = 'baladi_meetings'
const loadAll = (): Meeting[] => {
  try { return JSON.parse(localStorage.getItem(STORE) || '[]') as Meeting[] } catch { return [] }
}
const saveAll = (list: Meeting[]) => {
  try { localStorage.setItem(STORE, JSON.stringify(list)) } catch { /* storage full or blocked */ }
}

const STATUS_LABEL: Record<AgendaItem['status'], string> = {
  pending: 'لم يُناقش', discussed: 'نوقش', decided: 'قُرِّر', deferred: 'مؤجَّل',
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => { setMeetings(loadAll()) }, [])

  function upsert(m: Meeting) {
    setMeetings(prev => {
      const next = prev.some(x => x.meeting_id === m.meeting_id)
        ? prev.map(x => (x.meeting_id === m.meeting_id ? m : x))
        : [m, ...prev]
      saveAll(next)
      return next
    })
  }

  // The server may hand back a new id if it had to re-create the meeting.
  function replaceId(oldId: string, m: Meeting) {
    setMeetings(prev => {
      const next = prev.map(x => (x.meeting_id === oldId ? m : x))
      saveAll(next)
      return next
    })
    setOpenId(m.meeting_id)
  }

  const open = meetings.find(m => m.meeting_id === openId)

  if (creating) {
    return <NewMeeting onCancel={() => setCreating(false)} onCreated={m => { upsert(m); setCreating(false); setOpenId(m.meeting_id) }} />
  }
  if (open) {
    return <MeetingDetail meeting={open} onBack={() => setOpenId(null)} onChange={upsert} onReplaceId={replaceId} />
  }

  return (
    <div>
      <PageHeader
        title="جلسات المجلس"
        subtitle="حضّر جدول الأعمال، سجّل القرارات ونتائج التصويت، ثم أنشئ المحضر الرسمي."
        action={<button onClick={() => setCreating(true)} className={btnPrimary}><Plus size={16} /> جلسة جديدة</button>}
      />
      {meetings.length === 0 ? (
        <Card className="py-14 text-center">
          <p className="text-sm text-stone-600">لا توجد جلسات بعد.</p>
          <button onClick={() => setCreating(true)} className={clsx(btnPrimary, 'mt-4')}>أنشئ أول جلسة</button>
        </Card>
      ) : (
        <ul className="space-y-3">
          {meetings.map(m => (
            <li key={m.meeting_id}>
              <button
                onClick={() => setOpenId(m.meeting_id)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl border border-warm-border bg-white p-5 text-right transition-shadow hover:shadow-md
                           focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"
              >
                <div>
                  <h2 className="text-base font-bold text-navy">جلسة {m.meeting_type} — {m.meeting_date}</h2>
                  <p className="mt-1 text-xs text-warm-muted">
                    {m.agenda_items.length} بنود · {m.agenda_items.filter(i => i.status === 'decided').length} مقرَّرة
                  </p>
                </div>
                <span className={clsx(
                  'shrink-0 rounded-full px-3 py-1 text-xs font-medium',
                  m.status === 'closed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800',
                )}>
                  {m.status === 'closed' ? 'المحضر جاهز' : 'قيد التحضير'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NewMeeting({ onCancel, onCreated }: { onCancel: () => void; onCreated: (m: Meeting) => void }) {
  const user = getUser()
  const [f, setF] = useState({
    meeting_type: 'عادية', meeting_date: '', meeting_time: '', president_name: '', members: '', agenda: '',
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const lines = (s: string) => s.split('\n').map(x => x.trim()).filter(Boolean)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!f.meeting_date) { setError('حدّد تاريخ الجلسة.'); return }
    if (lines(f.agenda).length === 0) { setError('أضف بنداً واحداً على الأقل إلى جدول الأعمال.'); return }
    setBusy(true); setError('')
    try {
      onCreated(await createMeeting({
        municipality_name: user?.municipality ?? '',
        meeting_date: f.meeting_date,
        meeting_time: f.meeting_time,
        meeting_type: f.meeting_type,
        president_name: f.president_name.trim(),
        members: lines(f.members),
        agenda_items: lines(f.agenda),
      }))
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div>
      <button onClick={onCancel} className="mb-4 inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-navy">
        <ArrowRight size={15} /> الجلسات
      </button>
      <PageHeader title="جلسة جديدة" />
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
      <form onSubmit={submit}>
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <Label>نوع الجلسة</Label>
              <select className={inputCls} value={f.meeting_type} onChange={e => setF({ ...f, meeting_type: e.target.value })}>
                <option>عادية</option><option>طارئة</option>
              </select>
            </label>
            <label className="block">
              <Label required>التاريخ</Label>
              <input type="date" className={inputCls} value={f.meeting_date} onChange={e => setF({ ...f, meeting_date: e.target.value })} />
            </label>
            <label className="block">
              <Label>الساعة</Label>
              <input type="time" className={inputCls} value={f.meeting_time} onChange={e => setF({ ...f, meeting_time: e.target.value })} />
            </label>
          </div>
          <label className="block">
            <Label>رئيس البلدية</Label>
            <input className={inputCls} value={f.president_name} onChange={e => setF({ ...f, president_name: e.target.value })} />
          </label>
          <label className="block">
            <Label>الأعضاء الحاضرون (اسم في كل سطر)</Label>
            <textarea className={clsx(inputCls, 'min-h-[100px] leading-7')} value={f.members} onChange={e => setF({ ...f, members: e.target.value })} />
          </label>
          <label className="block">
            <Label required>بنود جدول الأعمال (بند في كل سطر)</Label>
            <textarea className={clsx(inputCls, 'min-h-[130px] leading-7')} value={f.agenda} onChange={e => setF({ ...f, agenda: e.target.value })} />
          </label>
          <button disabled={busy} className={btnPrimary}>{busy ? 'جارٍ الإنشاء…' : 'إنشاء الجلسة'}</button>
        </Card>
      </form>
    </div>
  )
}

function MeetingDetail({
  meeting, onBack, onChange, onReplaceId,
}: {
  meeting: Meeting
  onBack: () => void
  onChange: (m: Meeting) => void
  onReplaceId: (oldId: string, m: Meeting) => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  function editItem(order: number, patch: Partial<AgendaItem>) {
    onChange({
      ...meeting,
      status: meeting.status === 'draft' ? 'in_progress' : meeting.status,
      agenda_items: meeting.agenda_items.map(i => (i.order === order ? { ...i, ...patch } : i)),
    })
  }

  // Make sure the server has this meeting (re-create from the local copy if it was lost),
  // then push every agenda item so the minutes reflect exactly what is on screen.
  async function syncToServer(): Promise<string> {
    let id = meeting.meeting_id
    try {
      await getMeeting(id)
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 404) throw e
      const fresh = await createMeeting({
        municipality_name: meeting.municipality_name,
        meeting_date: meeting.meeting_date,
        meeting_time: meeting.meeting_time,
        meeting_type: meeting.meeting_type,
        president_name: meeting.president_name,
        members: meeting.members,
        agenda_items: meeting.agenda_items.map(i => i.title),
      })
      id = fresh.meeting_id
      onReplaceId(meeting.meeting_id, { ...meeting, meeting_id: id })
    }
    for (const i of meeting.agenda_items) {
      await updateAgendaItem(id, i.order, {
        decision: i.decision, votes_for: i.votes_for, votes_against: i.votes_against,
        votes_abstain: i.votes_abstain, status: i.status,
      })
    }
    return id
  }

  async function makeMinutes() {
    setBusy(true); setError('')
    try {
      const id = await syncToServer()
      const r = await generateMinutes(id)
      onChange({ ...meeting, meeting_id: id, minutes: r.minutes, status: 'closed' })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function copyMinutes() {
    try { await copyText(meeting.minutes); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setError('تعذّر النسخ.') }
  }

  const undecided = meeting.agenda_items.filter(i => i.status === 'pending').length

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-navy">
        <ArrowRight size={15} /> الجلسات
      </button>
      <PageHeader
        title={`جلسة ${meeting.meeting_type} — ${meeting.meeting_date}`}
        subtitle={[meeting.meeting_time && `الساعة ${meeting.meeting_time}`, meeting.president_name && `برئاسة ${meeting.president_name}`].filter(Boolean).join(' · ')}
      />
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      <div className="space-y-3">
        {meeting.agenda_items.map(item => (
          <Card key={item.order}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-bold text-navy"><span className="ml-2 text-burgundy">{item.order}.</span>{item.title}</h2>
              <select
                aria-label={`حالة البند ${item.order}`}
                className="rounded-lg border border-warm-border bg-white px-2.5 py-1.5 text-[13px]"
                value={item.status}
                onChange={e => editItem(item.order, { status: e.target.value as AgendaItem['status'] })}
              >
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <label className="block">
              <Label>القرار</Label>
              <textarea className={clsx(inputCls, 'min-h-[72px] leading-7')} value={item.decision} onChange={e => editItem(item.order, { decision: e.target.value })} />
            </label>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {([['votes_for', 'مع'], ['votes_against', 'ضد'], ['votes_abstain', 'امتناع']] as const).map(([k, l]) => (
                <label key={k} className="block">
                  <Label>{l}</Label>
                  <input
                    type="number" min={0} inputMode="numeric" className={inputCls}
                    value={item[k]}
                    onChange={e => editItem(item.order, { [k]: Math.max(0, parseInt(e.target.value || '0', 10) || 0) })}
                  />
                </label>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {undecided > 0 && meeting.status !== 'closed' && (
          <Notice>{undecided} {undecided === 1 ? 'بند لم يُناقش' : 'بنود لم تُناقش'} بعد. سيُذكر ذلك في المحضر كما هو.</Notice>
        )}
        <button onClick={makeMinutes} disabled={busy} className={btnPrimary}>
          {busy ? 'جارٍ إعداد المحضر…' : meeting.minutes ? 'إعادة إنشاء المحضر' : 'إنشاء المحضر الرسمي'}
        </button>
        <p className="text-xs text-warm-muted">تُحفظ تعديلاتك على هذا الجهاز تلقائياً.</p>
      </div>

      {meeting.minutes && (
        <section className="mt-8" aria-label="المحضر">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-navy">المحضر</h2>
            <div className="flex gap-2">
              <button onClick={copyMinutes} className={btnGhost}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'تم النسخ' : 'نسخ'}</button>
              <button
                onClick={() => printDocument(`محضر جلسة ${meeting.meeting_type} — ${meeting.meeting_date}`, meeting.minutes, meeting.municipality_name) || setError('اسمح بالنوافذ المنبثقة للطباعة.')}
                className={btnPrimary}
              ><Printer size={15} /> طباعة</button>
            </div>
          </div>
          <article className="mx-auto max-w-3xl rounded-sm border border-warm-border bg-white px-6 py-8 shadow-sm sm:px-12 sm:py-12">
            <pre className="whitespace-pre-wrap font-[inherit] text-[15px] leading-[2.1] text-stone-800">{meeting.minutes}</pre>
          </article>
          <p className="mx-auto mt-3 max-w-3xl text-xs text-warm-muted">مسودة مولَّدة آلياً من بيانات الجلسة. راجعها قبل الاعتماد.</p>
        </section>
      )}
    </div>
  )
}

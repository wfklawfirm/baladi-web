'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Check, ChevronLeft, FileText, Scale } from 'lucide-react'
import clsx from 'clsx'
import {
  getProcedure, listProcedures, startWorkflow, updateWorkflow,
  type ProcedureDetail, type ProcedureSummary,
} from '@/lib/modules-api'
import { btnGhost, btnPrimary, Card, ErrorBanner, inputCls, Label, Notice, PageHeader, Spinner } from '@/components/workspace/ui'

// Progress is kept on this device so a refresh (or a server restart) never loses the user's place.
interface Saved { workflow_id: string | null; step: number; answers: Record<string, string>; docs: string[]; done: boolean }
const key = (id: string) => `baladi_wf_${id}`
function load(id: string): Saved | null {
  try { const r = localStorage.getItem(key(id)); return r ? (JSON.parse(r) as Saved) : null } catch { return null }
}
function save(id: string, s: Saved) {
  try { localStorage.setItem(key(id), JSON.stringify(s)) } catch { /* storage full or blocked */ }
}

export default function ProceduresPage() {
  const [list, setList] = useState<ProcedureSummary[] | null>(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('الكل')
  const [detail, setDetail] = useState<ProcedureDetail | null>(null)
  const [opening, setOpening] = useState<string | null>(null)

  const loadList = useCallback(() => {
    setError('')
    listProcedures().then(r => setList(r.procedures)).catch(e => setError(e.message))
  }, [])
  useEffect(loadList, [loadList])

  const categories = useMemo(() => ['الكل', ...Array.from(new Set((list ?? []).map(p => p.category)))], [list])
  const visible = (list ?? []).filter(p => category === 'الكل' || p.category === category)

  async function open(id: string) {
    setOpening(id)
    setError('')
    try { setDetail(await getProcedure(id)) } catch (e) { setError((e as Error).message) } finally { setOpening(null) }
  }

  if (detail) return <ProcedureRunner proc={detail} onBack={() => setDetail(null)} />

  return (
    <div>
      <PageHeader
        title="إنجاز معاملة"
        subtitle="اختر المعاملة لتعرف الجهة المختصة والمستندات المطلوبة وخطوات الإنجاز بالترتيب."
      />

      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={list ? undefined : loadList} /></div>}
      {!list && !error && <Spinner />}

      {list && (
        <>
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="تصفية حسب الفئة">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={clsx(
                  'rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                  category === c
                    ? 'border-burgundy bg-burgundy text-white'
                    : 'border-warm-border bg-white text-stone-600 hover:bg-warm-bg',
                )}
              >
                {c}
              </button>
            ))}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {visible.map(p => {
              const s = typeof window !== 'undefined' ? load(p.id) : null
              return (
                <li key={p.id}>
                  <button
                    onClick={() => open(p.id)}
                    disabled={opening === p.id}
                    className="flex h-full w-full flex-col rounded-2xl border border-warm-border bg-white p-5 text-right transition-shadow
                               hover:shadow-md disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded-md bg-burgundy/[0.07] px-2 py-0.5 text-[11px] font-medium text-burgundy">{p.category}</span>
                      {s && !s.done && <span className="text-[11px] font-medium text-amber-700">قيد التنفيذ</span>}
                      {s?.done && <span className="text-[11px] font-medium text-emerald-700">منجزة</span>}
                    </div>
                    <h2 className="text-base font-bold text-navy">{p.name}</h2>
                    <p className="mt-1.5 flex-1 text-sm leading-7 text-stone-600">{p.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-warm-muted">
                      <span>{p.steps_count} خطوات · {p.competent_authority}</span>
                      <ChevronLeft size={16} className="text-burgundy" aria-hidden />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}

function ProcedureRunner({ proc, onBack }: { proc: ProcedureDetail; onBack: () => void }) {
  const initial = useMemo(() => load(proc.id), [proc.id])
  const [started, setStarted] = useState(!!initial && initial.workflow_id !== undefined)
  const [workflowId, setWorkflowId] = useState<string | null>(initial?.workflow_id ?? null)
  const [step, setStep] = useState(initial?.step ?? 1)
  const [answers, setAnswers] = useState<Record<string, string>>(initial?.answers ?? {})
  const [docs, setDocs] = useState<string[]>(initial?.docs ?? [])
  const [done, setDone] = useState(initial?.done ?? false)
  const [busy, setBusy] = useState(false)
  const [syncWarn, setSyncWarn] = useState(false)
  const [formError, setFormError] = useState('')

  const total = proc.steps.length

  useEffect(() => {
    if (started) save(proc.id, { workflow_id: workflowId, step, answers, docs, done })
  }, [started, proc.id, workflowId, step, answers, docs, done])

  async function begin() {
    const missing = proc.questions.filter(q => q.required && !answers[q.id]?.trim())
    if (missing.length) { setFormError(`أكمل الحقول المطلوبة: ${missing.map(m => m.text).join('، ')}`); return }
    setFormError('')
    setBusy(true)
    try {
      const r = await startWorkflow(proc.id, answers)
      setWorkflowId(r.workflow_id)
    } catch {
      setWorkflowId(null)
      setSyncWarn(true)
    }
    setStarted(true)
    setStep(1)
    setBusy(false)
  }

  // Best-effort sync: the user's progress is already safe on this device.
  async function sync(patch: { status?: string; current_step?: number }) {
    if (!workflowId) return
    try { await updateWorkflow(workflowId, patch) } catch { setSyncWarn(true) }
  }

  function go(next: number) {
    setStep(next)
    sync({ current_step: next, status: 'in_progress' })
  }

  function finish() {
    setDone(true)
    sync({ status: 'complete' })
  }

  function reset() {
    try { localStorage.removeItem(key(proc.id)) } catch { /* ignore */ }
    setStarted(false); setWorkflowId(null); setStep(1); setAnswers({}); setDocs([]); setDone(false); setSyncWarn(false)
  }

  const toggleDoc = (d: string) => setDocs(prev => (prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]))
  const current = proc.steps[step - 1]

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-navy">
        <ArrowRight size={15} /> كل المعاملات
      </button>

      <PageHeader title={proc.name} subtitle={proc.description} />

      <div className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-stone-600">
        <span><b className="font-semibold text-navy">الجهة المختصة:</b> {proc.competent_authority}</span>
        {proc.legal_basis.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <Scale size={13} className="text-burgundy" />
            {proc.legal_basis.join(' · ')}
          </span>
        )}
      </div>

      {syncWarn && (
        <div className="mb-5">
          <Notice>تعذّرت مزامنة التقدّم مع الخادم، لكن تقدّمك محفوظ على هذا الجهاز وتستطيع المتابعة.</Notice>
        </div>
      )}

      {!started ? (
        <div className="grid gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <h2 className="mb-4 text-base font-bold text-navy">بيانات المعاملة</h2>
            <div className="space-y-4">
              {proc.questions.map(q => (
                <label key={q.id} className="block">
                  <Label required={q.required}>{q.text}</Label>
                  <input
                    className={inputCls}
                    value={answers[q.id] ?? ''}
                    onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            {formError && <p className="mt-4 text-sm text-red-700" role="alert">{formError}</p>}
            <button onClick={begin} disabled={busy} className={clsx(btnPrimary, 'mt-5')}>
              {busy ? 'جارٍ البدء…' : 'ابدأ المعاملة'}
            </button>
          </Card>

          <Card className="lg:col-span-2">
            <h2 className="mb-3 text-base font-bold text-navy">المستندات المطلوبة</h2>
            <ul className="space-y-2 text-sm leading-7 text-stone-700">
              {proc.required_docs.map(d => (
                <li key={d} className="flex gap-2"><FileText size={14} className="mt-2 shrink-0 text-warm-muted" />{d}</li>
              ))}
            </ul>
          </Card>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          <ol className="space-y-1 lg:col-span-2" aria-label="خطوات المعاملة">
            {proc.steps.map(s => {
              const state = done || s.order < step ? 'done' : s.order === step ? 'current' : 'todo'
              return (
                <li key={s.order}>
                  <button
                    onClick={() => go(s.order)}
                    aria-current={state === 'current' ? 'step' : undefined}
                    className={clsx(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm transition-colors',
                      state === 'current' ? 'bg-burgundy/[0.07] font-semibold text-navy' : 'text-stone-600 hover:bg-warm-bg',
                    )}
                  >
                    <span
                      className={clsx(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        state === 'done' && 'bg-emerald-600 text-white',
                        state === 'current' && 'bg-burgundy text-white',
                        state === 'todo' && 'border border-warm-border bg-white text-warm-muted',
                      )}
                    >
                      {state === 'done' ? <Check size={13} /> : s.order}
                    </span>
                    {s.title}
                  </button>
                </li>
              )
            })}
          </ol>

          <div className="space-y-4 lg:col-span-3">
            {done ? (
              <Card className="border-emerald-200 bg-emerald-50/60">
                <h2 className="mb-2 text-base font-bold text-emerald-900">اكتملت المعاملة</h2>
                {proc.generated_outputs.length > 0 && (
                  <>
                    <p className="mb-2 text-sm text-emerald-900">المستندات التي تُصدر عن هذه المعاملة:</p>
                    <ul className="mb-4 list-inside list-disc text-sm leading-7 text-emerald-900">
                      {proc.generated_outputs.map(o => <li key={o}>{o}</li>)}
                    </ul>
                    <Link href="/workspace/documents" className={btnPrimary}>إعداد المستندات</Link>
                  </>
                )}
                <button onClick={reset} className={clsx(btnGhost, 'mr-2')}>بدء معاملة جديدة</button>
              </Card>
            ) : (
              <Card>
                <p className="text-xs font-medium text-burgundy">الخطوة {step} من {total}</p>
                <h2 className="mt-1 text-lg font-bold text-navy">{current.title}</h2>
                <p className="mt-2 text-sm leading-7 text-stone-700">{current.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button disabled={step === 1} onClick={() => go(step - 1)} className={btnGhost}>السابق</button>
                  {step < total
                    ? <button onClick={() => go(step + 1)} className={btnPrimary}>أنجزت هذه الخطوة</button>
                    : <button onClick={finish} className={btnPrimary}>إنهاء المعاملة</button>}
                </div>
              </Card>
            )}

            <Card>
              <h2 className="mb-3 text-base font-bold text-navy">قائمة المستندات</h2>
              <ul className="space-y-1.5">
                {proc.required_docs.map(d => (
                  <li key={d}>
                    <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1 text-sm leading-7 text-stone-700 hover:bg-warm-bg">
                      <input
                        type="checkbox"
                        checked={docs.includes(d)}
                        onChange={() => toggleDoc(d)}
                        className="mt-2 h-4 w-4 accent-[#8A0F24]"
                      />
                      <span className={clsx(docs.includes(d) && 'text-stone-400 line-through')}>{d}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-warm-muted">{docs.length} من {proc.required_docs.length} جاهزة</p>
            </Card>

            <button onClick={reset} className="text-xs text-warm-muted underline underline-offset-2 hover:text-red-700">
              إلغاء هذه المعاملة والبدء من جديد
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

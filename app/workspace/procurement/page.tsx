'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, ListChecks } from 'lucide-react'
import clsx from 'clsx'
import {
  classifyProcurement, generateChecklist, getThresholds,
  type ProcurementChecklist, type ProcurementResult, type ProcurementType, type ThresholdTier,
} from '@/lib/modules-api'
import { btnGhost, btnPrimary, Card, ErrorBanner, inputCls, Label, Notice, PageHeader } from '@/components/workspace/ui'

const TYPES: ProcurementType[] = ['توريد', 'خدمات', 'أعمال']
const fmt = (n: number) => new Intl.NumberFormat('ar-LB').format(n)

export default function ProcurementPage() {
  const [subject, setSubject] = useState('')
  const [type, setType] = useState<ProcurementType>('توريد')
  const [value, setValue] = useState('')
  const [result, setResult] = useState<ProcurementResult | null>(null)
  const [checklist, setChecklist] = useState<ProcurementChecklist | null>(null)
  const [busy, setBusy] = useState<'classify' | 'checklist' | null>(null)
  const [error, setError] = useState('')

  const amount = Number(value.replace(/[,\s]/g, ''))
  const valid = subject.trim().length > 2 && Number.isFinite(amount) && amount > 0

  async function classify(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) { setError('أدخل موضوع الشراء وقيمة تقديرية أكبر من صفر.'); return }
    setBusy('classify'); setError(''); setChecklist(null)
    try { setResult(await classifyProcurement(subject.trim(), amount, type)) }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(null) }
  }

  async function makeChecklist() {
    setBusy('checklist'); setError('')
    try { setChecklist(await generateChecklist(subject.trim(), amount, type)) }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(null) }
  }

  return (
    <div>
      <PageHeader
        title="المشتريات العامة"
        subtitle="أدخل موضوع الشراء وقيمته التقديرية لتعرف الإجراء المطلوب وفق قانون الشراء العام 244/2021 والجهة التي تُقرّه."
      />
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      <div className="grid gap-5 lg:grid-cols-5">
        <form onSubmit={classify} className="lg:col-span-2 lg:self-start">
          <Card className="space-y-4">
            <label className="block">
              <Label required>موضوع الشراء</Label>
              <input className={inputCls} value={subject} onChange={e => setSubject(e.target.value)} placeholder="مثال: شراء آلية لجمع النفايات" />
            </label>
            <fieldset>
              <legend className="mb-1.5 text-[13px] font-medium text-stone-700">نوع العقد</legend>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map(t => (
                  <button
                    type="button" key={t} onClick={() => setType(t)} aria-pressed={type === t}
                    className={clsx(
                      'rounded-lg border py-2 text-sm transition-colors',
                      type === t ? 'border-burgundy bg-burgundy text-white' : 'border-warm-border bg-white text-stone-600 hover:bg-warm-bg',
                    )}
                  >{t}</button>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <Label required>القيمة التقديرية (ل.ل.)</Label>
              <input className={inputCls} inputMode="numeric" value={value} onChange={e => setValue(e.target.value.replace(/[^\d,\s]/g, ''))} placeholder="75,000,000" />
              {valid && <span className="mt-1 block text-xs text-warm-muted">{fmt(amount)} ليرة لبنانية</span>}
            </label>
            <button disabled={busy !== null} className={clsx(btnPrimary, 'w-full')}>
              {busy === 'classify' ? 'جارٍ التحديد…' : 'حدّد الإجراء'}
            </button>
          </Card>
        </form>

        <div className="space-y-4 lg:col-span-3">
          {!result && (
            <Card className="py-12 text-center text-sm leading-7 text-warm-muted">
              ستظهر هنا نتيجة التصنيف: نوع الإجراء، الجهة المخوّلة، الخطوات، والتنبيهات.
            </Card>
          )}

          {result && (
            <>
              <Card>
                <p className="text-xs text-warm-muted">الإجراء المطلوب</p>
                <h2 className="mt-1 text-xl font-bold text-navy">{result.procedure_type}</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-xs text-warm-muted">الجهة المخوّلة بالإقرار</dt><dd className="mt-0.5 font-medium text-stone-800">{result.authority_required}</dd></div>
                  <div><dt className="text-xs text-warm-muted">السند القانوني</dt><dd className="mt-0.5 font-medium text-stone-800">{result.legal_basis}</dd></div>
                </dl>
                <p className="mt-4 rounded-lg bg-burgundy/[0.06] px-3 py-2.5 text-sm text-navy">{result.next_action}</p>
              </Card>

              <Card>
                <h2 className="mb-3 text-base font-bold text-navy">الخطوات بالترتيب</h2>
                <ol className="space-y-2.5">
                  {result.required_steps.map((s, i) => (
                    <li key={s} className="flex gap-3 text-sm leading-7 text-stone-700">
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-burgundy text-[11px] font-bold text-white">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </Card>

              {result.key_warnings.length > 0 && (
                <Notice>
                  <p className="mb-1.5 flex items-center gap-1.5 font-semibold"><AlertTriangle size={14} /> تنبيهات</p>
                  <ul className="list-inside list-disc space-y-0.5">{result.key_warnings.map(w => <li key={w}>{w}</li>)}</ul>
                </Notice>
              )}

              {!checklist && (
                <button onClick={makeChecklist} disabled={busy !== null} className={btnGhost}>
                  <ListChecks size={16} /> {busy === 'checklist' ? 'جارٍ إعداد القائمة…' : 'أنشئ قائمة تدقيق تفصيلية'}
                </button>
              )}
            </>
          )}

          {checklist && (
            <Card>
              <h2 className="mb-4 text-base font-bold text-navy">{checklist.checklist_title}</h2>
              <div className="space-y-5">
                {checklist.phases.map(p => (
                  <section key={p.phase}>
                    <h3 className="mb-2 text-sm font-semibold text-burgundy">{p.phase}</h3>
                    <ul className="space-y-1.5">
                      {p.items.map(it => (
                        <li key={it.task}>
                          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-0.5 text-sm leading-7 text-stone-700 hover:bg-warm-bg">
                            <input type="checkbox" className="mt-2 h-4 w-4 accent-[#8A0F24]" />
                            <span>
                              {it.task}{!it.required && <span className="mr-1.5 text-xs text-warm-muted">(اختياري)</span>}
                              {it.notes && <span className="block text-xs text-warm-muted">{it.notes}</span>}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              {checklist.key_risks.length > 0 && (
                <div className="mt-5 border-t border-warm-border pt-4">
                  <h3 className="mb-2 text-sm font-semibold text-navy">مخاطر يجب الانتباه لها</h3>
                  <ul className="list-inside list-disc space-y-0.5 text-sm leading-7 text-stone-700">{checklist.key_risks.map(r => <li key={r}>{r}</li>)}</ul>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>

      <Thresholds />
    </div>
  )
}

function Thresholds() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Record<string, ThresholdTier[]> | null>(null)
  const [note, setNote] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!open || data) return
    getThresholds().then(r => { setData(r.thresholds); setNote(r.note) }).catch(e => setErr(e.message))
  }, [open, data])

  return (
    <section className="mt-10">
      <button
        onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-warm-border bg-warm-bg px-4 py-3 text-sm font-semibold text-navy"
      >
        جدول العتبات المرجعية
        <ChevronDown size={16} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="mt-3 space-y-4">
          {err && <ErrorBanner message={err} />}
          {note && <Notice>{note}</Notice>}
          {data && Object.entries(data).map(([ptype, tiers]) => (
            <Card key={ptype} className="overflow-x-auto p-0">
              <table className="w-full min-w-[520px] text-sm">
                <caption className="border-b border-warm-border px-4 py-2.5 text-right font-semibold text-navy">{ptype}</caption>
                <thead className="text-xs text-warm-muted">
                  <tr><th className="px-4 py-2 text-right font-medium">من (ل.ل.)</th><th className="px-4 py-2 text-right font-medium">إلى</th><th className="px-4 py-2 text-right font-medium">الإجراء</th><th className="px-4 py-2 text-right font-medium">الجهة</th></tr>
                </thead>
                <tbody>
                  {tiers.map(t => (
                    <tr key={t.procedure + t.min} className="border-t border-warm-border">
                      <td className="px-4 py-2">{fmt(t.min)}</td>
                      <td className="px-4 py-2">{t.max === null ? 'بلا حد أعلى' : fmt(t.max)}</td>
                      <td className="px-4 py-2 font-medium">{t.procedure}</td>
                      <td className="px-4 py-2 text-stone-600">{t.authority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

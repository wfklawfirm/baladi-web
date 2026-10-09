'use client'

import { useCallback, useEffect, useState } from 'react'
import { ArrowRight, Check, Copy, Printer, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import {
  generateDocument, getTemplate, listTemplates, suggestDocumentFields,
  type GeneratedDocument, type TemplateDetail, type TemplateSummary,
} from '@/lib/modules-api'
import { getUser } from '@/lib/auth'
import {
  btnGhost, btnPrimary, Card, copyText, ErrorBanner, inputCls, Label, Notice, PageHeader, printDocument, Spinner,
} from '@/components/workspace/ui'

const LONG_FIELD = /(نص|أسباب|الأسباب|موضوع|الموضوع|محتوى|ملاحظ|تفاصيل|بنود|وقائع|مخالفة|الحيثيات)/

export default function DocumentsPage() {
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('الكل')
  const [tmpl, setTmpl] = useState<TemplateDetail | null>(null)
  const [opening, setOpening] = useState<string | null>(null)

  const load = useCallback(() => {
    setError('')
    listTemplates().then(r => setTemplates(r.templates)).catch(e => setError(e.message))
  }, [])
  useEffect(load, [load])

  async function open(id: string) {
    setOpening(id)
    setError('')
    try { setTmpl(await getTemplate(id)) } catch (e) { setError((e as Error).message) } finally { setOpening(null) }
  }

  if (tmpl) return <DocumentForm tmpl={tmpl} onBack={() => setTmpl(null)} />

  const categories = ['الكل', ...Array.from(new Set((templates ?? []).map(t => t.category)))]
  const visible = (templates ?? []).filter(t => category === 'الكل' || t.category === category)

  return (
    <div>
      <PageHeader
        title="إعداد مستند"
        subtitle="اختر نوع المستند، وصف الحالة بكلماتك ليقترح النظام تعبئة الحقول، ثم راجع النص وانسخه أو اطبعه."
      />
      {error && <div className="mb-4"><ErrorBanner message={error} onRetry={templates ? undefined : load} /></div>}
      {!templates && !error && <Spinner />}
      {templates && (
        <>
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="تصفية حسب الفئة">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={clsx(
                  'rounded-full border px-3.5 py-1.5 text-[13px] transition-colors',
                  category === c ? 'border-burgundy bg-burgundy text-white' : 'border-warm-border bg-white text-stone-600 hover:bg-warm-bg',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => open(t.id)}
                  disabled={opening === t.id}
                  className="flex h-full w-full flex-col rounded-2xl border border-warm-border bg-white p-5 text-right transition-shadow hover:shadow-md
                             disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy"
                >
                  <span className="mb-2 w-fit rounded-md bg-burgundy/[0.07] px-2 py-0.5 text-[11px] font-medium text-burgundy">{t.category}</span>
                  <h2 className="text-base font-bold text-navy">{t.name}</h2>
                  <p className="mt-1.5 flex-1 text-sm leading-7 text-stone-600">{t.description}</p>
                  <p className="mt-3 text-xs text-warm-muted">{t.required_fields_count} حقول مطلوبة</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function DocumentForm({ tmpl, onBack }: { tmpl: TemplateDetail; onBack: () => void }) {
  const municipality = getUser()?.municipality ?? ''
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    if (tmpl.required_fields.some(f => f.id === 'municipality_name')) initial.municipality_name = municipality
    return initial
  })
  const [context, setContext] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [aiNote, setAiNote] = useState('')
  const [doc, setDoc] = useState<GeneratedDocument | null>(null)
  const [copied, setCopied] = useState(false)

  async function suggest() {
    if (!context.trim()) return
    setSuggesting(true)
    setError('')
    try {
      const r = await suggestDocumentFields(tmpl.id, context.trim(), municipality)
      // Only fill what the AI actually found; never overwrite what the user already typed.
      setFields(prev => {
        const next = { ...prev }
        for (const [k, v] of Object.entries(r.fields_used)) if (v && !next[k]?.trim()) next[k] = v
        return next
      })
      setAiNote(r.missing_required.length
        ? `لم يجد النظام في وصفك: ${r.missing_required.join('، ')}. أكملها يدوياً.`
        : 'عُبِّئت الحقول من وصفك. راجعها قبل إنشاء المستند.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSuggesting(false)
    }
  }

  async function generate() {
    setGenerating(true)
    setError('')
    try {
      setDoc(await generateDocument(tmpl.id, fields, municipality))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  async function copy() {
    if (!doc) return
    try { await copyText(doc.content); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setError('تعذّر النسخ. حدّد النص وانسخه يدوياً.') }
  }

  if (doc) {
    return (
      <div>
        <button onClick={() => setDoc(null)} className="mb-4 inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-navy">
          <ArrowRight size={15} /> العودة لتعديل الحقول
        </button>
        <PageHeader
          title={doc.template_name}
          action={
            <div className="flex gap-2">
              <button onClick={copy} className={btnGhost}>
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'تم النسخ' : 'نسخ'}
              </button>
              <button onClick={() => printDocument(doc.template_name, doc.content, municipality) || setError('اسمح بالنوافذ المنبثقة للطباعة.')} className={btnPrimary}>
                <Printer size={15} /> طباعة
              </button>
            </div>
          }
        />
        {error && <div className="mb-4"><ErrorBanner message={error} /></div>}
        {doc.warnings.length > 0 && (
          <div className="mb-4"><Notice>{doc.warnings.join(' — ')}</Notice></div>
        )}
        <article className="mx-auto max-w-3xl rounded-sm border border-warm-border bg-white px-6 py-8 shadow-sm sm:px-12 sm:py-12">
          <pre className="whitespace-pre-wrap font-[inherit] text-[15px] leading-[2.1] text-stone-800">{doc.content}</pre>
        </article>
        <p className="mx-auto mt-4 max-w-3xl text-xs leading-6 text-warm-muted">
          هذا النص مسودة. راجعه قانونياً قبل التوقيع والاعتماد الرسمي.
        </p>
      </div>
    )
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-warm-muted hover:text-navy">
        <ArrowRight size={15} /> كل المستندات
      </button>
      <PageHeader title={tmpl.name} subtitle={tmpl.description} />
      {tmpl.legal_basis && <p className="-mt-3 mb-6 text-[13px] text-stone-600"><b className="font-semibold text-navy">السند القانوني:</b> {tmpl.legal_basis}</p>}
      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-2 lg:order-2 self-start">
          <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-navy"><Sparkles size={16} className="text-burgundy" /> املأ من وصف الحالة</h2>
          <p className="mb-3 text-[13px] leading-6 text-warm-muted">اكتب ما حدث أو ما تريد إصداره، وسيقترح النظام قيم الحقول. لا يخترع معلومات غير مذكورة.</p>
          <textarea
            className={clsx(inputCls, 'min-h-[140px] leading-7')}
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="مثال: قرر المجلس في جلسته بتاريخ 3 أيلول الموافقة على إشغال الرصيف أمام مقهى السلام لمدة سنة…"
          />
          <button onClick={suggest} disabled={suggesting || !context.trim()} className={clsx(btnGhost, 'mt-3 w-full')}>
            {suggesting ? 'جارٍ التحليل…' : 'اقترح تعبئة الحقول'}
          </button>
          {aiNote && <p className="mt-3 text-[13px] leading-6 text-stone-700">{aiNote}</p>}
        </Card>

        <Card className="lg:col-span-3 lg:order-1">
          <h2 className="mb-4 text-base font-bold text-navy">حقول المستند</h2>
          <div className="space-y-4">
            {tmpl.required_fields.map(f => (
              <label key={f.id} className="block">
                <Label required={f.required}>{f.label}</Label>
                {LONG_FIELD.test(f.label) ? (
                  <textarea className={clsx(inputCls, 'min-h-[96px] leading-7')} value={fields[f.id] ?? ''} onChange={e => setFields(p => ({ ...p, [f.id]: e.target.value }))} />
                ) : (
                  <input className={inputCls} value={fields[f.id] ?? ''} onChange={e => setFields(p => ({ ...p, [f.id]: e.target.value }))} />
                )}
              </label>
            ))}
          </div>
          <button onClick={generate} disabled={generating} className={clsx(btnPrimary, 'mt-6')}>
            {generating ? 'جارٍ الإنشاء…' : 'إنشاء المستند'}
          </button>
        </Card>
      </div>
    </div>
  )
}

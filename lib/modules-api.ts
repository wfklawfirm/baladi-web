// Client for backend modules B–E (procedures, documents, meetings, procurement).
// Paths and field names mirror baladi-api/modules.py exactly. This file is additive:
// it does not touch lib/api.ts, which the assistant and admin pages depend on.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function authHeader(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('baladi_token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}, query?: Record<string, string | number | undefined>): Promise<T> {
  const qs = query
    ? '?' + Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}${qs}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...authHeader(), ...(init.headers ?? {}) },
    })
  } catch {
    throw new ApiError('تعذّر الاتصال بالخادم. تحقق من الإنترنت ثم حاول مجدداً.', 0)
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const detail = typeof body.detail === 'string' ? body.detail : res.statusText
    throw new ApiError(detail || 'حدث خطأ غير متوقع', res.status)
  }
  return res.json() as Promise<T>
}

// ── Module B — Procedures ────────────────────────────────────────────────────

export interface ProcedureSummary {
  id: string
  name: string
  category: string
  description: string
  legal_basis: string[]
  steps_count: number
  competent_authority: string
}

export interface ProcedureStep { order: number; title: string; description: string }
export interface ProcedureQuestion { id: string; text: string; required: boolean }

export interface ProcedureDetail {
  id: string
  name: string
  name_en: string
  category: string
  description: string
  legal_basis: string[]
  competent_authority: string
  steps: ProcedureStep[]
  required_docs: string[]
  generated_outputs: string[]
  questions: ProcedureQuestion[]
}

export interface WorkflowState {
  workflow_id: string
  procedure_id: string
  procedure_name: string
  status: 'draft' | 'in_progress' | 'waiting_docs' | 'ready_review' | 'complete' | 'archived'
  answers: Record<string, string>
  current_step: number
  total_steps: number
  created_at: string
  updated_at: string
  notes: string
}

export const listProcedures = () =>
  request<{ procedures: ProcedureSummary[]; total: number }>('/api/procedures')

export const getProcedure = (id: string) =>
  request<ProcedureDetail>(`/api/procedures/${encodeURIComponent(id)}`)

export const startWorkflow = (procedure_id: string, answers: Record<string, string>) =>
  request<{ workflow_id: string; procedure: ProcedureDetail; workflow: WorkflowState }>(
    '/api/procedures/workflow/start',
    { method: 'POST', body: JSON.stringify({ procedure_id, answers }) },
  )

export const updateWorkflow = (
  workflow_id: string,
  patch: { answers?: Record<string, string>; status?: string; current_step?: number; notes?: string },
) =>
  request<WorkflowState>(
    `/api/procedures/workflow/${encodeURIComponent(workflow_id)}`,
    { method: 'PATCH', body: patch.answers ? JSON.stringify(patch.answers) : undefined },
    { status: patch.status, current_step: patch.current_step, notes: patch.notes },
  )

// ── Module C — Documents ─────────────────────────────────────────────────────

export interface TemplateSummary {
  id: string
  name: string
  category: string
  description: string
  required_fields_count: number
}

export interface TemplateField { id: string; label: string; required: boolean }

export interface TemplateDetail {
  id: string
  name: string
  category: string
  description: string
  legal_basis: string
  required_fields: TemplateField[]
  template: string
}

export interface GeneratedDocument {
  document_id: string
  template_id: string
  template_name: string
  content: string
  fields_used: Record<string, string>
  missing_required: string[]
  warnings: string[]
  created_at: string
  note?: string
}

export const listTemplates = () =>
  request<{ templates: TemplateSummary[]; total: number }>('/api/documents/templates')

export const getTemplate = (id: string) =>
  request<TemplateDetail>(`/api/documents/templates/${encodeURIComponent(id)}`)

export const generateDocument = (template_id: string, fields: Record<string, string>, municipality_name: string) =>
  request<GeneratedDocument>('/api/documents/generate', {
    method: 'POST',
    body: JSON.stringify({ template_id, fields, municipality_name }),
  })

// The backend reads these three as query parameters (not a JSON body).
export const suggestDocumentFields = (template_id: string, context: string, municipality_name: string) =>
  request<GeneratedDocument>(
    '/api/documents/generate/ai',
    { method: 'POST' },
    { template_id, context, municipality_name },
  )

// ── Module D — Meetings ──────────────────────────────────────────────────────

export interface AgendaItem {
  order: number
  title: string
  description: string
  decision: string
  votes_for: number
  votes_against: number
  votes_abstain: number
  status: 'pending' | 'discussed' | 'decided' | 'deferred'
}

export interface Meeting {
  meeting_id: string
  municipality_name: string
  meeting_date: string
  meeting_time: string
  meeting_type: string
  president_name: string
  members: string[]
  agenda_items: AgendaItem[]
  status: 'draft' | 'in_progress' | 'closed'
  minutes: string
  created_at: string
  updated_at: string
}

export interface MeetingInput {
  municipality_name: string
  meeting_date: string
  meeting_time: string
  meeting_type: string
  president_name: string
  members: string[]
  agenda_items: string[]
}

export const createMeeting = (input: MeetingInput) =>
  request<Meeting>('/api/meetings', { method: 'POST', body: JSON.stringify(input) })

export const getMeeting = (id: string) =>
  request<Meeting>(`/api/meetings/${encodeURIComponent(id)}`)

export const updateAgendaItem = (
  meeting_id: string,
  order: number,
  patch: { decision?: string; votes_for?: number; votes_against?: number; votes_abstain?: number; status?: string },
) =>
  request<Meeting>(
    `/api/meetings/${encodeURIComponent(meeting_id)}/agenda/${order}`,
    { method: 'PATCH' },
    patch,
  )

export const generateMinutes = (meeting_id: string) =>
  request<{ meeting_id: string; minutes: string; status: string }>(
    `/api/meetings/${encodeURIComponent(meeting_id)}/generate-minutes`,
    { method: 'POST' },
  )

// ── Module E — Procurement ───────────────────────────────────────────────────

export type ProcurementType = 'توريد' | 'خدمات' | 'أعمال'

export interface ProcurementResult {
  procedure_type: string
  legal_basis: string
  threshold_applied: number
  required_steps: string[]
  authority_required: string
  key_warnings: string[]
  next_action: string
}

export interface ProcurementChecklist {
  checklist_title: string
  phases: { phase: string; items: { task: string; required: boolean; notes: string }[] }[]
  key_risks: string[]
  classification: ProcurementResult
}

export interface ThresholdTier {
  min: number
  max: number | null
  procedure: string
  authority: string
}

export const classifyProcurement = (subject: string, estimated_value: number, procurement_type: ProcurementType) =>
  request<ProcurementResult>('/api/procurement/classify', {
    method: 'POST',
    body: JSON.stringify({ subject, estimated_value, procurement_type }),
  })

export const getThresholds = () =>
  request<{ legal_basis: string; note: string; thresholds: Record<string, ThresholdTier[]>; currency: string }>(
    '/api/procurement/thresholds',
  )

export const generateChecklist = (subject: string, estimated_value: number, procurement_type: ProcurementType) =>
  request<ProcurementChecklist>(
    '/api/procurement/checklist',
    { method: 'POST' },
    { subject, estimated_value, procurement_type },
  )

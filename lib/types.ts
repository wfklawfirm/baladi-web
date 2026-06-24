export interface Source {
  chunk_id: string
  title: string
  text_preview: string
  domain: string
  domain_name: string
  score: number
}

export type OptionType = 'approve' | 'reject' | 'conditional' | 'refer' | 'defer' | 'request_info' | 'council_vote'

export interface AnalysisOption {
  id: string
  type: OptionType
  title: string
  description: string
  pros: string
  cons: string
  template: string
}

export interface DocumentAnalysis {
  doc_type: string
  request_category: string
  summary: string
  validity: 'valid' | 'invalid' | 'needs_info'
  validity_reason: string
  legal_basis: string
  authority: string
  decision_maker: string
  urgency: string
  required_signatures: string[]
  required_docs: string[]
  risks: string
  options: AnalysisOption[]
  recommended_option: string
  next_steps: string[]
  time_limits: string
  recommendations: string
  sources: Source[]
  confidence: 'high' | 'medium' | 'low'
  duration_ms: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  confidence?: 'high' | 'medium' | 'low'
  duration_ms?: number
  chunks_used?: number
  timestamp: Date
  error?: boolean
  // Document analysis
  analysis?: DocumentAnalysis
  attachedFile?: string   // filename
  // Voice
  isVoice?: boolean
  // Streaming in-progress flag
  streaming?: boolean
  // Streaming phase indicator
  streamPhase?: 'searching' | 'generating'
  // Follow-up question suggestions
  follow_up?: string[]
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
}

export type Domain =
  | 'auto'
  | 'D01' | 'D02' | 'D03' | 'D05'
  | 'D07' | 'D09' | 'D10' | 'D12' | 'D13'

export const DOMAIN_OPTIONS: { value: Domain; label: string }[] = [
  { value: 'auto',  label: 'كل المجالات' },
  { value: 'D01',   label: 'القوانين' },
  { value: 'D07',   label: 'الحوكمة' },
  { value: 'D02',   label: 'المالية' },
  { value: 'D03',   label: 'الإجراءات' },
  { value: 'D05',   label: 'خدمات المواطن' },
  { value: 'D09',   label: 'التلزيم' },
  { value: 'D10',   label: 'الأملاك' },
  { value: 'D12',   label: 'التراخيص' },
  { value: 'D13',   label: 'الرقابة' },
]

export const CONFIDENCE_CONFIG = {
  high:   { label: 'ثقة عالية',   color: 'text-emerald-600', dot: 'bg-emerald-500' },
  medium: { label: 'ثقة متوسطة', color: 'text-amber-600',   dot: 'bg-amber-500'   },
  low:    { label: 'ثقة منخفضة', color: 'text-red-500',     dot: 'bg-red-400'     },
}

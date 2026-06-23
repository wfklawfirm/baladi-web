'use client'

import { useState, useEffect } from 'react'
import { X, Building2, User, MapPin, Phone, MapPinned, Save, CheckCircle } from 'lucide-react'
import { loadSettings, saveSettings, type MunicipalitySettings } from '@/lib/settings'

interface Props {
  open: boolean
  onClose: () => void
}

export default function SettingsModal({ open, onClose }: Props) {
  const [form, setForm]   = useState<MunicipalitySettings>(loadSettings())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (open) setForm(loadSettings())
  }, [open])

  function handleSave() {
    saveSettings(form)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 1200)
  }

  function field(key: keyof MunicipalitySettings, label: string, placeholder: string, Icon: React.ElementType) {
    return (
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-warm-muted mb-1.5">
          <Icon size={13} />
          {label}
        </label>
        <input
          type="text"
          value={form[key]}
          onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          className="w-full bg-warm-bg border border-warm-border rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder-warm-muted outline-none focus:border-burgundy/50 transition-colors text-right"
        />
      </div>
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-warm-border bg-warm-bg/60">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-burgundy" />
            <h2 className="text-base font-bold text-stone-800">إعدادات البلدية</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-warm-border transition-colors text-warm-muted">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-warm-muted leading-5">
            أدخل معلومات بلديتك — ستُستخدم تلقائياً في جميع نماذج القرارات الرسمية.
          </p>

          {field('municipality', 'اسم البلدية', 'مثال: طرابلس / جبيل / صيدا', Building2)}
          {field('mayor', 'اسم رئيس البلدية', 'مثال: المحامي جورج خليل', User)}
          {field('region', 'القضاء / المحافظة', 'مثال: قضاء جبيل / محافظة لبنان الشمالي', MapPin)}
          {field('phone', 'هاتف البلدية', 'مثال: 00961-1-123456', Phone)}
          {field('address', 'عنوان البلدية', 'مثال: شارع الرئيس الحريري، المبنى البلدي', MapPinned)}
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={handleSave}
            className="w-full flex items-center justify-center gap-2 bg-burgundy text-white rounded-xl py-3 text-sm font-semibold hover:bg-burgundy/90 transition-all"
          >
            {saved ? (
              <>
                <CheckCircle size={16} />
                تم الحفظ!
              </>
            ) : (
              <>
                <Save size={16} />
                حفظ الإعدادات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

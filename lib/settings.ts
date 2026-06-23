const SETTINGS_KEY = 'baladi_municipality_settings'

export interface MunicipalitySettings {
  municipality: string   // اسم البلدية
  mayor: string          // اسم رئيس البلدية
  region: string         // القضاء / المحافظة
  phone: string          // رقم الهاتف
  address: string        // العنوان
}

export const DEFAULT_SETTINGS: MunicipalitySettings = {
  municipality: '',
  mayor: '',
  region: '',
  phone: '',
  address: '',
}

export function loadSettings(): MunicipalitySettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(s: MunicipalitySettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

/** Replace [___] placeholders with actual municipality data */
export function applySettings(
  template: string,
  settings: MunicipalitySettings,
): string {
  let t = template
  if (settings.municipality) {
    t = t.replace(/بلدية \[_______________\]/g, `بلدية ${settings.municipality}`)
    t = t.replace(/\[اسم البلدية\]/g, settings.municipality)
  }
  if (settings.mayor) {
    t = t.replace(/\[اسم الرئيس\]/g, settings.mayor)
    t = t.replace(/\[رئيس البلدية\]/g, settings.mayor)
  }
  if (settings.region) {
    t = t.replace(/\[القضاء\]/g, settings.region)
    t = t.replace(/\[المحافظة\]/g, settings.region)
  }
  if (settings.phone) {
    t = t.replace(/\[رقم الهاتف\]/g, settings.phone)
  }
  if (settings.address) {
    t = t.replace(/\[العنوان\]/g, settings.address)
  }
  return t
}

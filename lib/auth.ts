const TOKEN_KEY = 'baladi_token'
const USER_KEY  = 'baladi_user'

export interface AuthUser {
  username: string
  municipality: string
  expires_at: string
  days_remaining: number
}

function decodeJwt(token: string): any {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return null }
}

export function setAuth(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null }
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isLoggedIn(): boolean {
  const token = getToken()
  if (!token) return false
  const payload = decodeJwt(token)
  if (!payload) return false
  return payload.exp * 1000 > Date.now()
}

export function getDaysRemaining(): number {
  const token = getToken()
  if (!token) return 0
  const payload = decodeJwt(token)
  if (!payload) return 0
  const msLeft = payload.exp * 1000 - Date.now()
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
}

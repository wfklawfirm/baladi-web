export interface UserSession {
  token: string;
  username: string;
  municipality: string;
}
const KEY = "baladi_session";
export function saveSession(s: UserSession) { if (typeof window==="undefined") return; localStorage.setItem(KEY, JSON.stringify(s)); }
export function loadSession(): UserSession | null { if (typeof window==="undefined") return null; try { const r=localStorage.getItem(KEY); return r?JSON.parse(r):null; } catch { return null; } }
export function clearSession() { if (typeof window==="undefined") return; localStorage.removeItem(KEY); }

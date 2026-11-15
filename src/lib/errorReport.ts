// Envoi des erreurs JavaScript du site en ligne vers /api/client-error (admin → Erreurs du site).
// Ignoré en local ; 5 erreurs maximum par visite ; bruit connu des navigateurs filtré.
import { cloudEnabled } from '@/api/cloud'

const IGNORE = /ResizeObserver loop|Script error\.?$|Load failed|NetworkError|Failed to fetch|AbortError|chrome-extension|moz-extension/i
let sent = 0
const done = new Set<string>()

function send(kind: string, message: string, stack?: string) {
  if (!cloudEnabled || sent >= 5 || !message || IGNORE.test(message) || done.has(message)) return
  done.add(message); sent++
  const body = JSON.stringify({ kind, message, stack, url: location.href, release: import.meta.env.MODE })
  try { navigator.sendBeacon?.('/api/client-error', new Blob([body], { type: 'application/json' })) || fetch('/api/client-error', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true }) } catch { /* rien */ }
}

export function installErrorReport() {
  addEventListener('error', (e) => { if (e.error || e.message) send('error', e.message || String(e.error), (e.error as Error | undefined)?.stack) })
  addEventListener('unhandledrejection', (e) => { const r = e.reason as Error | undefined; send('promise', r?.message ?? String(e.reason), r?.stack) })
}

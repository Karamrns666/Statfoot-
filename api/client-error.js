// /api/client-error — suivi des erreurs du site en production (équivalent léger de Sentry, sans compte externe).
// Le navigateur envoie les erreurs JavaScript ; elles sont rangées en lignes « ClientError » lisibles UNIQUEMENT par
// les admins (règle de sécurité côté base) et affichées dans l'admin (Paramètres → Erreurs du site).
import { config, sb } from './_lib/supabaseAdmin.js'

const seen = new Map() // limitation simple par adresse IP (instance serverless)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'ip'
  const now = Date.now(), hits = (seen.get(ip) || []).filter((t) => now - t < 60_000)
  if (hits.length >= 10) return res.status(429).end()
  seen.set(ip, [...hits, now])
  let cfg
  try { cfg = config() } catch { return res.status(204).end() }
  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const cut = (s, n) => String(s ?? '').slice(0, n)
  const id = `err_${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`
  const data = { id, created_date: new Date().toISOString(), message: cut(b.message, 500), stack: cut(b.stack, 3000), url: cut(b.url, 300), ua: cut(req.headers['user-agent'], 300), release: cut(b.release, 40), kind: cut(b.kind, 20) }
  try { await sb(cfg, '/rest/v1/entity_rows', { method: 'POST', body: { entity: 'ClientError', id, data } }) } catch { /* jamais bloquant */ }
  return res.status(204).end()
}

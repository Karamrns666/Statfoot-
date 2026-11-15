// /api/health — état du site pour la surveillance automatique (aucune donnée privée : uniquement des nombres).
// Base joignable ? Combien d'erreurs JavaScript chez les visiteurs ces 15 dernières minutes ? Dernière sauvegarde ?
import { config, sb } from './_lib/supabaseAdmin.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const out = { ok: true, db: false, errors_15min: 0, last_backup: null, at: new Date().toISOString() }
  try {
    const cfg = config()
    const since = new Date(Date.now() - 15 * 60_000).toISOString()
    const errs = await sb(cfg, `/rest/v1/entity_rows?select=id&entity=eq.ClientError&deleted=is.false&updated_at=gt.${encodeURIComponent(since)}&limit=500`)
    out.db = true
    out.errors_15min = Array.isArray(errs) ? errs.length : 0
    try {
      const r = await fetch(`${cfg.url}/storage/v1/object/list/backups`, { method: 'POST', headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prefix: '', limit: 1, sortBy: { column: 'name', order: 'desc' } }) })
      const list = r.ok ? await r.json() : []
      out.last_backup = list?.[0]?.name ?? null
    } catch { /* facultatif */ }
  } catch {
    out.ok = false
  }
  res.status(out.ok ? 200 : 503).json(out)
}

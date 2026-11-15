// /api/backup — SAUVEGARDE QUOTIDIENNE de la vraie base (table entity_rows + profils admins), sans la simulation
// (table sim_rows, jamais sauvegardée). Fichier JSON compressé rangé dans le bucket PRIVÉ « backups » de Supabase,
// un fichier par jour (AAAA-MM-JJ.json.gz), 30 jours conservés.
//  · GET  (tâche planifiée Vercel, tous les jours à 3 h) → sauvegarde du jour
//  · POST { action: 'backup' | 'list' | 'verify' | 'restore', file?, confirm? } → admin connecté
//      verify  : relit une sauvegarde et la compare à la base actuelle (test de restauration sans rien modifier)
//      restore : SUPER-ADMIN uniquement, confirm = nom du fichier ; remet la base dans l'état de la sauvegarde
import { gzipSync, gunzipSync } from 'node:zlib'
import { audit, config, sb } from './_lib/supabaseAdmin.js'

const BUCKET = 'backups', KEEP_DAYS = 30

async function caller(cfg, req) {
  const jwt = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!jwt || jwt === process.env.CRON_SECRET) return null
  const r = await fetch(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.key, Authorization: `Bearer ${jwt}` } })
  if (!r.ok) return null
  const user = await r.json()
  const [p] = await sb(cfg, `/rest/v1/admin_profiles?id=eq.${user.id}&select=id,email,role,status`)
  return p && p.status === 'active' ? p : null
}
const isCron = (req) => (process.env.CRON_SECRET ? req.headers.authorization === `Bearer ${process.env.CRON_SECRET}` : /vercel-cron/i.test(req.headers['user-agent'] || ''))

async function ensureBucket(cfg) {
  try { await sb(cfg, '/storage/v1/bucket', { method: 'POST', body: { id: BUCKET, name: BUCKET, public: false } }) }
  catch (e) { if (!(e.status === 409 || e.status === 400 || /exist/i.test(e.message))) throw e }
}
async function allRows(cfg) {
  const out = []
  for (let offset = 0; ; offset += 1000) {
    const rows = await sb(cfg, `/rest/v1/entity_rows?select=entity,id,data,deleted,updated_at&order=entity.asc,id.asc&limit=1000&offset=${offset}`)
    out.push(...rows); if (rows.length < 1000) break
  }
  return out
}
async function snapshot(cfg) {
  const rows = await allRows(cfg)
  const profiles = await sb(cfg, '/rest/v1/admin_profiles?select=*').catch(() => [])
  return { version: 1, created_at: new Date().toISOString(), rows, admin_profiles: profiles }
}
function summary(rows) {
  const by = {}
  for (const r of rows) if (!r.deleted) by[r.entity] = (by[r.entity] || 0) + 1
  return by
}
async function upload(cfg, name, buf) {
  const r = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${name}`, { method: 'POST', headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/gzip', 'x-upsert': 'true' }, body: buf })
  if (!r.ok) throw new Error(`Envoi de la sauvegarde impossible (${r.status})`)
}
async function download(cfg, name) {
  const r = await fetch(`${cfg.url}/storage/v1/object/${BUCKET}/${encodeURIComponent(name)}`, { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } })
  if (!r.ok) throw new Error(`Sauvegarde introuvable (${r.status})`)
  return JSON.parse(gunzipSync(Buffer.from(await r.arrayBuffer())).toString('utf8'))
}
async function list(cfg) {
  const files = await sb(cfg, `/storage/v1/object/list/${BUCKET}`, { method: 'POST', body: { prefix: '', limit: 200, sortBy: { column: 'name', order: 'desc' } } })
  return files.filter((f) => f.name.endsWith('.json.gz')).map((f) => ({ name: f.name, size: f.metadata?.size ?? null, created_at: f.created_at }))
}
async function backup(cfg) {
  await ensureBucket(cfg)
  const snap = await snapshot(cfg)
  const name = `${snap.created_at.slice(0, 10)}.json.gz`
  const buf = gzipSync(Buffer.from(JSON.stringify(snap)))
  await upload(cfg, name, buf)
  // rotation : 30 derniers jours
  const files = await list(cfg)
  const old = files.filter((f) => f.name < `${new Date(Date.now() - KEEP_DAYS * 864e5).toISOString().slice(0, 10)}`)
  if (old.length) await sb(cfg, `/storage/v1/object/${BUCKET}`, { method: 'DELETE', body: { prefixes: old.map((f) => f.name) } }).catch(() => null)
  return { file: name, rows: snap.rows.length, bytes: buf.length, entities: summary(snap.rows) }
}

export default async function handler(req, res) {
  let cfg
  try { cfg = config() } catch (e) { return res.status(500).json({ error: e.message }) }
  try {
    if (req.method === 'GET') {
      if (!isCron(req)) return res.status(403).json({ error: 'Réservé à la tâche planifiée.' })
      const r = await backup(cfg)
      await audit(cfg, { email: 'serveur', action: 'backup', entity: 'Backup', entity_id: r.file, label: `Sauvegarde ${r.file}`, details: { lignes: r.rows, octets: r.bytes } })
      return res.json(r)
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'GET ou POST' })
    const me = await caller(cfg, req)
    if (!me) return res.status(403).json({ error: 'Connexion admin requise.' })
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
    if (body.action === 'list') { await ensureBucket(cfg); return res.json({ files: await list(cfg) }) }
    if (body.action === 'backup') {
      const r = await backup(cfg)
      await audit(cfg, { email: me.email, action: 'backup', entity: 'Backup', entity_id: r.file, label: `Sauvegarde ${r.file}`, details: { lignes: r.rows } })
      return res.json(r)
    }
    if (body.action === 'verify') {
      const snap = await download(cfg, body.file)
      const now = summary(await allRows(cfg)), then = summary(snap.rows)
      const ents = [...new Set([...Object.keys(now), ...Object.keys(then)])].sort()
      const diff = ents.filter((e) => (now[e] || 0) !== (then[e] || 0)).map((e) => ({ entity: e, sauvegarde: then[e] || 0, actuel: now[e] || 0 }))
      return res.json({ file: body.file, created_at: snap.created_at, rows: snap.rows.length, readable: true, entities: then, differences: diff })
    }
    if (body.action === 'restore') {
      if (me.role !== 'super_admin') return res.status(403).json({ error: 'Restauration réservée aux super-admins.' })
      if (!body.file || body.confirm !== body.file) return res.status(400).json({ error: 'Confirmation manquante : retapez le nom du fichier.' })
      const snap = await download(cfg, body.file)
      // sauvegarde de sécurité de l'état actuel avant de restaurer
      const before = await snapshot(cfg)
      await upload(cfg, `avant-restauration-${before.created_at.replace(/[:.]/g, '-')}.json.gz`, gzipSync(Buffer.from(JSON.stringify(before))))
      const keep = new Set(snap.rows.map((r) => `${r.entity}\u0000${r.id}`))
      const gone = before.rows.filter((r) => !r.deleted && !keep.has(`${r.entity}\u0000${r.id}`)).map((r) => ({ entity: r.entity, id: r.id, data: r.data, deleted: true }))
      const rows = [...snap.rows.map((r) => ({ entity: r.entity, id: r.id, data: r.data, deleted: r.deleted })), ...gone]
      for (let i = 0; i < rows.length; i += 400) await sb(cfg, '/rest/v1/entity_rows?on_conflict=entity,id', { method: 'POST', body: rows.slice(i, i + 400), headers: { Prefer: 'resolution=merge-duplicates,return=minimal' } })
      await audit(cfg, { email: me.email, action: 'restore', entity: 'Backup', entity_id: body.file, label: `Restauration ${body.file}`, details: { lignes: snap.rows.length, retirées: gone.length } })
      return res.json({ restored: snap.rows.length, removed: gone.length })
    }
    return res.status(400).json({ error: 'Action inconnue' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

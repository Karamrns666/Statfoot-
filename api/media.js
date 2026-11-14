// /api/media — envoi des images (photos, logos, affiches) dans Supabase Storage, bucket public « media ».
// Réservé aux admins actifs (vérifié côté serveur). Le serveur crée le bucket s'il n'existe pas, puis renvoie une
// URL d'envoi signée (valable 2 h) : le navigateur y envoie le fichier directement, sans passer par cette fonction.
// L'image est ensuite servie à TOUS les visiteurs par son URL publique (avant : rangée seulement dans le navigateur
// de l'admin qui l'avait importée → image cassée partout ailleurs).
import { config, sb } from './_lib/supabaseAdmin.js'

const BUCKET = 'media'
const TYPES = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/gif': 'gif', 'image/avif': 'avif' }

async function caller(cfg, req) {
  const jwt = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!jwt) return null
  const r = await fetch(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.key, Authorization: `Bearer ${jwt}` } })
  if (!r.ok) return null
  const user = await r.json()
  const [p] = await sb(cfg, `/rest/v1/admin_profiles?id=eq.${user.id}&select=id,email,role,status`)
  return p && p.status === 'active' ? p : null
}

let bucketReady = false
async function ensureBucket(cfg) {
  if (bucketReady) return
  try {
    await sb(cfg, '/storage/v1/bucket', { method: 'POST', body: { id: BUCKET, name: BUCKET, public: true, file_size_limit: 15 * 1024 * 1024, allowed_mime_types: Object.keys(TYPES) } })
  } catch (e) {
    if (!(e.status === 409 || e.status === 400 || /exist/i.test(e.message))) throw e
  }
  bucketReady = true
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' })
  let cfg
  try { cfg = config() } catch (e) { return res.status(500).json({ error: e.message }) }
  const me = await caller(cfg, req).catch(() => null)
  if (!me) return res.status(403).json({ error: 'Connexion admin requise.' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const ext = TYPES[body.type]
  if (!ext) return res.status(400).json({ error: 'Type de fichier non accepté (images uniquement).' })
  const hint = String(body.hint || 'f').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 24) || 'f'
  const path = `${new Date().toISOString().slice(0, 7)}/${hint}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`
  try {
    await ensureBucket(cfg)
    const s = await sb(cfg, `/storage/v1/object/upload/sign/${BUCKET}/${path}`, { method: 'POST', body: {} })
    return res.json({ upload_url: `${cfg.url}/storage/v1${s.url}`, public_url: `${cfg.url}/storage/v1/object/public/${BUCKET}/${path}` })
  } catch (e) {
    return res.status(e.status && e.status < 500 ? e.status : 500).json({ error: e.message })
  }
}

// /api/admin-users — gestion des administrateurs, réservée aux SUPER-ADMINS (vérifié côté serveur).
// Actions (POST JSON) : list · add {email, full_name, role} · remove {id} · role {id, role} · status {id, status} · reset {id}
// Chaque action est inscrite au journal (qui, quoi, quand).
import { ROLES, audit, config, profiles, sb, upsertProfile } from './_lib/supabaseAdmin.js'

async function caller(cfg, req) {
  const jwt = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!jwt) return null
  const r = await fetch(`${cfg.url}/auth/v1/user`, { headers: { apikey: cfg.key, Authorization: `Bearer ${jwt}` } })
  if (!r.ok) return null
  const user = await r.json()
  const [p] = await sb(cfg, `/rest/v1/admin_profiles?id=eq.${user.id}&select=*`)
  return p && p.status === 'active' ? p : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' })
  let cfg
  try { cfg = config() } catch (e) { return res.status(500).json({ error: e.message }) }
  const me = await caller(cfg, req).catch(() => null)
  if (!me || me.role !== 'super_admin') return res.status(403).json({ error: 'Réservé aux super-admins.' })
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const origin = req.headers.origin || `https://${req.headers.host}`
  const log = (action, details) => audit(cfg, { user_id: me.id, email: me.email, action, entity: 'AdminUser', entity_id: body.id ?? body.email, label: body.email, details })
  try {
    const all = await profiles(cfg)
    const target = body.id ? all.find((p) => p.id === body.id) : undefined
    const superCount = all.filter((p) => p.role === 'super_admin' && p.status === 'active').length
    switch (body.action) {
      case 'list':
        return res.json({ admins: all })
      case 'add': {
        const email = String(body.email || '').trim().toLowerCase()
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'E-mail invalide.' })
        if (!ROLES.includes(body.role)) return res.status(400).json({ error: 'Rôle invalide.' })
        if (all.some((p) => p.email === email)) return res.status(409).json({ error: 'Ce compte existe déjà.' })
        // invitation : Supabase envoie un e-mail ; la personne choisit son mot de passe via le lien
        const u = await sb(cfg, '/auth/v1/invite', { method: 'POST', body: { email, data: { full_name: body.full_name || null } }, headers: { 'Content-Type': 'application/json' } }).catch(async (e) => {
          if (e.status === 429) throw e
          // e-mail non configuré : création sans e-mail (mot de passe à réinitialiser ensuite)
          return sb(cfg, '/auth/v1/admin/users', { method: 'POST', body: { email, email_confirm: true } })
        })
        await upsertProfile(cfg, { id: u.id, email, full_name: body.full_name || null, role: body.role, status: 'active', must_change_password: true })
        await log('admin_add', { role: body.role, origine: origin })
        return res.json({ ok: true })
      }
      case 'remove': {
        if (!target) return res.status(404).json({ error: 'Compte introuvable.' })
        if (target.id === me.id) return res.status(400).json({ error: 'Vous ne pouvez pas retirer votre propre compte.' })
        if (target.role === 'super_admin' && superCount <= 1) return res.status(400).json({ error: 'Il doit rester au moins un super-admin.' })
        await sb(cfg, `/auth/v1/admin/users/${target.id}`, { method: 'DELETE' })
        await log('admin_remove', { email: target.email, role: target.role })
        return res.json({ ok: true })
      }
      case 'role': {
        if (!target || !ROLES.includes(body.role)) return res.status(400).json({ error: 'Rôle ou compte invalide.' })
        if (target.role === 'super_admin' && body.role !== 'super_admin' && superCount <= 1) return res.status(400).json({ error: 'Il doit rester au moins un super-admin.' })
        await upsertProfile(cfg, { ...target, role: body.role })
        await log('admin_role', { email: target.email, avant: target.role, apres: body.role })
        return res.json({ ok: true })
      }
      case 'status': {
        if (!target || !['active', 'disabled'].includes(body.status)) return res.status(400).json({ error: 'Statut ou compte invalide.' })
        if (target.id === me.id) return res.status(400).json({ error: 'Vous ne pouvez pas désactiver votre propre compte.' })
        await upsertProfile(cfg, { ...target, status: body.status })
        await log('admin_status', { email: target.email, statut: body.status })
        return res.json({ ok: true })
      }
      case 'reset': {
        if (!target) return res.status(404).json({ error: 'Compte introuvable.' })
        await sb(cfg, '/auth/v1/recover', { method: 'POST', body: { email: target.email }, headers: { 'Content-Type': 'application/json' } }).catch(() => null)
        await upsertProfile(cfg, { ...target, must_change_password: true })
        await log('admin_reset_password', { email: target.email })
        return res.json({ ok: true, message: `E-mail de réinitialisation envoyé à ${target.email}.` })
      }
      default:
        return res.status(400).json({ error: 'Action inconnue.' })
    }
  } catch (e) {
    return res.status(e.status && e.status < 500 ? e.status : 500).json({ error: e.message })
  }
}

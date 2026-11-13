// Accès « service » à Supabase, UNIQUEMENT côté serveur (fonctions Vercel et script de seed).
// La clé service_role et le mot de passe initial ne quittent jamais le serveur et ne sont jamais écrits dans les logs.
export const SUPER_ADMINS = [
  'abdessamad.bouhadda@gmail.com',
  'ardentia.bo@gmail.com',
  'badrelabied50@gmail.com',
  'idlaasriyassine@gmail.com',
  'k.routima11@gmail.com',
  'laaroussiayoub96@gmail.com',
  'othmandarouich123@gmail.com',
]
export const ROLES = ['super_admin', 'admin', 'operator']

export function config(env = process.env) {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const key = env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!url || !key) throw new Error('SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY doivent être configurées.')
  return { url, key }
}

export async function sb(cfg, path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${cfg.url}${path}`, {
    method,
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}`, 'Content-Type': 'application/json', ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw Object.assign(new Error((data && (data.msg || data.message || data.error_description || data.error)) || `Erreur Supabase ${res.status}`), { status: res.status })
  return data
}

/** Tous les comptes Auth (pagination). */
export async function listAuthUsers(cfg) {
  const out = []
  for (let page = 1; page < 50; page++) {
    const r = await sb(cfg, `/auth/v1/admin/users?page=${page}&per_page=200`)
    const users = r.users || []
    out.push(...users)
    if (users.length < 200) break
  }
  return out
}

export const profiles = (cfg) => sb(cfg, '/rest/v1/admin_profiles?select=*&order=email')
export const upsertProfile = (cfg, row) => sb(cfg, '/rest/v1/admin_profiles?on_conflict=id', { method: 'POST', body: row, headers: { Prefer: 'resolution=merge-duplicates,return=representation' } })
/** Journal des actions (même format que le journal de l'admin : entité AuditLog, lecture réservée aux admins). */
export function audit(cfg, { email, action, entity, entity_id, label, details }) {
  const id = `srv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
  const data = { id, created_date: new Date().toISOString(), action, entity, entity_id, entity_label: label ?? entity_id, author_email: email ?? 'serveur', author_name: email ?? 'Serveur', details }
  return sb(cfg, '/rest/v1/entity_rows', { method: 'POST', body: { entity: 'AuditLog', id, data } }).catch(() => null)
}

/**
 * Crée (ou met à jour) les comptes super-admin. IDEMPOTENT :
 *  · compte inexistant → créé avec le mot de passe initial (haché par Supabase), e-mail confirmé, changement obligatoire ;
 *  · compte existant → seul le rôle passe à super_admin (le mot de passe n'est PAS modifié).
 */
export async function seedSuperAdmins(cfg, initialPassword, emails = SUPER_ADMINS) {
  if (!initialPassword || initialPassword.length < 8) throw new Error('SUPERADMIN_INITIAL_PASSWORD manquant (8 caractères minimum).')
  const users = await listAuthUsers(cfg)
  const existing = new Map((await profiles(cfg)).map((p) => [p.id, p]))
  const report = []
  for (const email of emails.map((e) => e.trim().toLowerCase())) {
    let u = users.find((x) => (x.email || '').toLowerCase() === email)
    if (!u) {
      u = await sb(cfg, '/auth/v1/admin/users', { method: 'POST', body: { email, password: initialPassword, email_confirm: true } })
      await upsertProfile(cfg, { id: u.id, email, role: 'super_admin', status: 'active', must_change_password: true })
      report.push({ email, action: 'créé (changement de mot de passe obligatoire)' })
    } else {
      const p = existing.get(u.id)
      await upsertProfile(cfg, { id: u.id, email, role: 'super_admin', status: 'active', must_change_password: p ? p.must_change_password : true })
      report.push({ email, action: p?.role === 'super_admin' ? 'déjà super-admin (inchangé)' : 'rôle mis à jour → super-admin (mot de passe conservé)' })
    }
  }
  return report
}

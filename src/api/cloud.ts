// Supabase (« cloud ») : comptes admin réels et données partagées entre tous les écrans.
// Activé seulement si VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définies (sinon : mode local historique).
//  · Auth : Supabase Auth (mots de passe hachés, réinitialisation par e-mail, limitation des tentatives côté serveur) ;
//    profil admin (rôle, changement de mot de passe obligatoire) dans la table admin_profiles.
//  · Données : table entity_rows (une ligne JSON par enregistrement). Lecture publique, écriture réservée aux admins.
//    Le navigateur garde une copie locale (affichage instantané) ; les modifications d'un admin sont envoyées aussitôt,
//    et chaque écran (site, mode TV…) récupère les changements toutes les quelques secondes.
// Aucun secret ici : la clé « anon » est publique par nature ; la clé service_role ne vit que côté serveur (/api).
import type { AdminRole, AdminUser, BaseEntity, EntityName } from '@/types/entities'

const URL_ = ((import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '').replace(/\/$/, '')
const ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''
export const cloudEnabled = !!(URL_ && ANON)

/** Entités jamais synchronisées (comptes : gérés par Supabase Auth). */
const NOT_SYNCED = new Set<string>(['AdminUser'])
export const isSynced = (name: string) => !NOT_SYNCED.has(name)

// ---------------------------------------------------------------------------------------------------------
//  Session
// ---------------------------------------------------------------------------------------------------------
interface Session { access_token: string; refresh_token: string; expires_at: number; user: { id: string; email: string } }
export interface Profile { id: string; email: string; full_name?: string | null; role: AdminRole; status: 'active' | 'disabled'; must_change_password: boolean; last_login?: string | null; created_at?: string }
const SESSION_KEY = 'statfoot:cloud-session'
const PROFILE_KEY = 'statfoot:cloud-profile'
const read = <T,>(k: string): T | null => { try { return JSON.parse(localStorage.getItem(k) ?? 'null') } catch { return null } }
const save = (k: string, v: unknown) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)) } catch { /* stockage indisponible */ } }
let session: Session | null = cloudEnabled ? read<Session>(SESSION_KEY) : null
let profile: Profile | null = cloudEnabled ? read<Profile>(PROFILE_KEY) : null
const authListeners = new Set<() => void>()
export const onAuthChange = (l: () => void) => { authListeners.add(l); return () => { authListeners.delete(l) } }
function setSession(s: Session | null, p: Profile | null = profile) {
  session = s; profile = s ? p : null
  save(SESSION_KEY, session); save(PROFILE_KEY, profile)
  authListeners.forEach((l) => l())
}

async function call(path: string, init: RequestInit & { token?: string | null } = {}) {
  const headers: Record<string, string> = { apikey: ANON, 'Content-Type': 'application/json', ...(init.headers as Record<string, string>) }
  const tok = init.token === undefined ? ANON : init.token ?? ANON
  headers.Authorization = `Bearer ${tok}`
  const res = await fetch(`${URL_}${path}`, { ...init, headers })
  const text = await res.text()
  let data: unknown = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const d = (data ?? {}) as Record<string, string>
    throw Object.assign(new Error(d.msg || d.message || d.error_description || d.error || `Erreur ${res.status}`), { status: res.status, code: d.error_code || d.code || d.error })
  }
  return data
}

const toSession = (d: Record<string, unknown>): Session => ({
  access_token: d.access_token as string, refresh_token: d.refresh_token as string,
  expires_at: (d.expires_at as number) ?? Math.floor(Date.now() / 1000) + Number(d.expires_in ?? 3600),
  user: { id: (d.user as { id: string }).id, email: (d.user as { email: string }).email },
})

let refreshing: Promise<string | null> | null = null
/** Jeton d'accès valide (rafraîchi si besoin), ou null si personne n'est connecté. */
export async function accessToken(): Promise<string | null> {
  if (!session) return null
  if (session.expires_at - 60 > Date.now() / 1000) return session.access_token
  refreshing ??= (async () => {
    try {
      const d = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: JSON.stringify({ refresh_token: session!.refresh_token }) }) as Record<string, unknown>
      setSession(toSession(d))
      return session!.access_token
    } catch { setSession(null); return null } finally { refreshing = null }
  })()
  return refreshing
}

async function loadProfile(token: string, uid: string): Promise<Profile> {
  const rows = await call(`/rest/v1/admin_profiles?id=eq.${uid}&select=*`, { token }) as Profile[]
  const p = rows[0]
  if (!p) throw new Error("Ce compte n'a pas d'accès administrateur. Les comptes sont créés par un super-admin.")
  if (p.status !== 'active') throw new Error('Ce compte est désactivé.')
  return p
}

// limitation côté site (en plus de celle de Supabase, côté serveur) : 5 échecs → 15 minutes d'attente pour cet e-mail
const LOCK_KEY = 'statfoot:login-attempts'
function attempts(email: string) { const all = read<Record<string, { n: number; until?: number }>>(LOCK_KEY) ?? {}; return { all, cur: all[email] ?? { n: 0 } } }
function checkLock(email: string) {
  const { cur } = attempts(email)
  if (cur.until && cur.until > Date.now()) throw new Error(`Trop de tentatives de connexion. Réessayez dans ${Math.ceil((cur.until - Date.now()) / 60000)} min, ou utilisez « Mot de passe oublié ».`)
}
function recordFail(email: string) {
  const { all, cur } = attempts(email)
  const n = cur.until && cur.until < Date.now() ? 1 : cur.n + 1
  all[email] = n >= 5 ? { n: 0, until: Date.now() + 15 * 60000 } : { n }
  save(LOCK_KEY, all)
}
function clearFails(email: string) { const { all } = attempts(email); delete all[email]; save(LOCK_KEY, all) }

const toAdminUser = (p: Profile): AdminUser => ({ id: p.id, email: p.email, full_name: p.full_name ?? undefined, role: p.role, status: p.status, last_login: p.last_login ?? undefined, must_change_password: p.must_change_password })

export const cloudAuth = {
  me(): AdminUser | null { return session && profile ? toAdminUser(profile) : null },
  async login(email: string, password: string): Promise<AdminUser> {
    const e = email.trim().toLowerCase()
    checkLock(e)
    let d: Record<string, unknown>
    try {
      d = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: JSON.stringify({ email: e, password }) }) as Record<string, unknown>
    } catch (err) {
      const st = (err as { status?: number }).status
      if (st === 429) throw new Error('Trop de tentatives de connexion : patientez quelques minutes avant de réessayer.')
      recordFail(e)
      throw new Error(st === 400 ? 'E-mail ou mot de passe incorrect.' : `Connexion impossible (${(err as Error).message}).`)
    }
    clearFails(e)
    const s = toSession(d)
    const p = await loadProfile(s.access_token, s.user.id).catch((err) => { setSession(null); throw err })
    setSession(s, p)
    call('/rest/v1/rpc/touch_login', { method: 'POST', body: '{}', token: s.access_token }).catch(() => null)
    return toAdminUser(p)
  },
  async logout() {
    const t = session?.access_token
    setSession(null)
    if (t) await call('/auth/v1/logout', { method: 'POST', token: t }).catch(() => null)
  },
  /** Relit le profil (rôle changé, compte désactivé…). */
  async refreshProfile() {
    const t = await accessToken()
    if (!t || !session) return
    try { setSession(session, await loadProfile(t, session.user.id)) } catch { setSession(null) }
  },
  /** Changement de mot de passe (obligatoire à la première connexion). */
  async changePassword(password: string) {
    const t = await accessToken()
    if (!t) throw new Error('Session expirée : reconnectez-vous.')
    try { await call('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }), token: t }) } catch (e) {
      const code = (e as { code?: string }).code
      if (code === 'same_password') throw new Error('Le nouveau mot de passe doit être différent de l’ancien.')
      if (code === 'weak_password') throw new Error('Mot de passe trop faible : choisissez-en un plus long et plus varié.')
      throw e
    }
    await call('/rest/v1/rpc/password_changed', { method: 'POST', body: '{}', token: t })
    if (profile) setSession(session, { ...profile, must_change_password: false })
  },
  /** « Mot de passe oublié » : Supabase envoie un e-mail avec un lien vers /admin/reinitialisation. */
  async recover(email: string) {
    await call(`/auth/v1/recover?redirect_to=${encodeURIComponent(`${location.origin}/admin/reinitialisation`)}`, { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) })
  },
  /** Arrivée depuis le lien de l'e-mail (#access_token=…&type=recovery|invite) : ouvre une session temporaire. */
  async fromEmailLink(hash: string): Promise<boolean> {
    const q = new URLSearchParams(hash.replace(/^#/, ''))
    if (q.get('error_description')) throw new Error(q.get('error_description')!.replace(/\+/g, ' '))
    const at = q.get('access_token'), rt = q.get('refresh_token')
    if (!at || !rt) return false
    const user = await call('/auth/v1/user', { token: at }) as { id: string; email: string }
    const s: Session = { access_token: at, refresh_token: rt, expires_at: Math.floor(Date.now() / 1000) + Number(q.get('expires_in') ?? 3600), user: { id: user.id, email: user.email } }
    const p = await loadProfile(at, user.id)
    setSession(s, { ...p, must_change_password: true })
    return true
  },
}

/** Appel aux fonctions serveur réservées aux super-admins (/api/admin-users). */
export async function adminApi<T = unknown>(action: string, body: Record<string, unknown> = {}): Promise<T> {
  const t = await accessToken()
  const res = await fetch('/api/admin-users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t ?? ''}` }, body: JSON.stringify({ action, ...body }) })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(d.error ?? `Erreur ${res.status}`)
  return d as T
}

// ---------------------------------------------------------------------------------------------------------
//  Données partagées
// ---------------------------------------------------------------------------------------------------------
export interface CloudRow { entity: string; id: string; data: BaseEntity; deleted: boolean; updated_at: string }
export async function pullRows(since?: string): Promise<CloudRow[]> {
  const token = (await accessToken()) ?? ANON
  // chargement complet : les enregistrements supprimés sont inutiles (la copie locale est remplacée en entier)
  const q = (offset: number) => `/rest/v1/entity_rows?select=entity,id,data,deleted,updated_at${since ? `&updated_at=gt.${encodeURIComponent(since)}` : '&deleted=is.false'}&order=updated_at.asc,entity.asc,id.asc&limit=1000&offset=${offset}`
  // 1re page déjà demandée par index.html (visiteur, avant le chargement du JavaScript) : on la réutilise
  const pre = (window as { __mblPrefetch?: { path: string; res: Promise<CloudRow[] | null> } }).__mblPrefetch
  let first: CloudRow[] | null = null
  if (pre && pre.path === q(0) && token === ANON) { (window as { __mblPrefetch?: unknown }).__mblPrefetch = undefined; first = await pre.res }
  first ??= await call(q(0), { token }) as CloudRow[]
  const out: CloudRow[] = [...first]
  // pages suivantes demandées 4 par 4 en parallèle (au lieu d'une à la fois)
  for (let offset = 1000, more = first.length === 1000; more; offset += 4000) {
    const pages = await Promise.all([0, 1, 2, 3].map((k) => call(q(offset + k * 1000), { token }) as Promise<CloudRow[]>))
    for (const p of pages) { out.push(...p); if (p.length < 1000) { more = false; break } }
  }
  return out
}
export async function pushRows(rows: { entity: string; id: string; data: unknown; deleted: boolean }[]) {
  const token = await accessToken()
  if (!token) throw new Error('Non connecté')
  for (let i = 0; i < rows.length; i += 400) {
    await call('/rest/v1/entity_rows?on_conflict=entity,id', { method: 'POST', token, headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(rows.slice(i, i + 400)) })
  }
}
export const META = { entity: '__meta', init: 'init', migrations: 'migrations' } as const

/** Appel REST / RPC Supabase avec le jeton de l'admin connecté (simulation : table sim_rows et fonctions dédiées). */
export async function adminRest(path: string, init: RequestInit = {}) {
  const token = await accessToken()
  if (!token) throw new Error('Connexion admin requise')
  return call(path, { ...init, token })
}
export const canWrite = () => !!(session && profile && profile.status === 'active')
export type { EntityName }

// ---------------------------------------------------------------------------------------------------------
//  Images (Supabase Storage, bucket public « media »)
// ---------------------------------------------------------------------------------------------------------
/** Envoie une image et renvoie son URL publique (visible par tous les visiteurs). */
export async function uploadMedia(blob: Blob, hint = 'f'): Promise<string> {
  const t = await accessToken()
  if (!t) throw new Error('Connexion admin requise pour envoyer une image')
  const res = await fetch('/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify({ type: blob.type, hint }) })
  const d = await res.json().catch(() => ({})) as { upload_url?: string; public_url?: string; error?: string }
  if (!res.ok || !d.upload_url || !d.public_url) throw new Error(d.error ?? `Envoi de l'image impossible (${res.status})`)
  const up = await fetch(d.upload_url, { method: 'PUT', headers: { 'Content-Type': blob.type, 'x-upsert': 'false' }, body: blob })
  if (!up.ok) throw new Error(`Envoi de l'image impossible (${up.status})`)
  return d.public_url
}

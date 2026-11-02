// Authentification simulée. Dans Base44 : base44.auth.me(), base44.auth.logout(), base44.auth.redirectToLogin().
// Liste blanche : seuls les comptes créés ou invités par un admin peuvent se connecter.
import { store, newId } from './localStore'
import { getSessionUser, setSession } from './session'
import type { AdminUser, BaseEntity } from '@/types/entities'

function audit(action: string, u: AdminUser, details?: Record<string, unknown>) {
  store.replace('AuditLog', [{ id: newId(), created_date: new Date().toISOString(), action, entity: 'AdminUser', entity_id: u.id, entity_label: u.email, author_email: u.email, author_name: u.full_name ?? u.email, details } as BaseEntity, ...store.all('AuditLog')])
}

function finishLogin(u: AdminUser, extra: Partial<AdminUser> = {}) {
  const now = new Date().toISOString()
  const next = { ...u, ...extra, last_login: now, status: 'active' as const, activated_at: u.activated_at ?? now }
  store.replace('AdminUser', store.all<AdminUser>('AdminUser').map((x) => (x.id === u.id ? next : x)))
  setSession(u.id)
  audit('login', next)
  return next
}

const find = (email: string) => store.all<AdminUser>('AdminUser').find((x) => x.email.toLowerCase() === email.trim().toLowerCase())

export const auth = {
  async me(): Promise<AdminUser | null> {
    const u = getSessionUser()
    if (!u || u.status === 'disabled') return null
    const { password: _pw, ...safe } = u
    void _pw
    return safe as AdminUser
  },
  async login(email: string, password: string): Promise<AdminUser> {
    const u = find(email)
    if (!u) throw new Error("Ce compte n'existe pas. Les comptes sont créés uniquement par un administrateur.")
    if (u.status === 'disabled') throw new Error('Ce compte est désactivé.')
    if (u.status === 'invited') return finishLogin(u, { password }) // 1re connexion : le mot de passe saisi est enregistré
    if (u.password !== password) throw new Error('Mot de passe incorrect.')
    return finishLogin(u)
  },
  /** Simulation de « Continuer avec Google » (vrai SSO dans Base44) : email soumis à la liste blanche. */
  async loginWithGoogle(email: string): Promise<AdminUser> {
    const u = find(email)
    if (!u) throw new Error('Email non autorisé : demandez une invitation à un administrateur.')
    if (u.status === 'disabled') throw new Error('Ce compte est désactivé.')
    return finishLogin(u)
  },
  async logout() { setSession(null) },
}

// Authentification simulée. Dans Base44 : base44.auth.me(), base44.auth.logout(), base44.auth.redirectToLogin().
// Règle reprise de cac-foot : liste blanche — seuls les comptes créés/invités par un admin peuvent se connecter.
import { store, newId } from './localStore'
import { getSessionUser, setSession } from './session'
import type { Invitation, User } from '@/types/entities'

function touchLogin(u: User) {
  const users = store.all<User>('User').map((x) => (x.id === u.id ? { ...x, last_login: new Date().toISOString() } : x))
  store.replace('User', users)
  setSession(u.id)
  store.replace('ActivityLog', [{ id: newId(), created_date: new Date().toISOString(), action: 'login', entity: 'User', entity_id: u.id, entity_label: u.email, author_email: u.email, author_name: u.full_name }, ...store.all('ActivityLog')])
}

function acceptInvitation(email: string): User | null {
  const inv = store.all<Invitation>('Invitation').find((i) => i.email.toLowerCase() === email.toLowerCase() && i.status === 'pending')
  if (!inv) return null
  const now = new Date().toISOString()
  const user: User = { id: newId(), email: inv.email, full_name: inv.email.split('@')[0], app_role: inv.app_role, active: true, activated_at: now, created_date: now, password: 'statfoot' }
  store.replace('User', [...store.all('User'), user])
  store.replace('Invitation', store.all<Invitation>('Invitation').map((i) => (i.id === inv.id ? { ...i, status: 'accepted', accepted_at: now } : i)))
  return user
}

export const auth = {
  async me(): Promise<User | null> {
    const u = getSessionUser()
    if (!u) return null
    const { password: _pw, ...safe } = u
    void _pw
    return safe as User
  },
  async login(email: string, password: string): Promise<User> {
    let u = store.all<User>('User').find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
    if (!u) {
      // première connexion d'un invité : le mot de passe saisi devient le sien
      u = acceptInvitation(email.trim()) ?? undefined
      if (u) {
        store.replace('User', store.all<User>('User').map((x) => (x.id === u!.id ? { ...x, password } : x)))
        u = { ...u, password }
      }
    }
    if (!u) throw new Error("Ce compte n'existe pas. Les comptes sont créés uniquement par un administrateur.")
    if (u.active === false) throw new Error('Ce compte est désactivé.')
    if (u.password !== password) throw new Error('Mot de passe incorrect.')
    touchLogin(u)
    return u
  },
  /** Simulation de "Continuer avec Google" : on demande juste l'email, soumis à la liste blanche. */
  async loginWithGoogle(email: string): Promise<User> {
    const u = store.all<User>('User').find((x) => x.email.toLowerCase() === email.trim().toLowerCase()) ?? acceptInvitation(email.trim())
    if (!u) throw new Error("Email non autorisé : demandez une invitation à un administrateur.")
    if (u.active === false) throw new Error('Ce compte est désactivé.')
    touchLogin(u)
    return u
  },
  async logout() { setSession(null) },
}

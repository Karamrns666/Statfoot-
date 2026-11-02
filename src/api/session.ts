import { store } from './localStore'
import type { AdminUser } from '@/types/entities'

export function getSessionUser(): AdminUser | null {
  const id = store.getFlag('session')
  if (!id) return null
  return store.all<AdminUser>('AdminUser').find((u) => u.id === id) ?? null
}
export function setSession(userId: string | null) { store.setFlag('session', userId) }

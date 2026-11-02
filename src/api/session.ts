import { store } from './localStore'
import type { User } from '@/types/entities'

export function getSessionUser(): User | null {
  const id = store.getFlag('session')
  if (!id) return null
  return store.all<User>('User').find((u) => u.id === id) ?? null
}
export function setSession(userId: string | null) { store.setFlag('session', userId) }

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { base44 } from '@/api/base44Client'
import type { User } from '@/types/entities'
import { useData } from './useData'

interface AuthCtx { user: User | null; loading: boolean; login: (e: string, p: string) => Promise<void>; loginWithGoogle: (e: string) => Promise<void>; logout: () => Promise<void> }
const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { db, ready } = useData()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => { setUser(await base44.auth.me()); setLoading(false) }, [])
  useEffect(() => { if (ready) refresh() }, [ready, db.User, refresh])
  const value: AuthCtx = {
    user, loading,
    login: async (e, p) => { await base44.auth.login(e, p); await refresh() },
    loginWithGoogle: async (e) => { await base44.auth.loginWithGoogle(e); await refresh() },
    logout: async () => { await base44.auth.logout(); setUser(null) },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth hors AuthProvider')
  return v
}

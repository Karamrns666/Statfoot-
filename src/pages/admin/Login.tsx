import { useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LogIn, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/layout/Logo'

export default function Login() {
  const { user, login, loginWithGoogle } = useAuth()
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={sp.get('next') ?? '/admin'} replace />
  const go = async (fn: () => Promise<void>) => { setBusy(true); setErr(''); try { await fn(); nav(sp.get('next') ?? '/admin') } catch (e) { setErr((e as Error).message) } finally { setBusy(false) } }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="mb-6 flex justify-center"><Logo subtitle="Administration" /></div>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); go(() => login(email, pw)) }}>
          <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></div>
          <div className="space-y-1.5"><Label htmlFor="pw">Mot de passe</Label><Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" /></div>
          {err && <p className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{err}</p>}
          <Button className="w-full" size="lg" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <LogIn />}Se connecter</Button>
        </form>
        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-white/10" />ou<span className="h-px flex-1 bg-white/10" /></div>
        <Button variant="outline" className="w-full" onClick={() => go(() => loginWithGoogle(email))} disabled={busy}>
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="#fff" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" /><path fill="#bbb" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" /></svg>
          Continuer avec Google
        </Button>
        <p className="mt-6 text-center text-xs text-muted-foreground">Accès réservé à l’organisation. Les comptes sont créés par un administrateur.</p>
      </div>
    </div>
  )
}

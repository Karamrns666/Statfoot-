// Comptes admin (Supabase) : changement de mot de passe obligatoire, mot de passe oublié, réinitialisation par e-mail.
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { KeyRound, Loader2, MailCheck } from 'lucide-react'
import { cloudAuth, cloudEnabled } from '@/api/cloud'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/layout/Logo'

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
        <div className="mb-5 flex justify-center"><Logo subtitle="Administration" /></div>
        <h1 className="title-caps mb-4 text-center text-2xl">{title}</h1>
        {children}
      </div>
    </div>
  )
}

/** Règles : 10 caractères minimum, au moins une lettre et un chiffre. */
export const passwordProblem = (pw: string, confirm: string) =>
  pw.length < 10 ? 'Au moins 10 caractères.' : !/[A-Za-z]/.test(pw) || !/\d/.test(pw) ? 'Au moins une lettre et un chiffre.' : pw !== confirm ? 'Les deux mots de passe ne correspondent pas.' : ''

function NewPasswordForm({ onDone, intro }: { onDone: () => void; intro: string }) {
  const [pw, setPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const problem = passwordProblem(pw, confirm)
  return (
    <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (problem) { setErr(problem); return } setBusy(true); setErr(''); try { await cloudAuth.changePassword(pw); onDone() } catch (x) { setErr((x as Error).message) } finally { setBusy(false) } }}>
      <p className="text-sm text-muted-foreground">{intro}</p>
      <div className="space-y-1.5"><Label htmlFor="np">Nouveau mot de passe</Label><Input id="np" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <div className="space-y-1.5"><Label htmlFor="np2">Confirmer</Label><Input id="np2" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
      <p className="text-xs text-muted-foreground">10 caractères minimum, avec au moins une lettre et un chiffre.</p>
      {err && <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{err}</p>}
      <Button className="w-full" size="lg" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <KeyRound />}Enregistrer le mot de passe</Button>
    </form>
  )
}

/** /admin/mot-de-passe — obligatoire à la première connexion, ou volontaire. */
export function ChangePassword() {
  const { user, loading } = useAuth()
  const nav = useNavigate()
  if (loading) return null
  if (!user) return <Navigate to="/admin/login" replace />
  if (!cloudEnabled) return <Navigate to="/admin" replace />
  return (
    <Shell title={user.must_change_password ? 'Choisissez votre mot de passe' : 'Changer de mot de passe'}>
      <NewPasswordForm intro={user.must_change_password ? `Bienvenue ${user.email}. Pour sécuriser votre compte, remplacez le mot de passe initial avant d’accéder à l’administration.` : 'Saisissez votre nouveau mot de passe.'} onDone={() => nav('/admin', { replace: true })} />
    </Shell>
  )
}

/** /admin/mot-de-passe-oublie */
export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (!cloudEnabled) return <Navigate to="/admin/login" replace />
  return (
    <Shell title="Mot de passe oublié">
      {sent ? (
        <div className="space-y-3 text-center text-sm"><MailCheck className="mx-auto size-10 text-neon" /><p>Si un compte administrateur existe pour <b>{email}</b>, un e-mail avec un lien de réinitialisation vient d’être envoyé. Le lien est valable une heure.</p><Link to="/admin/login" className="text-neon">Retour à la connexion</Link></div>
      ) : (
        <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await cloudAuth.recover(email) ; setSent(true) } catch (x) { const st = (x as { status?: number }).status; setErr(st === 429 ? 'Trop de demandes : réessayez dans quelques minutes.' : (x as Error).message) } finally { setBusy(false) } }}>
          <p className="text-sm text-muted-foreground">Saisissez l’e-mail de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
          <div className="space-y-1.5"><Label htmlFor="fp">E-mail</Label><Input id="fp" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {err && <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{err}</p>}
          <Button className="w-full" size="lg" disabled={busy || !email.includes('@')}>{busy ? <Loader2 className="animate-spin" /> : <MailCheck />}Envoyer le lien</Button>
          <p className="text-center text-sm"><Link to="/admin/login" className="text-muted-foreground hover:text-white">Retour à la connexion</Link></p>
        </form>
      )}
    </Shell>
  )
}

/** /admin/reinitialisation — page ouverte depuis le lien de l'e-mail (réinitialisation ou invitation). */
export function ResetPassword() {
  const nav = useNavigate()
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [err, setErr] = useState('')
  useEffect(() => {
    cloudAuth.fromEmailLink(location.hash)
      .then((ok) => { history.replaceState(null, '', location.pathname); if (ok) setState('ready'); else { setErr('Lien invalide ou expiré. Refaites une demande « Mot de passe oublié ».'); setState('error') } })
      .catch((e) => { setErr((e as Error).message); setState('error') })
  }, [])
  if (!cloudEnabled) return <Navigate to="/admin/login" replace />
  return (
    <Shell title="Nouveau mot de passe">
      {state === 'loading' && <Loader2 className="mx-auto animate-spin" />}
      {state === 'error' && <div className="space-y-3 text-center text-sm"><p className="rounded-lg bg-red-500/10 p-2 text-red-300">{err}</p><Link to="/admin/mot-de-passe-oublie" className="text-neon">Mot de passe oublié</Link></div>}
      {state === 'ready' && <NewPasswordForm intro="Choisissez votre nouveau mot de passe." onDone={() => nav('/admin', { replace: true })} />}
    </Shell>
  )
}

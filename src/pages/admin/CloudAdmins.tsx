// « Administrateurs » avec Supabase (réservé aux super-admins) : ajouter / retirer un admin, changer son rôle,
// désactiver, réinitialiser son mot de passe (e-mail). Les opérations passent par /api/admin-users, qui revérifie
// côté serveur que l'appelant est super-admin, et sont inscrites au journal.
import { useEffect, useState } from 'react'
import { CloudUpload, KeyRound, Loader2, RefreshCw, Send, Trash2 } from 'lucide-react'
import { adminApi, type Profile } from '@/api/cloud'
import { cloudState, initializeCloud, onCloudState } from '@/api/cloudSync'
import { useAuth } from '@/hooks/useAuth'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import { ROLE_LABEL } from '@/lib/permissions'
import { fmtAgo } from '@/lib/format'

const sel = 'h-9 rounded-lg border border-input bg-night-950/40 px-2 text-sm'

function useCloudState() {
  const [, set] = useState(0)
  useEffect(() => onCloudState(() => set((x) => x + 1)), [])
  return cloudState
}

export default function CloudAdmins() {
  const { user } = useAuth()
  const cs = useCloudState()
  const [list, setList] = useState<Profile[] | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState('')
  const [form, setForm] = useState({ email: '', full_name: '', role: 'operator' })
  const [init, setInit] = useState<string>('')
  const load = () => adminApi<{ admins: Profile[] }>('list').then((d) => { setList(d.admins); setErr('') }).catch((e) => setErr((e as Error).message))
  useEffect(() => { load() }, [])
  const act = async (id: string, action: string, body: Record<string, unknown>, ok: string) => {
    setBusy(id)
    try { const r = await adminApi<{ message?: string }>(action, body); toast.success(r.message ?? ok); await load() } catch (e) { toast.error((e as Error).message) } finally { setBusy('') }
  }
  return (
    <AdminPage title="Administrateurs" subtitle="Comptes Supabase : mots de passe hachés, réinitialisation par e-mail, journal des actions.">
      <div className="space-y-4">
        {!cs.initialized && !!cs.lastSync && (
          <Card className="border-amber-300/40">
            <CardHeader><CardTitle className="flex items-center gap-2"><CloudUpload className="size-5 text-amber-300" />Base Supabase vide</CardTitle><CardDescription>Première mise en service : envoyez les données de ce navigateur (saisons, équipes, matchs, tirage officiel…) vers Supabase. Ensuite, tous les admins et tous les visiteurs voient les mêmes données.</CardDescription></CardHeader>
            <CardContent><Button disabled={!!init} onClick={async () => { if (!confirm('Envoyer les données de ce navigateur vers Supabase ? À faire une seule fois, depuis le navigateur qui a les bonnes données.')) return; setInit('0 %'); try { const n = await initializeCloud((d, t) => setInit(`${Math.round((d / t) * 100)} %`)); toast.success(`${n} enregistrements envoyés — base initialisée`) } catch (e) { toast.error((e as Error).message) } finally { setInit('') } }}>{init ? <><Loader2 className="animate-spin" />{init}</> : <><CloudUpload />Initialiser la base</>}</Button></CardContent>
          </Card>
        )}
        <p className="text-xs text-muted-foreground">Synchronisation : {cs.error ? <span className="text-red-300">erreur — {cs.error}</span> : cs.pending ? `${cs.pending} modification(s) en cours d’envoi` : cs.lastSync ? `à jour (${fmtAgo(cs.lastSync)})` : '—'}</p>

        <Card>
          <CardHeader><CardTitle>Ajouter un administrateur</CardTitle><CardDescription>La personne reçoit un e-mail d’invitation pour choisir son mot de passe.</CardDescription></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-[1fr_1fr_160px_auto] sm:items-end">
            <div><Label htmlFor="ad-email" className="text-xs">E-mail</Label><Input id="ad-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label htmlFor="ad-name" className="text-xs">Nom</Label><Input id="ad-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label htmlFor="ad-role" className="text-xs">Rôle</Label><select id="ad-role" className={`${sel} w-full`} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
            <Button disabled={!form.email.includes('@') || busy === 'add'} onClick={async () => { await act('add', 'add', form, `Invitation envoyée à ${form.email}`); setForm({ email: '', full_name: '', role: 'operator' }) }}><Send />Inviter</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between"><CardTitle>Comptes ({list?.length ?? '…'})</CardTitle><Button size="sm" variant="ghost" onClick={load}><RefreshCw />Actualiser</Button></CardHeader>
          <CardContent className="overflow-x-auto">
            {err && <p className="mb-2 rounded-lg bg-red-500/10 p-2 text-sm text-red-300">{err}</p>}
            {!list ? <Loader2 className="animate-spin" /> : (
              <table className="w-full min-w-[760px] text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground"><th className="py-1.5">Compte</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th><th className="text-right">Actions</th></tr></thead>
                <tbody>{list.map((p) => {
                  const me = p.id === user?.id
                  return (
                    <tr key={p.id} className="border-t border-white/5">
                      <td className="py-2"><div className="font-semibold">{p.full_name || p.email}</div><div className="text-xs text-muted-foreground">{p.email}{me ? ' · vous' : ''}</div></td>
                      <td><select aria-label={`Rôle de ${p.email}`} className={sel} value={p.role} disabled={busy === p.id} onChange={(e) => act(p.id, 'role', { id: p.id, role: e.target.value }, 'Rôle mis à jour')}>{Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></td>
                      <td className="space-x-1">
                        <Badge variant={p.status === 'active' ? 'success' : 'outline'}>{p.status === 'active' ? 'Actif' : 'Désactivé'}</Badge>
                        {p.must_change_password && <Badge variant="warning">Mot de passe à changer</Badge>}
                      </td>
                      <td className="text-xs text-muted-foreground">{p.last_login ? fmtAgo(p.last_login) : 'Jamais'}</td>
                      <td className="text-right"><span className="inline-flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="ghost" disabled={busy === p.id} onClick={() => act(p.id, 'reset', { id: p.id }, 'E-mail de réinitialisation envoyé')}><KeyRound />Réinitialiser</Button>
                        {!me && <Button size="sm" variant="ghost" disabled={busy === p.id} onClick={() => act(p.id, 'status', { id: p.id, status: p.status === 'active' ? 'disabled' : 'active' }, p.status === 'active' ? 'Compte désactivé' : 'Compte réactivé')}>{p.status === 'active' ? 'Désactiver' : 'Réactiver'}</Button>}
                        {!me && <Button size="sm" variant="ghost" className="text-red-300" disabled={busy === p.id} onClick={() => { if (confirm(`Retirer définitivement ${p.email} ?`)) act(p.id, 'remove', { id: p.id }, 'Administrateur retiré') }}><Trash2 />Retirer</Button>}
                      </span></td>
                    </tr>
                  )
                })}</tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  )
}

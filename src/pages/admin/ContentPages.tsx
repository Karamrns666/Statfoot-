import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Link2, RotateCcw, Save, Send } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { resetLeagueData } from '@/api/seed'
import { useData, useLookup } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useAdminScope } from '@/hooks/useAdminScope'
import { AdminPage } from '@/components/admin/AdminLayout'
import { EntityCrud, EntityForm, type Field } from '@/components/admin/EntityCrud'
import { FilterSelect } from '@/components/league/FilterSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input, Textarea } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { fmtAgo, fmtDateTime } from '@/lib/format'
import { ROLE_LABEL } from '@/lib/permissions'
import type { Settings, Tiebreaker } from '@/types/entities'

// ---------------------------------------------------------------------------
export function MediaAdmin() {
  const { db } = useData()
  const L = useLookup()
  const { seasonId } = useAdminScope()
  const [drive, setDrive] = useState('')
  const rounds = [...new Set(db.Match.filter((m) => m.season_id === seasonId).map((m) => m.round!))].sort((a, b) => a - b)
  const fields: Field[] = [
    { key: 'title', label: 'Titre', required: true }, { key: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'photo', label: 'Photo' }, { value: 'video', label: 'Vidéo' }, { value: 'article', label: 'Article' }] },
    { key: 'url', label: 'Fichier ou URL', type: 'image', full: true, required: true }, { key: 'thumbnail_url', label: 'Miniature', type: 'image', full: true },
    { key: 'round', label: 'Journée', type: 'select', options: rounds.map((r) => ({ value: String(r), label: `Journée ${r}` })) },
    { key: 'match_id', label: 'Match lié', type: 'select', options: db.Match.filter((m) => m.season_id === seasonId && m.status === 'finished').map((m) => ({ value: m.id, label: `J${m.round} ${L.team.get(m.home_team_id)?.short_name}-${L.team.get(m.away_team_id)?.short_name}` })) },
    { key: 'team_ids', label: 'Équipes (tags)', type: 'multiselect', options: db.Team.map((t) => ({ value: t.id, label: t.short_name })) },
    { key: 'published', label: 'Publié', type: 'boolean' }, { key: 'body', label: 'Contenu (article, markdown)', type: 'textarea' },
  ]
  const importDrive = async () => {
    const links = drive.split(/\s+/).filter((l) => l.includes('drive.google.com'))
    for (const l of links) {
      const id = l.match(/\/d\/([^/]+)/)?.[1] ?? new URL(l).searchParams.get('id')
      if (!id) continue
      await base44.entities.Media.create({ title: `Import Drive ${id.slice(0, 6)}`, type: 'photo', url: `https://drive.google.com/thumbnail?id=${id}&sz=w1600`, source: 'google_drive', season_id: seasonId, published: false })
    }
    toast.success(`${links.length} lien(s) importé(s) en brouillon`); setDrive('')
  }
  return (
    <AdminPage title="Médiathèque" subtitle="Photos, vidéos, articles — tags par équipe et par journée">
      <Card className="mb-4"><CardContent className="flex flex-col gap-2 pt-4 sm:flex-row">
        <Input placeholder="Coller des liens de partage Google Drive (un par ligne ou séparés par des espaces)" value={drive} onChange={(e) => setDrive(e.target.value)} />
        <Button variant="outline" onClick={importDrive} disabled={!drive}><Link2 />Importer depuis Google Drive</Button>
      </CardContent></Card>
      <EntityCrud entity="Media" title="Média" fields={fields} filter={(m) => !m.season_id || m.season_id === seasonId}
        transform={(v) => ({ ...v, round: v.round ? +(v.round as string) : undefined, season_id: v.season_id ?? seasonId, source: v.source ?? 'upload' })}
        defaults={() => ({ type: 'photo', published: true })} searchText={(m) => m.title}
        sort={(a, b) => (b.created_date ?? '').localeCompare(a.created_date ?? '')}
        columns={[
          { label: 'Aperçu', render: (m) => <img src={m.thumbnail_url ?? m.url} alt="" className="h-10 w-16 rounded object-cover" /> },
          { label: 'Titre', render: (m) => <span className="font-semibold">{m.title}</span> },
          { label: 'Tags', render: (m) => <span className="flex flex-wrap gap-1">{m.round && <Badge>J{m.round}</Badge>}{m.team_ids?.map((t) => <Badge key={t} variant="secondary">{L.team.get(t)?.short_name}</Badge>)}</span>, className: 'hidden md:table-cell' },
          { label: 'Source', render: (m) => m.source === 'google_drive' ? 'Google Drive' : m.source === 'generated' ? 'Visuel généré' : 'Import', className: 'hidden sm:table-cell' },
          { label: 'Statut', render: (m) => <button onClick={() => base44.entities.Media.update(m.id, { published: !m.published })}><Badge variant={m.published ? 'success' : 'outline'}>{m.published ? 'Publié' : 'Brouillon'}</Badge></button> },
        ]} />
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
export function RulesEditor() {
  const { db } = useData()
  const page = db.Page.find((p) => p.slug === 'reglement')
  const [title, setTitle] = useState(page?.title ?? 'Règlement')
  const [content, setContent] = useState(page?.content ?? '')
  const save = async () => {
    if (page) await base44.entities.Page.update(page.id, { title, content, published: true })
    else await base44.entities.Page.create({ slug: 'reglement', title, content, published: true })
    toast.success('Règlement publié')
  }
  return (
    <AdminPage title="Règlement" subtitle="Page publique éditable (markdown)" actions={<Button onClick={save}><Save />Publier</Button>}>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mb-3" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[60vh] font-mono text-xs" />
        <Card><CardContent className="markdown pt-4"><ReactMarkdown>{content}</ReactMarkdown></CardContent></Card>
      </div>
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
const TB_LABEL: Record<Tiebreaker, string> = { points: 'Points', goal_diff: 'Différence de buts', goals_for: 'Buts marqués', head_to_head: 'Confrontation directe', fair_play: 'Fair-play', wins: 'Victoires' }
export function SettingsPage() {
  const { settings } = useData()
  const [v, setV] = useState<Record<string, unknown>>({ ...settings, ...Object.fromEntries(Object.entries(settings.socials ?? {}).map(([k, x]) => [`social_${k}`, x])) })
  const [tb, setTb] = useState<Tiebreaker[]>(settings.tiebreakers ?? ['points', 'goal_diff', 'goals_for', 'head_to_head', 'fair_play'])
  const fields: Field[] = [
    { key: 'league_name', label: 'Nom de la ligue' }, { key: 'short_name', label: 'Nom court' }, { key: 'tagline', label: 'Accroche', full: true },
    { key: 'organizer', label: 'Organisateur' }, { key: 'logo_url', label: 'Logo', type: 'image', full: true },
    { key: 'contact_email', label: 'Email de contact', type: 'email' }, { key: 'contact_phone', label: 'Téléphone / WhatsApp' }, { key: 'address', label: 'Adresse', full: true },
    { key: 'website', label: 'Site de l’organisateur' },
    { key: 'social_instagram', label: 'Instagram MBL' }, { key: 'social_organizer_instagram', label: 'Instagram Ardentia' }, { key: 'social_linkedin', label: 'LinkedIn Ardentia' },
    { key: 'social_facebook', label: 'Facebook (facultatif)' }, { key: 'social_youtube', label: 'YouTube (facultatif)' },
    { key: 'points_win', label: 'Points victoire', type: 'number' }, { key: 'points_draw', label: 'Points nul', type: 'number' }, { key: 'points_loss', label: 'Points défaite', type: 'number' },
    { key: 'motm_vote_minutes_after', label: 'Fermeture du vote HdM (min après la fin)', type: 'number' }, { key: 'young_max_age', label: 'Âge max « meilleur jeune »', type: 'number' },
  ]
  const save = async () => {
    const socials = { instagram: v.social_instagram, organizer_instagram: v.social_organizer_instagram, facebook: v.social_facebook, linkedin: v.social_linkedin, youtube: v.social_youtube } as Settings['socials']
    const clean = Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('social_') && !['id', 'created_date', 'updated_date'].includes(k)))
    await base44.entities.Settings.update(settings.id, { ...clean, socials, tiebreakers: tb })
    toast.success('Paramètres enregistrés — classements recalculés')
  }
  const move = (i: number, d: number) => { const x = [...tb]; const j = i + d; if (j < 0 || j >= x.length) return; [x[i], x[j]] = [x[j], x[i]]; setTb(x) }
  return (
    <AdminPage title="Paramètres" subtitle="Infos officielles (par défaut : src/config/league.ts), réseaux, points de classement. Un champ vide reprend la valeur officielle." actions={<Button onClick={save}><Save />Enregistrer</Button>}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="pt-5"><EntityForm fields={fields} value={v} onChange={setV} /></CardContent></Card>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Départage du classement</CardTitle></CardHeader><CardContent className="space-y-1.5">
            {tb.map((t, i) => <div key={t} className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"><span className="num w-5 text-neon">{i + 1}</span><span className="flex-1">{TB_LABEL[t]}</span><button className="px-1 cursor-pointer" onClick={() => move(i, -1)}>▲</button><button className="px-1 cursor-pointer" onClick={() => move(i, 1)}>▼</button></div>)}
            {(Object.keys(TB_LABEL) as Tiebreaker[]).filter((t) => !tb.includes(t)).map((t) => <button key={t} className="block text-xs text-muted-foreground hover:text-neon cursor-pointer" onClick={() => setTb([...tb, t])}>+ {TB_LABEL[t]}</button>)}
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Données locales</CardTitle></CardHeader><CardContent>
            <p className="mb-3 text-xs text-muted-foreground">Recharge les données officielles (archive 2025-2026, équipes 2026-2027) et efface les modifications faites dans ce navigateur.</p>
            <Button variant="destructive" onClick={() => { if (confirm('Effacer les modifications locales et recharger les données officielles ?')) { resetLeagueData(); location.reload() } }}><RotateCcw />Recharger les données officielles</Button>
          </CardContent></Card>
        </div>
      </div>
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
export function AdminsPage() {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('operator')
  return (
    <AdminPage title="Administrateurs" subtitle="Liste blanche, rôles et invitations">
      <Card className="mb-4"><CardContent className="flex flex-col gap-2 pt-4 sm:flex-row">
        <Input type="email" placeholder="email@entreprise.ma" value={email} onChange={(e) => setEmail(e.target.value)} />
        <FilterSelect value={role} onChange={(r) => setRole(r || 'operator')} allLabel={null} options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))} />
        <Button disabled={!email.includes('@')} onClick={async () => { await base44.entities.AdminUser.create({ email, role: role as never, status: 'invited', invited_by: user?.email }); toast.success(`Invitation envoyée à ${email} (simulée en local)`); setEmail('') }}><Send />Inviter</Button>
      </CardContent></Card>
      <EntityCrud entity="AdminUser" title="Administrateur" sort={(a, b) => a.email.localeCompare(b.email)} searchText={(u) => `${u.email} ${u.full_name}`}
        fields={[{ key: 'email', label: 'Email', type: 'email', required: true }, { key: 'full_name', label: 'Nom' }, { key: 'role', label: 'Rôle', type: 'select', required: true, options: Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label })) }, { key: 'status', label: 'Statut', type: 'select', options: [{ value: 'invited', label: 'Invité' }, { value: 'active', label: 'Actif' }, { value: 'disabled', label: 'Désactivé' }] }]}
        transform={(v) => { const { password: _p, ...rest } = v; void _p; return rest }}
        defaults={() => ({ role: 'operator', status: 'invited', invited_by: user?.email })}
        columns={[
          { label: 'Utilisateur', render: (u) => <div><div className="font-semibold">{u.full_name ?? '—'}</div><div className="text-xs text-muted-foreground">{u.email}</div></div> },
          { label: 'Rôle', render: (u) => <Badge variant={u.role === 'super_admin' ? 'gold' : 'secondary'}>{ROLE_LABEL[u.role]}</Badge> },
          { label: 'Statut', render: (u) => <Badge variant={u.status === 'active' ? 'success' : u.status === 'invited' ? 'warning' : 'outline'}>{u.status === 'active' ? 'Actif' : u.status === 'invited' ? 'Invitation en attente' : 'Désactivé'}</Badge> },
          { label: 'Invité par', render: (u) => u.invited_by ?? '—', className: 'hidden md:table-cell' },
          { label: 'Activation', render: (u) => u.activated_at ? fmtDateTime(u.activated_at) : '—', className: 'hidden lg:table-cell' },
          { label: 'Dernière connexion', render: (u) => u.last_login ? fmtAgo(u.last_login) : 'Jamais' },
        ]} />
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
export function AuditPage() {
  const { db } = useData()
  const [entity, setEntity] = useState('')
  const [q, setQ] = useState('')
  const rows = db.AuditLog.filter((a) => (!entity || a.entity === entity) && (!q || `${a.entity_label} ${a.author_email} ${a.action}`.toLowerCase().includes(q.toLowerCase()))).slice(0, 300)
  const ACTION: Record<string, string> = { create: 'Création', update: 'Modification', delete: 'Suppression', bulk_create: 'Création en masse', login: 'Connexion' }
  return (
    <AdminPage title="Journal d'activité" subtitle="Chaque modification est tracée automatiquement">
      <div className="mb-3 flex flex-wrap gap-2">
        <Input className="h-9 sm:w-64" placeholder="Rechercher…" value={q} onChange={(e) => setQ(e.target.value)} />
        <FilterSelect value={entity} onChange={setEntity} allLabel="Tous éléments" options={[...new Set(db.AuditLog.map((a) => a.entity).filter(Boolean))].map((e) => ({ value: e!, label: e! }))} />
      </div>
      <div className="glass rounded-2xl p-2">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Action</TableHead><TableHead>Élément</TableHead><TableHead>Détails</TableHead><TableHead>Auteur</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="text-xs text-muted-foreground">{fmtDateTime(a.created_date)}</TableCell>
                <TableCell><Badge variant={a.action === 'delete' ? 'destructive' : a.action === 'create' ? 'success' : 'secondary'}>{ACTION[a.action] ?? a.action}</Badge></TableCell>
                <TableCell className="max-w-56 truncate"><span className="text-muted-foreground">{a.entity}</span> · {a.entity_label}</TableCell>
                <TableCell className="max-w-md">{a.details ? <details><summary className="cursor-pointer text-xs text-neon">JSON</summary><pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-black/30 p-2 text-[10px]">{JSON.stringify(a.details, null, 2)}</pre></details> : '—'}</TableCell>
                <TableCell className="text-xs">{a.author_name}<div className="text-muted-foreground">{a.author_email}</div></TableCell>
              </TableRow>
            ))}
            {!rows.length && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Aucune activité — les prochaines modifications apparaîtront ici.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </AdminPage>
  )
}

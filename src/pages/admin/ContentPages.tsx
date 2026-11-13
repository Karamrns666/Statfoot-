import { lazy, Suspense, useState } from 'react'
import { cloudEnabled } from '@/api/cloud'
import { AlertTriangle, Check, Link2, Plus, RotateCcw, Save, Send, Upload } from 'lucide-react'
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
import type { Rulebook, Settings } from '@/types/entities'
import { cn } from '@/lib/utils'
import { REGLEMENT, TIEBREAKERS, TIEBREAK_ART, coherenceWarnings } from '@/lib/reglement'
import { DEFAULT_COMPETITION_NAMES, LEGACY_COMPETITION_NAMES, resolveCompetitionNames } from '@/lib/competitionNames'
import { ArtLink } from '@/components/reglement/ArtLink'

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
  const { user } = useAuth()
  const books = [...db.Rulebook].sort((x, y) => (x.status === 'current' ? -1 : 0) - (y.status === 'current' ? -1 : 0) || y.version.localeCompare(x.version, 'fr', { numeric: true }))
  const [sel, setSel] = useState<string | undefined>(books[0]?.id)
  const book = books.find((b) => b.id === sel) ?? books[0]
  const [draft, setDraft] = useState<Partial<Rulebook> | null>(null)
  const v = draft ?? book ?? {}
  const warnings = coherenceWarnings(v.content ?? '')
  const set = (patch: Partial<Rulebook>) => setDraft({ ...v, ...patch })
  const save = async () => {
    if (!book || !draft) return
    await base44.entities.Rulebook.update(book.id, { title: v.title, date: v.date, season_id: v.season_id || undefined, content: v.content, pdf_url: v.pdf_url, changes: v.changes })
    base44.logActivity('update', 'Rulebook', book, { version: book.version, par: user?.email })
    setDraft(null); toast.success(`Version ${book.version} enregistrée`)
  }
  const makeCurrent = async () => {
    if (!book) return
    for (const b of db.Rulebook) if (b.status === 'current' && b.id !== book.id) await base44.entities.Rulebook.update(b.id, { status: 'archived' })
    await base44.entities.Rulebook.update(book.id, { status: 'current' })
    toast.success(`Version ${book.version} en vigueur sur /reglement`)
  }
  const newVersion = async () => {
    const base = books.find((b) => b.status === 'current') ?? book
    const n = Math.max(0, ...books.map((b) => Number(b.version.replace(/\D/g, '')) || 0)) + 1
    const row = await base44.entities.Rulebook.create({ version: `v${n}`, title: base?.title ?? 'Règlement officiel', date: new Date().toISOString().slice(0, 10), content: base?.content ?? '', status: 'archived', changes: '' })
    setSel(row.id); setDraft(null); toast.info(`Brouillon v${n} créé à partir de la version en vigueur`)
  }
  const uploadPdf = async (f?: File) => {
    if (!f) return
    const { file_url } = await base44.integrations.Core.UploadFile({ file: f, hint: 'reglement' })
    set({ pdf_url: file_url }); toast.info('PDF joint — pensez à enregistrer')
  }
  return (
    <AdminPage title="Règlement" subtitle="Texte officiel Ardentia par version (une saison = une version). Les calculs (points, départage, cartons, durée) restent dans lib/reglement.ts."
      actions={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={newVersion}><Plus />Nouvelle version</Button><Button onClick={save} disabled={!draft}><Save />Enregistrer</Button></div>}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {books.map((b) => (
          <button key={b.id} onClick={() => { setSel(b.id); setDraft(null) }} className={cn('cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-semibold', b.id === book?.id ? 'border-neon bg-neon/15 text-neon' : 'border-white/10 text-muted-foreground hover:text-white')}>
            {b.version}{b.status === 'current' ? ' · en vigueur' : ''}
          </button>
        ))}
        {book && book.status !== 'current' && <Button size="sm" variant="outline" onClick={makeCurrent}><Check />Mettre en vigueur</Button>}
        <a href={`/reglement${book?.status === 'current' ? '' : `?version=${book?.version}`}`} target="_blank" rel="noreferrer" className="ml-auto text-sm text-neon hover:underline">Voir la page publique</a>
      </div>
      {warnings.length > 0 && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
          <p className="mb-1 flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" />Le texte et les constantes de calcul semblent incohérents</p>
          <ul className="list-disc space-y-0.5 pl-5 text-xs">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>
          <p className="mt-1 text-xs text-amber-200/80">Le site calcule toujours avec lib/reglement.ts. Si le règlement a changé, faites aussi mettre à jour ces constantes.</p>
        </div>
      )}
      {book && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-2">
            <Input value={v.title ?? ''} onChange={(e) => set({ title: e.target.value })} aria-label="Titre" />
            <Textarea value={v.content ?? ''} onChange={(e) => set({ content: e.target.value })} className="min-h-[65vh] font-mono text-xs" aria-label="Texte du règlement (Markdown)" />
            <p className="text-xs text-muted-foreground">Markdown : « # ARTICLE 17 — … » pour un article, « ## 17.3 … » pour une section (ancre /reglement#art-17-3), « - » pour une liste, **gras**.</p>
          </div>
          <Card><CardContent className="space-y-3 pt-4 text-sm">
            <label className="block"><span className="text-xs text-muted-foreground">Date de la version</span><Input type="date" value={v.date ?? ''} onChange={(e) => set({ date: e.target.value })} /></label>
            <label className="block"><span className="text-xs text-muted-foreground">Saison rattachée</span>
              <select className="mt-1 h-9 w-full rounded-lg border border-input bg-night-950/40 px-2" value={v.season_id ?? ''} onChange={(e) => set({ season_id: e.target.value })}>
                <option value="">— Aucune —</option>{db.Season.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select></label>
            <label className="block"><span className="text-xs text-muted-foreground">Changements (affiché dans l’historique)</span><Textarea value={v.changes ?? ''} onChange={(e) => set({ changes: e.target.value })} className="min-h-24 text-xs" /></label>
            <div><span className="text-xs text-muted-foreground">PDF</span>
              <div className="mt-1 flex flex-wrap items-center gap-2">{v.pdf_url ? <a href={v.pdf_url} target="_blank" rel="noreferrer" className="text-neon hover:underline">Ouvrir le PDF</a> : <span className="text-muted-foreground">Aucun</span>}
                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-input px-2 text-xs hover:bg-white/5"><Upload className="size-3.5" />Remplacer<input type="file" accept="application/pdf" className="hidden" onChange={(e) => { void uploadPdf(e.target.files?.[0]); e.target.value = '' }} /></label></div></div>
            <p className="text-xs text-muted-foreground">Statut : {book.status === 'current' ? 'en vigueur' : 'archivée (consultable dans l’historique)'}</p>
          </CardContent></Card>
        </div>
      )}
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
export function SettingsPage() {
  const { settings, db } = useData()
  const names = resolveCompetitionNames(settings)
  const [v, setV] = useState<Record<string, unknown>>({ ...settings, ...Object.fromEntries(Object.entries(settings.socials ?? {}).map(([k, x]) => [`social_${k}`, x])), comp_gold: settings.competition_names?.gold ?? '', comp_silver: settings.competition_names?.silver ?? '', comp_league_phase: settings.competition_names?.league_phase ?? '' })
  const fields: Field[] = [
    { key: 'league_name', label: 'Nom de la ligue' }, { key: 'short_name', label: 'Nom court' }, { key: 'tagline', label: 'Accroche', full: true }, { key: 'tagline_ar', label: 'Accroche en arabe', full: true },
    { key: 'organizer', label: 'Organisateur' }, { key: 'logo_url', label: 'Logo', type: 'image', full: true },
    { key: 'contact_email', label: 'Email de contact', type: 'email' }, { key: 'contact_phone', label: 'Téléphone / WhatsApp' }, { key: 'address', label: 'Adresse', full: true },
    { key: 'website', label: 'Site de l’organisateur' },
    { key: 'social_instagram', label: 'Instagram MBL' }, { key: 'social_organizer_instagram', label: 'Instagram Ardentia' }, { key: 'social_linkedin', label: 'LinkedIn Ardentia' },
    { key: 'social_facebook', label: 'Facebook (facultatif)' }, { key: 'social_youtube', label: 'YouTube (facultatif)' },
    { key: 'comp_gold', label: `Nom de la 1re division (par défaut : ${DEFAULT_COMPETITION_NAMES.gold})` }, { key: 'comp_silver', label: `Nom de la 2e division (par défaut : ${DEFAULT_COMPETITION_NAMES.silver})` }, { key: 'comp_league_phase', label: `Nom de la phase de sélection (par défaut : ${DEFAULT_COMPETITION_NAMES.league_phase})` },
    { key: 'motm_vote_minutes_after', label: 'Fermeture du vote HdM (min après la fin)', type: 'number' },
  ]
  const save = async () => {
    const socials = { instagram: v.social_instagram, organizer_instagram: v.social_organizer_instagram, facebook: v.social_facebook, linkedin: v.social_linkedin, youtube: v.social_youtube } as Settings['socials']
    const clean = Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith('social_') && !k.startsWith('comp_') && !['id', 'created_date', 'updated_date'].includes(k)))
    const competition_names = { gold: String(v.comp_gold ?? '').trim() || undefined, silver: String(v.comp_silver ?? '').trim() || undefined, league_phase: String(v.comp_league_phase ?? '').trim() || undefined }
    await base44.entities.Settings.update(settings.id, { ...clean, socials, competition_names })
    // les compétitions et divisions déjà créées suivent le nouveau nom (sauf si l'admin leur a donné un nom à part)
    const next = resolveCompetitionNames({ competition_names })
    for (const ph of ['gold', 'silver'] as const) {
      const olds = [names[ph], ...LEGACY_COMPETITION_NAMES[ph]]
      for (const c of db.Competition) if (c.phase === ph && olds.includes(c.name) && c.name !== next[ph]) await base44.entities.Competition.update(c.id, { name: next[ph] })
      for (const c of db.Competition) if (c.split) { const k = ph === 'gold' ? 'gold_name' : 'silver_name'; if (c.split[k] && olds.includes(c.split[k]!) && c.split[k] !== next[ph]) await base44.entities.Competition.update(c.id, { split: { ...c.split, [k]: next[ph] } }) }
      const d = db.Division.find((x) => x.id === `div_${ph}`); if (d && olds.includes(d.name) && d.name !== next[ph]) await base44.entities.Division.update(d.id, { name: next[ph] })
    }
    toast.success('Paramètres enregistrés — classements recalculés')
  }
  return (
    <AdminPage title="Paramètres" subtitle="Infos officielles (par défaut : src/config/league.ts) et réseaux. Un champ vide reprend la valeur officielle." actions={<Button onClick={save}><Save />Enregistrer</Button>}>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2"><CardContent className="pt-5"><EntityForm fields={fields} value={v} onChange={setV} /></CardContent></Card>
        <div className="space-y-4">
          <Card><CardHeader><CardTitle>Points et départage</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            <p className="text-xs text-muted-foreground">Fixés par le règlement officiel (lib/reglement.ts) — non modifiables ici.</p>
            <p>Victoire <b>{REGLEMENT.points.win}</b> · Nul <b>{REGLEMENT.points.draw}</b> · Défaite <b>{REGLEMENT.points.loss}</b> <ArtLink art={REGLEMENT.points.art} /></p>
            <ol className="space-y-1">{TIEBREAKERS.map((t, i) => <li key={t.key} className="flex gap-2 rounded-lg bg-white/5 px-3 py-1.5"><span className="num w-4 text-neon">{i + 1}</span>{t.label}</li>)}</ol>
            <ArtLink art={TIEBREAK_ART} />
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
const CloudAdmins = lazy(() => import('./CloudAdmins'))
export function AdminsPage() {
  if (cloudEnabled) return <Suspense fallback={null}><CloudAdmins /></Suspense>
  return <LocalAdminsPage />
}
function LocalAdminsPage() {
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

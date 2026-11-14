import { useMemo, useState } from 'react'
import { FileCheck2, Grid2x2, List, ImageUp, Scissors } from 'lucide-react'
import { teamSeasonId } from '@/lib/clubs'
import { SeasonLinkControl } from '@/components/admin/SeasonLinkControl'
import { BulkCutoutDialog } from '@/components/admin/BulkCutoutDialog'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { AdminPage } from '@/components/admin/AdminLayout'
import { EntityCrud, type Field } from '@/components/admin/EntityCrud'
import { FilterSelect } from '@/components/league/FilterSelect'
import { PlayerAvatar, RoleBadge, TeamLogo } from '@/components/league/Identity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { playerName } from '@/lib/format'
import { syncCaptain } from '@/lib/captain'
import { PlayerPhotoField } from '@/components/admin/PlayerPhotoField'
import type { DocStatus, DocType, Player } from '@/types/entities'

const DOCS: { key: DocType; label: string }[] = [{ key: 'id_card', label: 'CIN' }, { key: 'medical', label: 'Certificat médical' }, { key: 'license', label: 'Licence / autorisation entreprise' }]
const DOC_STATUS: Record<DocStatus, { label: string; v: 'success' | 'warning' | 'destructive' | 'outline' }> = { valid: { label: 'Valide', v: 'success' }, pending: { label: 'À vérifier', v: 'warning' }, missing: { label: 'Manquant', v: 'outline' }, refused: { label: 'Refusé', v: 'destructive' } }
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')

export default function PlayersAdmin() {
  const { db } = useData()
  const L = useLookup()
  const { seasonId, competitionId } = useAdminScope()
  const [team, setTeam] = useState('')
  const [docFilter, setDocFilter] = useState('')
  const [view, setView] = useState<'list' | 'grid'>('list')
  const [docs, setDocs] = useState<Player | null>(null)
  const [bulkCut, setBulkCut] = useState(false)
  const comp = db.Competition.find((c) => c.id === competitionId)
  // un joueur est inscrit dans UNE saison : listes et équipes limitées à la saison choisie en haut de l'admin
  const seasonTeams = useMemo(() => db.Team.filter((t) => teamSeasonId(t, db.Competition) === seasonId), [db.Team, db.Competition, seasonId])
  const filter = useMemo(() => (p: Player) => (!team || p.team_id === team) && (!comp || !!comp.team_ids?.includes(p.team_id)) && (!seasonId || !!p.season_ids?.includes(seasonId))
    && (!docFilter || (docFilter === 'ok' ? DOCS.every((d) => p.documents?.[d.key]?.status === 'valid') : DOCS.some((d) => p.documents?.[d.key]?.status !== 'valid'))), [team, comp, seasonId, docFilter])
  const fields: Field[] = [
    { key: 'first_name', label: 'Prénom', required: true }, { key: 'last_name', label: 'Nom', required: true },
    { key: 'number', label: 'Numéro', type: 'number' },
    { key: 'team_id', label: 'Équipe', type: 'select', required: true, options: seasonTeams.map((t) => ({ value: t.id, label: t.name })) },
    // 6 contre 6 : pas de postes, seulement deux rôles
    { key: 'is_goalkeeper', label: 'Gardien', type: 'boolean' },
    { key: 'is_captain', label: 'Capitaine', type: 'boolean', help: 'Un seul capitaine par équipe : l’ancien capitaine perd le brassard.' },
    { key: 'rookie', label: 'Recrue (1re saison en MBL)', type: 'boolean', help: 'Affiche « RECRUE · Nouvelle saison » sur sa carte. Non coché : la mention n’apparaît que pour un joueur sans historique dans une équipe nouvelle.' },
    { key: 'birth_date', label: 'Date de naissance', type: 'date' }, { key: 'photo_url', label: 'Photo du joueur', type: 'custom', full: true, render: (v, patch) => <PlayerPhotoField value={v} patch={patch} /> },
    { key: 'status', label: 'Statut', type: 'select', options: [{ value: 'active', label: 'Actif' }, { value: 'injured', label: 'Blessé' }, { value: 'inactive', label: 'Inactif' }] },
    { key: 'email', label: 'Email du compte joueur (accès à sa carte)', type: 'email', full: true },
  ]
  const docBadge = (p: Player) => {
    const bad = DOCS.filter((d) => p.documents?.[d.key]?.status !== 'valid')
    return bad.length ? <Badge variant={bad.some((d) => p.documents?.[d.key]?.status === 'refused') ? 'destructive' : 'warning'}>{bad.length} à traiter</Badge> : <Badge variant="success">Complet</Badge>
  }
  const bulkPhotos = async (files: FileList | null) => {
    if (!files) return
    let ok = 0
    const unmatched: string[] = []
    const done: { id: string; url: string }[] = []
    for (const f of Array.from(files)) {
      const base = norm(f.name.replace(/\.[^.]+$/, ''))
      const p = db.Player.find((x) => norm(`${x.first_name}${x.last_name}`) === base || norm(`${x.last_name}${x.first_name}`) === base || (team && x.team_id === team && String(x.number) === base))
      if (!p) { unmatched.push(f.name); continue }
      const url = (await base44.integrations.Core.UploadFile({ file: f, maxSize: 1600, hint: 'photo' })).file_url
      await base44.entities.Player.update(p.id, { photo_url: url, photo_cutout_url: undefined, photo_cutout_status: undefined, photo_cutout_source: undefined, photo_cutout_tries: 0 }); ok++
      done.push({ id: p.id, url })
    }
    // le détourage est fait automatiquement en arrière-plan (indicateur « Détourage » en haut de l'admin)
    toast.success(`${ok} photo(s) importée(s)${unmatched.length ? ` · non reconnues : ${unmatched.join(', ')}` : ''}${done.length ? ' — détourage automatique en cours' : ''}`)
  }
  const toolbar = (
    <>
      <Button variant="outline" size="sm" className="h-9" onClick={() => setBulkCut(true)}><Scissors />Détourer toutes les photos existantes</Button>
      <FilterSelect value={team} onChange={setTeam} allLabel="Toutes équipes" options={seasonTeams.map((t) => ({ value: t.id, label: t.name })).sort((a, b) => a.label.localeCompare(b.label))} />
      {team && <RookieBulk teamId={team} />}
      <FilterSelect value={docFilter} onChange={setDocFilter} allLabel="Tous dossiers" options={[{ value: 'ok', label: 'Dossier complet' }, { value: 'ko', label: 'Documents à traiter' }]} />
      <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-input px-3 text-xs hover:bg-white/5" title="Nom de fichier : prenom-nom.jpg (ou numéro.jpg si une équipe est filtrée)"><ImageUp className="size-4" />Photos en masse<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => bulkPhotos(e.target.files)} /></label>
      <div className="flex rounded-lg border border-input p-0.5">{(['list', 'grid'] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`rounded-md p-1.5 cursor-pointer ${view === v ? 'bg-neon/20 text-neon' : 'text-muted-foreground'}`} title={v === 'list' ? 'Liste' : 'Trombinoscope'}>{v === 'list' ? <List className="size-4" /> : <Grid2x2 className="size-4" />}</button>)}</div>
    </>
  )
  return (
    <AdminPage title="Joueurs" subtitle={`${db.Season.find((s) => s.id === seasonId)?.name ?? ''} — effectifs, photos et documents. Un joueur qui revient est lié à sa saison précédente après votre approbation.`}>
      {view === 'list' ? (
        <EntityCrud entity="Player" title="Joueur" dialogClassName="max-w-4xl" fields={fields} filter={filter} toolbar={toolbar} searchText={(p) => `${p.first_name} ${p.last_name} ${L.team.get(p.team_id)?.name}`}
          sort={(a, b) => (L.team.get(a.team_id)?.name ?? '').localeCompare(L.team.get(b.team_id)?.name ?? '') || (a.number ?? 0) - (b.number ?? 0)}
          defaults={() => ({ status: 'active', position: 'FIELD', is_captain: false, team_id: team || undefined, season_ids: [seasonId] })}
          prepare={(v) => ({ ...v, is_goalkeeper: v.position === 'GK' })}
          transform={(v) => { const { is_goalkeeper, ...rest } = v; return { ...rest, position: is_goalkeeper ? 'GK' : 'FIELD', is_captain: !!v.is_captain, season_ids: (v.season_ids as string[] | undefined)?.length ? v.season_ids : [seasonId] } }}
          afterSave={(v) => syncCaptain(v.id as string, v.team_id as string, !!v.is_captain)}
          rowActions={(p) => <Button size="sm" variant="ghost" className="h-8" onClick={() => setDocs(p)}><FileCheck2 />Documents</Button>}
          columns={[
            { label: '#', render: (p) => <span className="num">{p.number}</span> },
            { label: 'Joueur', render: (p) => <span className="flex items-center gap-2"><PlayerAvatar player={p} team={L.team.get(p.team_id)} size={28} /><span className="font-semibold">{playerName(p)}</span></span> },
            { label: 'Rôle', render: (p) => <RoleBadge position={p.position} captain={p.is_captain} /> },
            { label: 'Équipe', render: (p) => <span className="flex items-center gap-1.5"><TeamLogo team={L.team.get(p.team_id)} size={18} />{L.team.get(p.team_id)?.short_name}</span>, className: 'hidden md:table-cell' },
            { label: 'Documents', render: docBadge },
            { label: 'Saison précédente', render: (p) => <SeasonLinkControl kind="player" item={p} />, className: 'hidden md:table-cell' },
            { label: 'Compte', render: (p) => p.email ? <span className="text-xs text-muted-foreground">{p.email}</span> : '—', className: 'hidden lg:table-cell' },
          ]} />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap gap-2">{toolbar}</div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {db.Player.filter(filter).map((p) => (
              <button key={p.id} onClick={() => setDocs(p)} className="glass flex flex-col items-center rounded-xl p-3 text-center cursor-pointer hover:ring-1 hover:ring-neon">
                <PlayerAvatar player={p} team={L.team.get(p.team_id)} size={64} />
                <div className="mt-2 w-full truncate text-xs font-semibold">{p.first_name} {p.last_name}</div>
                <div className="text-[10px] text-muted-foreground">#{p.number} · {L.team.get(p.team_id)?.short_name}</div>
                <div className="mt-1">{docBadge(p)}</div>
              </button>
            ))}
          </div>
        </>
      )}
      {docs && <DocsDialog player={docs} onClose={() => setDocs(null)} />}
      <BulkCutoutDialog open={bulkCut} onOpenChange={setBulkCut} />
    </AdminPage>
  )
}

function DocsDialog({ player, onClose }: { player: Player; onClose: () => void }) {
  const [d, setD] = useState({ ...(player.documents ?? {}) })
  const set = (k: DocType, patch: Partial<NonNullable<typeof d[DocType]>>) => setD({ ...d, [k]: { status: 'missing', ...(d[k] ?? {}), ...patch } })
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Documents · {playerName(player)}</DialogTitle><DialogDescription>Un joueur sans dossier complet est bloqué sur la feuille de compo (dérogation possible par un Super Admin).</DialogDescription></DialogHeader>
        <div className="space-y-3">
          {DOCS.map((doc) => {
            const cur = d[doc.key]
            return (
              <div key={doc.key} className="rounded-xl bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{doc.label}</span>
                  <div className="flex gap-1">{(Object.keys(DOC_STATUS) as DocStatus[]).map((s) => <button key={s} onClick={() => set(doc.key, { status: s })} className={`rounded-full px-2.5 py-1 text-xs cursor-pointer ${cur?.status === s ? 'bg-neon text-white' : 'bg-white/5 text-muted-foreground'}`}>{DOC_STATUS[s].label}</button>)}</div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {cur?.file_url && <a href={cur.file_url} target="_blank" rel="noreferrer" className="text-xs text-neon underline">Voir le fichier</a>}
                  <label className="cursor-pointer rounded-lg border border-input px-2 py-1 text-xs">Déposer un fichier<input type="file" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) set(doc.key, { file_url: (await base44.integrations.Core.UploadFile({ file: f })).file_url, status: 'pending' }) }} /></label>
                  {cur?.status === 'refused' && <Input className="h-8 flex-1" placeholder="Motif du refus" value={cur.reason ?? ''} onChange={(e) => set(doc.key, { reason: e.target.value })} />}
                </div>
              </div>
            )
          })}
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={async () => { await base44.entities.Player.update(player.id, { documents: d }); toast.success('Documents enregistrés'); onClose() }}>Enregistrer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Action groupée : marquer / démarquer « Recrue » tous les joueurs de l'équipe filtrée */
function RookieBulk({ teamId }: { teamId: string }) {
  const { db } = useData()
  const { seasonId } = useAdminScope()
  const [busy, setBusy] = useState(false)
  const list = db.Player.filter((p) => p.team_id === teamId && (!seasonId || p.season_ids?.includes(seasonId)))
  const apply = async (rookie: boolean) => {
    setBusy(true)
    try { for (const p of list) if (p.rookie !== rookie) await base44.entities.Player.update(p.id, { rookie }); toast.success(`${list.length} joueur(s) : ${rookie ? 'recrues' : 'pas recrues'}`) }
    catch (e) { toast.error((e as Error).message) } finally { setBusy(false) }
  }
  return (
    <div className="inline-flex h-9 items-center gap-1 rounded-lg border border-input px-2 text-xs" title="Mention « RECRUE » pour toute l’équipe filtrée">
      Recrues :
      <button disabled={busy} onClick={() => apply(true)} className="cursor-pointer rounded px-1.5 py-0.5 font-semibold hover:bg-white/10">toutes</button>
      <button disabled={busy} onClick={() => apply(false)} className="cursor-pointer rounded px-1.5 py-0.5 font-semibold hover:bg-white/10">aucune</button>
    </div>
  )
}

import { useState } from 'react'
import { Lock, CheckCircle2, AlertTriangle, Images } from 'lucide-react'
import { teamSeasonId } from '@/lib/clubs'
import { OfficialTeamsButton } from '@/components/admin/OfficialTeamsDialog'
import { SeniorityControl } from '@/components/admin/SeniorityControl'
import { SeasonLinkControl } from '@/components/admin/SeasonLinkControl'
import { phaseName } from '@/lib/competitionNames'
import { TeamMediaManager } from '@/components/admin/TeamMediaManager'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAdminScope } from '@/hooks/useAdminScope'
import { AdminPage } from '@/components/admin/AdminLayout'
import { EntityCrud, type Field } from '@/components/admin/EntityCrud'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FilterSelect } from '@/components/league/FilterSelect'
import { TeamLogo } from '@/components/league/Identity'
import { toast } from '@/components/ui/toast'
import { computeAwards, generalStandings } from '@/lib/stats'
import { fmtDate } from '@/lib/format'
import type { Competition, Season } from '@/types/entities'

const STATUS_VARIANT = { draft: 'outline', active: 'success', finished: 'secondary', archived: 'outline', upcoming: 'outline', closed: 'secondary' } as const
const STATUS_FR: Record<string, string> = { draft: 'Brouillon', active: 'Active', finished: 'Terminée', archived: 'Archivée', upcoming: 'À venir', closed: 'Clôturée' }

// ---------------------------------------------------------------------------
export function Seasons() {
  const [closing, setClosing] = useState<Season | null>(null)
  const fields: Field[] = [
    { key: 'name', label: 'Nom', required: true }, { key: 'status', label: 'Statut', type: 'select', options: ['upcoming', 'active', 'closed'].map((v) => ({ value: v, label: STATUS_FR[v] })) },
    { key: 'start_date', label: 'Début', type: 'date', required: true }, { key: 'end_date', label: 'Fin', type: 'date' },
    { key: 'league_phase_rounds', label: 'Journées phase de ligue', type: 'number' }, { key: 'cup_rounds', label: 'Journées Gold/Silver', type: 'number' },
    { key: 'gold_size', label: `Équipes en ${phaseName('gold')}`, type: 'number' }, { key: 'is_active', label: 'Saison active (affichée par défaut)', type: 'boolean' }, { key: 'hidden', label: 'Masquer sur le site public (les stats restent dans l’historique des joueurs)', type: 'boolean' },
  ]
  return (
    <AdminPage title="Saisons" subtitle="Création, modification et clôture de saison">
      <EntityCrud entity="Season" title="Saison" fields={fields} sort={(a, b) => b.start_date.localeCompare(a.start_date)}
        defaults={() => ({ status: 'upcoming', league_phase_rounds: 5, cup_rounds: 5, gold_size: 10 })}
        columns={[
          { label: 'Saison', render: (s) => <span className="font-semibold">{s.name} {s.is_active && <Badge variant="default">Active</Badge>}</span> },
          { label: 'Dates', render: (s) => `${fmtDate(s.start_date, 'd MMM yyyy')} → ${fmtDate(s.end_date, 'd MMM yyyy')}` },
          { label: 'Format', render: (s) => `Ligue J1–J${s.league_phase_rounds ?? 5} · Cups ${s.cup_rounds ?? 5} journées`, className: 'hidden md:table-cell' },
          { label: 'Statut', render: (s) => <Badge variant={STATUS_VARIANT[s.status ?? 'upcoming']}>{STATUS_FR[s.status ?? 'upcoming']}</Badge> },
        ]}
        rowActions={(s) => s.status !== 'closed' ? <Button size="sm" variant="outline" className="h-8" onClick={() => setClosing(s)}><Lock />Clôturer</Button> : null}
      />
      {closing && <CloseSeasonDialog season={closing} onClose={() => setClosing(null)} />}
    </AdminPage>
  )
}

function CloseSeasonDialog({ season, onClose }: { season: Season; onClose: () => void }) {
  const { db, league } = useData()
  const L = useLookup()
  const pending = db.Match.filter((m) => m.season_id === season.id && (m.status === 'scheduled' || m.status === 'live' || m.status === 'postponed'))
  const table = generalStandings(league, season.id)
  const close = async () => {
    const res = computeAwards(league, { seasonId: season.id })
    for (const a of res) await base44.entities.Award.create({ season_id: season.id, scope: 'season', category: a.category, player_id: a.player_id, team_id: a.team_id, value: a.value, snapshot: a.snapshot, not_awarded: a.not_awarded, status: 'generated' })
    await base44.entities.Season.update(season.id, { status: 'closed', is_active: false, closed_at: new Date().toISOString() })
    for (const c of db.Competition.filter((x) => x.season_id === season.id)) await base44.entities.Competition.update(c.id, { status: 'finished' })
    toast.success('Saison clôturée — trophées générés (à vérifier puis publier dans Awards)')
    onClose()
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Clôturer {season.name}</DialogTitle><DialogDescription>Les trophées de fin de saison seront générés au statut « Généré ».</DialogDescription></DialogHeader>
        <div className={`flex items-center gap-2 rounded-xl p-3 text-sm ${pending.length ? 'bg-amber-400/10 text-amber-200' : 'bg-win/10 text-win'}`}>{pending.length ? <AlertTriangle className="size-4" /> : <CheckCircle2 className="size-4" />}{pending.length ? `${pending.length} match(s) non terminé(s) : ils ne compteront pas.` : 'Tous les matchs sont terminés.'}</div>
        <div>
          <div className="mb-2 text-xs font-bold uppercase text-muted-foreground">Classement général final → répartition {phaseName('gold')} / {phaseName('silver')} de la saison suivante</div>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {table.map((r) => <div key={r.team_id} className="flex items-center gap-2 text-sm"><span className="num w-6">{r.rank}</span><TeamLogo team={L.team.get(r.team_id)} size={18} /><span className="flex-1">{L.team.get(r.team_id)?.name}</span><span className="num">{r.points} pts</span><Badge variant={r.rank <= (season.gold_size ?? 10) ? 'gold' : 'secondary'}>{r.rank <= (season.gold_size ?? 10) ? 'Chapeaux 1–3' : 'Chapeaux 3–5'}</Badge></div>)}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Le classement final sert de base aux chapeaux du tirage de la saison suivante (têtes de série).</p>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={close}><Lock />Clôturer la saison</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
export function Competitions() {
  const { db } = useData()
  const { seasonId } = useAdminScope()
  const teamOpts = db.Team.map((t) => ({ value: t.id, label: t.short_name }))
  const fields: Field[] = [
    { key: 'name', label: 'Nom', required: true }, { key: 'season_id', label: 'Saison', type: 'select', required: true, options: db.Season.map((s) => ({ value: s.id, label: s.name })) },
    { key: 'phase', label: 'Phase', type: 'select', required: true, options: [{ value: 'league_phase', label: 'Phase de ligue' }, { value: 'gold', label: phaseName('gold') }, { value: 'silver', label: phaseName('silver') }, { value: 'knockout', label: 'Phase finale' }, { value: 'groups', label: 'Groupes' }, { value: 'other', label: 'Autre' }] },
    { key: 'format', label: 'Format', type: 'select', options: [{ value: 'swiss', label: 'Système suisse' }, { value: 'league', label: 'Championnat' }, { value: 'groups_knockout', label: 'Groupes + éliminatoires' }, { value: 'knockout', label: 'Élimination directe' }, { value: 'other', label: 'Autre' }] },
    { key: 'status', label: 'Statut', type: 'select', options: ['draft', 'active', 'finished', 'archived'].map((v) => ({ value: v, label: STATUS_FR[v] })) },
    { key: 'default_pitch', label: 'Terrain par défaut', placeholder: 'Terrain 1' }, { key: 'half_duration_min', label: 'Durée d’une mi-temps (min)', type: 'number' },
    { key: 'foul_alert_threshold', label: 'Seuil d’alerte fautes / mi-temps', type: 'number' }, { key: 'color', label: 'Couleur', type: 'color' },
    { key: 'logo_url', label: 'Logo', type: 'image', full: true }, { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'team_ids', label: 'Équipes engagées', type: 'multiselect', options: teamOpts },
  ]
  return (
    <AdminPage title="Compétitions" subtitle={`Phase de ligue, ${phaseName('gold')}, ${phaseName('silver')}, phases finales`}>
      <EntityCrud entity="Competition" title="Compétition" fields={fields} filter={(c) => c.season_id === seasonId} sort={(a, b) => (a.order ?? 0) - (b.order ?? 0)}
        defaults={() => ({ season_id: seasonId, status: 'draft', phase: 'other', format: 'league', half_duration_min: 15, foul_alert_threshold: 5 } as Partial<Competition>)}
        columns={[
          { label: 'Compétition', render: (c) => <span className="flex items-center gap-2 font-semibold"><span className="size-2.5 rounded-full" style={{ background: c.color }} />{c.name}</span> },
          { label: 'Format', render: (c) => ({ swiss: 'Système suisse', league: 'Championnat', groups_knockout: 'Groupes + élim.', knockout: 'Élimination directe', other: 'Autre' })[c.format ?? 'other'] },
          { label: 'Équipes', render: (c) => c.team_ids?.length ?? 0, className: 'text-center' },
          { label: 'Matchs', render: (c) => db.Match.filter((m) => m.competition_id === c.id).length, className: 'text-center' },
          { label: 'Statut', render: (c) => <Badge variant={STATUS_VARIANT[c.status ?? 'draft']}>{STATUS_FR[c.status ?? 'draft']}</Badge> },
        ]} />
    </AdminPage>
  )
}

export function Divisions() {
  return (
    <AdminPage title="Séries & Divisions" subtitle="Niveaux de compétition et règles de montée / descente">
      <EntityCrud entity="Division" title="Série" sort={(a, b) => a.level - b.level}
        fields={[{ key: 'name', label: 'Nom', required: true }, { key: 'level', label: 'Niveau (1 = plus haut)', type: 'number', required: true }, { key: 'promotion_count', label: 'Montées', type: 'number' }, { key: 'relegation_count', label: 'Descentes', type: 'number' }, { key: 'color', label: 'Couleur', type: 'color' }]}
        columns={[{ label: 'Niveau', render: (d) => d.level }, { label: 'Série', render: (d) => <span className="font-semibold" style={{ color: d.color }}>{d.name}</span> }, { label: 'Montées', render: (d) => d.promotion_count ?? 0 }, { label: 'Descentes', render: (d) => d.relegation_count ?? 0 }]} />
    </AdminPage>
  )
}

// ---------------------------------------------------------------------------
export function Teams() {
  const { db } = useData()
  const { seasonId, competitionId } = useAdminScope()
  const [div, setDiv] = useState('')
  const [mediaFor, setMediaFor] = useState<string | null>(null)
  const mediaTeam = mediaFor ? db.Team.find((t) => t.id === mediaFor) : undefined
  const comp = db.Competition.find((c) => c.id === competitionId)
  const fields: Field[] = [
    { key: 'name', label: 'Nom', required: true }, { key: 'short_name', label: 'Nom court (3 lettres)', required: true },
    { key: 'company', label: 'Entreprise / marque' }, { key: 'status', label: 'Statut', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'pending', label: 'En attente' }, { value: 'inactive', label: 'Inactive' }] },
    { key: 'logo_url', label: 'Logo équipe', type: 'image', full: true }, { key: 'company_logo_url', label: 'Logo entreprise', type: 'image', full: true },
    { key: 'primary_color', label: 'Couleur principale', type: 'color' }, { key: 'secondary_color', label: 'Couleur secondaire', type: 'color' },
    { key: 'division_id', label: 'Série', type: 'select', options: db.Division.map((d) => ({ value: d.id, label: d.name })) },
    { key: 'group_id', label: 'Groupe', type: 'select', options: db.Group.map((g) => ({ value: g.id, label: g.name })) },
    { key: 'contact_name', label: 'Contact' }, { key: 'contact_email', label: 'Email contact', type: 'email' }, { key: 'contact_phone', label: 'Téléphone' },
  ]
  return (
    <AdminPage title="Équipes" subtitle={`${db.Season.find((s) => s.id === seasonId)?.name ?? ''}${comp ? ` · ${comp.name}` : ''} — une équipe appartient à une seule saison ; son club fait le lien d’une saison à l’autre`}>
      <EntityCrud entity="Team" title="Équipe" fields={fields} sort={(a, b) => a.name.localeCompare(b.name)}
        filter={(t) => teamSeasonId(t, db.Competition) === seasonId && (!comp || !!comp.team_ids?.includes(t.id)) && (!div || t.division_id === div)}
        searchText={(t) => `${t.name} ${t.company} ${t.short_name}`}
        transform={(v) => ({ ...v, short_name: String(v.short_name ?? '').toUpperCase().slice(0, 3) })}
        toolbar={<><FilterSelect value={div} onChange={setDiv} allLabel="Toutes séries" options={db.Division.map((d) => ({ value: d.id, label: d.name }))} /><OfficialTeamsButton seasonId={seasonId} /></>}
        defaults={() => ({ status: 'active', primary_color: '#F85A00', secondary_color: '#04163D', season_id: seasonId })}
        afterSave={async (v) => { const id = v.id as string; const t = db.Team.find((x) => x.id === id); if (!v.club_id && !t?.club_id) { const club = `club_${id}`; await base44.entities.Team.update(id, { club_id: club, season_id: (v.season_id as string) ?? seasonId }); if (!db.Club.some((c) => c.id === club)) await base44.entities.Club.create({ id: club, name: v.name as string, logo_url: v.logo_url as string | undefined } as never) } }}
        rowActions={(t) => <Button size="sm" variant="outline" className="h-8" onClick={() => setMediaFor(t.id)}><Images />Photos & poster{t.media?.length ? ` (${t.media.length})` : ''}</Button>}
        columns={[
          { label: 'Équipe', render: (t) => <span className="flex items-center gap-2"><TeamLogo team={t} size={28} /><span><span className="font-semibold">{t.name}</span><span className="ml-2 text-xs text-muted-foreground">{t.short_name}</span></span></span> },
          { label: 'Entreprise', render: (t) => <span className="flex items-center gap-2">{t.company_logo_url && <img src={t.company_logo_url} className="size-5 rounded" alt="" />}{t.company}</span>, className: 'hidden md:table-cell' },
          { label: 'Couleurs', render: (t) => <span className="flex gap-1"><span className="size-4 rounded" style={{ background: t.primary_color }} /><span className="size-4 rounded ring-1 ring-white/20" style={{ background: t.secondary_color }} /></span>, className: 'hidden sm:table-cell' },
          { label: 'Série', render: (t) => db.Division.find((d) => d.id === t.division_id)?.name ?? '—', className: 'hidden xl:table-cell' },
          { label: 'Saison précédente', render: (t) => <SeasonLinkControl kind="team" item={t} /> },
          { label: 'Ancienneté', render: (t) => <SeniorityControl team={t} />, className: 'hidden sm:table-cell' },
          { label: 'Capitaine', render: (t) => { const c = db.Player.find((p) => p.team_id === t.id && p.is_captain); return c ? `${c.first_name} ${c.last_name}` : <span className="text-muted-foreground">—</span> }, className: 'hidden lg:table-cell' },
          { label: 'Effectif', render: (t) => db.Player.filter((p) => p.team_id === t.id && p.season_ids?.includes(seasonId)).length, className: 'text-center' },
          { label: 'Statut', render: (t) => <Badge variant={t.status === 'active' ? 'success' : 'outline'}>{t.status === 'active' ? 'Active' : t.status === 'pending' ? 'En attente' : 'Inactive'}</Badge> },
        ]} />
      {mediaTeam && <TeamMediaManager team={mediaTeam} open onOpenChange={(o) => !o && setMediaFor(null)} />}
    </AdminPage>
  )
}

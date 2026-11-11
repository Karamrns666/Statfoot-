// Admin — lien entre saisons, toujours validé à la main :
// « Lier à une équipe d'une saison précédente » (ou à un joueur) avec suggestion automatique par nom proche,
// puis « Approuver ». Tant que ce n'est pas approuvé, l'équipe / le joueur est considéré comme nouveau.
import { useMemo, useState } from 'react'
import { Check, Link2, Link2Off, Sparkles, X } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { clubKey, personKey, playerSeasonId, previousSeasons, suggestPlayerLinks, suggestTeamLinks, teamSeasonId } from '@/lib/clubs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FilterSelect } from '@/components/league/FilterSelect'
import { TeamLogo } from '@/components/league/Identity'
import { toast } from '@/components/ui/toast'
import type { Player, Team } from '@/types/entities'

type Props = { kind: 'team'; item: Team } | { kind: 'player'; item: Player }

export function SeasonLinkControl(props: Props) {
  const { db } = useData()
  const [open, setOpen] = useState(false)
  const seasonName = (id?: string) => db.Season.find((s) => s.id === id)?.name.replace(/^Saison /, '') ?? '—'
  const suggestions = useMemo(() => (props.kind === 'team' ? suggestTeamLinks(props.item, db.Team, db.Competition, db.Season) : suggestPlayerLinks(props.item, db.Player, db.Team, db.Season)), [props.kind, props.item, db.Team, db.Competition, db.Season, db.Player])
  const prev = props.item.link ? (props.kind === 'team' ? db.Team.find((t) => t.id === props.item.link!.previous_id) : db.Player.find((p) => p.id === props.item.link!.previous_id)) : undefined
  const name = (x?: Team | Player) => (!x ? '?' : 'name' in x ? x.name : `${x.first_name} ${x.last_name}`)
  const prevSeason = prev ? (props.kind === 'team' ? teamSeasonId(prev as Team, db.Competition) : playerSeasonId(prev as Player)) : undefined
  if (props.item.link && prev) {
    return <button onClick={() => setOpen(true)} className="inline-flex cursor-pointer items-center gap-1 text-xs text-win hover:underline" title={`Approuvé${props.item.link.approved_by ? ` par ${props.item.link.approved_by}` : ''}`}><Link2 className="size-3.5" />{name(prev)} ({seasonName(prevSeason)}){open && <LinkDialog {...props} open={open} onOpenChange={setOpen} />}</button>
  }
  return (
    <>
      <Button size="sm" variant={suggestions.length ? 'outline' : 'ghost'} className="h-8 text-xs" onClick={() => setOpen(true)}>
        {suggestions.length ? <Sparkles className="text-neon" /> : <Link2 />}{suggestions.length ? `${suggestions.length} suggestion${suggestions.length > 1 ? 's' : ''}` : 'Nouvelle'}
      </Button>
      {open && <LinkDialog {...props} open={open} onOpenChange={setOpen} />}
    </>
  )
}

function LinkDialog(props: Props & { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { db } = useData()
  const { user } = useAuth()
  const [manual, setManual] = useState('')
  const isTeam = props.kind === 'team'
  const item = props.item
  const seasonName = (id?: string) => db.Season.find((s) => s.id === id)?.name ?? '—'
  const mySeason = isTeam ? teamSeasonId(item as Team, db.Competition) : playerSeasonId(item as Player)
  const prevSeasons = new Set(previousSeasons(mySeason, db.Season))
  const suggestions = isTeam ? suggestTeamLinks(item as Team, db.Team, db.Competition, db.Season) : suggestPlayerLinks(item as Player, db.Player, db.Team, db.Season)
  const candidates = isTeam
    ? db.Team.filter((t) => t.id !== item.id && prevSeasons.has(teamSeasonId(t, db.Competition) ?? '')).map((t) => ({ value: t.id, label: `${t.name} · ${seasonName(teamSeasonId(t, db.Competition))}` }))
    : db.Player.filter((p) => p.id !== item.id && prevSeasons.has(playerSeasonId(p) ?? '')).map((p) => ({ value: p.id, label: `${p.first_name} ${p.last_name} · ${db.Team.find((t) => t.id === p.team_id)?.short_name ?? ''} · ${seasonName(playerSeasonId(p))}` }))
  const label = isTeam ? (item as Team).name : `${(item as Player).first_name} ${(item as Player).last_name}`

  const approve = async (prevId: string) => {
    const link = { previous_id: prevId, approved_by: user?.email, approved_at: new Date().toISOString() }
    if (isTeam) {
      const prev = db.Team.find((t) => t.id === prevId)!
      const oldClub = clubKey(item as Team), newClub = clubKey(prev)
      for (const t of db.Team.filter((x) => clubKey(x) === oldClub)) await base44.entities.Team.update(t.id, t.id === item.id ? { club_id: newClub, link } : { club_id: newClub })
      if (!db.Team.some((x) => x.id !== item.id && clubKey(x) === oldClub) && db.Club.some((c) => c.id === oldClub)) await base44.entities.Club.delete(oldClub)
      if (!db.Club.some((c) => c.id === newClub)) await base44.entities.Club.create({ id: newClub, name: prev.name, logo_url: prev.logo_url } as never)
      base44.logActivity('link', 'Team', { id: item.id, name: label } as never, { lie_a: `${prev.name} (${seasonName(teamSeasonId(prev, db.Competition))})` })
      toast.success(`${label} rattachée au club de ${prev.name} — historique conservé`)
    } else {
      const prev = db.Player.find((p) => p.id === prevId)!
      const oldPerson = personKey(item as Player), newPerson = personKey(prev)
      for (const p of db.Player.filter((x) => personKey(x) === oldPerson)) await base44.entities.Player.update(p.id, p.id === item.id ? { person_id: newPerson, link } : { person_id: newPerson })
      base44.logActivity('link', 'Player', { id: item.id, name: label } as never, { lie_a: `${prev.first_name} ${prev.last_name} (${seasonName(playerSeasonId(prev))})` })
      toast.success(`${label} rattaché à son historique de ${seasonName(playerSeasonId(prev))}`)
    }
    props.onOpenChange(false)
  }
  const dismiss = async (prevId: string) => {
    const link_dismissed = [...new Set([...(item.link_dismissed ?? []), prevId])]
    if (isTeam) await base44.entities.Team.update(item.id, { link_dismissed }); else await base44.entities.Player.update(item.id, { link_dismissed })
  }
  const unlink = async () => {
    if (isTeam) {
      const club = `club_${item.id}`
      await base44.entities.Team.update(item.id, { club_id: club, link: undefined })
      if (!db.Club.some((c) => c.id === club)) await base44.entities.Club.create({ id: club, name: (item as Team).name, logo_url: (item as Team).logo_url } as never)
    } else await base44.entities.Player.update(item.id, { person_id: undefined, link: undefined })
    base44.logActivity('unlink', isTeam ? 'Team' : 'Player', { id: item.id, name: label } as never, {})
    toast.info(`${label} est de nouveau considéré${isTeam ? 'e' : ''} comme nouvelle${isTeam ? '' : ' recrue'}`)
    props.onOpenChange(false)
  }
  const prevItem = item.link ? (isTeam ? db.Team.find((t) => t.id === item.link!.previous_id) : db.Player.find((p) => p.id === item.link!.previous_id)) : undefined
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-w-lg" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{isTeam ? 'Lier à une équipe d’une saison précédente' : 'Lier à un joueur d’une saison précédente'}</DialogTitle>
          <DialogDescription>{label} · {seasonName(mySeason)}. Le lien conserve l’historique ({isTeam ? 'saisons du club, badge d’ancienneté' : 'statistiques et palmarès des saisons passées'}). Rien n’est lié sans votre approbation.</DialogDescription>
        </DialogHeader>
        {item.link && prevItem ? (
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 rounded-lg bg-win/10 px-3 py-2"><Check className="size-4 text-win" />Lié à <b>{'name' in prevItem ? prevItem.name : `${prevItem.first_name} ${prevItem.last_name}`}</b> — approuvé le {new Date(item.link.approved_at).toLocaleDateString('fr-FR')}{item.link.approved_by ? ` par ${item.link.approved_by}` : ''}</p>
            <Button variant="outline" onClick={unlink}><Link2Off />Délier (considérer comme nouveau)</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggestions (nom proche)</p>
            {suggestions.length ? (
              <ul className="space-y-2">{suggestions.slice(0, 5).map((s) => {
                const x = s.item as Team & Player
                return (
                  <li key={x.id} className="flex items-center gap-2 rounded-xl border border-white/10 p-2 text-sm">
                    {isTeam && <TeamLogo team={x as Team} size={28} />}
                    <span className="min-w-0 flex-1"><span className="block truncate font-semibold">{isTeam ? x.name : `${x.first_name} ${x.last_name}`}</span><span className="text-xs text-muted-foreground">{seasonName(s.seasonId)}{!isTeam ? ` · ${db.Team.find((t) => t.id === x.team_id)?.name ?? ''}` : ''}</span></span>
                    <Badge variant={s.score >= 0.85 ? 'success' : 'outline'}>{Math.round(s.score * 100)} %</Badge>
                    <Button size="sm" onClick={() => approve(x.id)}><Check />Approuver</Button>
                    <Button size="icon" variant="ghost" className="size-8" title="Ce n’est pas la même" aria-label="Écarter la suggestion" onClick={() => dismiss(x.id)}><X /></Button>
                  </li>
                )
              })}</ul>
            ) : <p className="text-sm text-muted-foreground">Aucune suggestion : {isTeam ? 'équipe' : 'joueur'} nouve{isTeam ? 'lle' : 'au'} pour la MBL.</p>}
            <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ou choisir manuellement</p>
            <div className="flex gap-2"><FilterSelect className="flex-1" value={manual} onChange={setManual} allLabel="— Choisir —" options={candidates.sort((a, b) => a.label.localeCompare(b.label))} /><Button disabled={!manual} onClick={() => approve(manual)}><Check />Approuver</Button></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

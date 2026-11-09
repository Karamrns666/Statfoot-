// Feuille de compo d'avant-match (6 contre 6) : présents, 6 titulaires (1 gardien + 5 joueurs de champ) + remplaçants, gardien, capitaine, numéros.
// Blocage automatique : joueurs suspendus et documents non validés (dérogation Super Admin tracée au journal).
import { Fragment, useMemo, useState } from 'react'
import { CheckCircle2, ShieldAlert, Unlock } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TeamLogo, RoleBadge } from '@/components/league/Identity'
import { toast } from '@/components/ui/toast'
import { eligibility } from '@/lib/matchEngine'
import { useSuspendedFor } from '@/hooks/useDiscipline'
import { REGLEMENT } from '@/lib/reglement'
import { ArtLink } from '@/components/reglement/ArtLink'
import { can } from '@/lib/permissions'
import type { Lineup, Match, Player } from '@/types/entities'
import { cn } from '@/lib/utils'
import { PLAYERS_ON_PITCH } from '@/config/rules'

/** Éligibilité à la feuille de match : suspension (règlement, Art. 11.5 / 11.6) et documents (règle MBL). */
export function useEligibility(match: Match) {
  const { db } = useData()
  const suspended = useSuspendedFor(match)
  return useMemo(() => {
    const out = new Map<string, ReturnType<typeof eligibility>>()
    for (const p of db.Player.filter((x) => x.team_id === match.home_team_id || x.team_id === match.away_team_id))
      out.set(p.id, eligibility(p, { suspendedMatchesLeft: suspended.get(p.id)?.remaining ?? 0 }))
    return out
  }, [db.Player, match, suspended])
}

export function LineupEditor({ match, teamId, onValidated, readOnly }: { match: Match; teamId: string; onValidated?: () => void; readOnly?: boolean }) {
  const { db } = useData()
  const { user } = useAuth()
  const max = PLAYERS_ON_PITCH
  const team = db.Team.find((t) => t.id === teamId)
  const existing = db.Lineup.find((l) => l.match_id === match.id && l.team_id === teamId)
  const squad = db.Player.filter((p) => p.team_id === teamId && p.season_ids?.includes(match.season_id) && p.status !== 'inactive').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const elig = useEligibility(match)
  const [lu, setLu] = useState<Partial<Lineup>>(() => existing ?? { present_ids: squad.filter((p) => !elig.get(p.id)?.blocked).slice(0, REGLEMENT.format.maxSheet).map((p) => p.id), starter_ids: [], substitute_ids: [], numbers: {}, waivers: [] })
  const [waiving, setWaiving] = useState<{ id: string; motif: string } | null>(null)
  const waived = (pid: string) => lu.waivers?.some((w) => w.player_id === pid)
  const blocked = (p: Player) => elig.get(p.id)?.blocked && !waived(p.id)
  const present = new Set(lu.present_ids ?? [])
  const starters = new Set(lu.starter_ids ?? [])
  const toggle = (pid: string, field: 'present' | 'starter') => {
    if (readOnly) return
    const p = squad.find((x) => x.id === pid)!
    if (blocked(p) && !(field === 'present' && present.has(pid))) { toast.error(`${elig.get(pid)!.reasons.map((r) => r.label).join(' · ')} — ajout à la feuille de match bloqué`); return }
    if (field === 'present') {
      if (!present.has(pid) && present.size >= REGLEMENT.format.maxSheet) { toast.error(`Feuille de match : ${REGLEMENT.format.maxSheet} joueurs au plus (${REGLEMENT.format.playersOnPitch} + ${REGLEMENT.format.maxSubstitutes} remplaçants, Art. ${REGLEMENT.format.art})`); return }
      const pres = present.has(pid) ? [...present].filter((x) => x !== pid) : [...present, pid]
      setLu({ ...lu, present_ids: pres, starter_ids: (lu.starter_ids ?? []).filter((x) => pres.includes(x)) })
    } else {
      if (!starters.has(pid) && starters.size >= max) { toast.error(`${max} titulaires maximum`); return }
      const st = starters.has(pid) ? [...starters].filter((x) => x !== pid) : [...starters, pid]
      setLu({ ...lu, starter_ids: st, present_ids: [...new Set([...present, pid])], goalkeeper_id: st.includes(lu.goalkeeper_id ?? '') ? lu.goalkeeper_id : st.find((x) => squad.find((p) => p.id === x)?.position === 'GK') })
    }
  }
  const waive = async (p: Player, motif: string) => {
    const reason = elig.get(p.id)!.reasons[0].reason
    setLu({ ...lu, waivers: [...(lu.waivers ?? []), { player_id: p.id, reason, motif, by: user!.email, at: new Date().toISOString() }] })
    base44.logActivity('waiver', 'Lineup', { id: existing?.id ?? match.id, name: `${p.first_name} ${p.last_name}` } as never, { joueur: `${p.first_name} ${p.last_name}`, blocage: elig.get(p.id)!.reasons.map((r) => r.label).join(' · '), motif, match: match.id })
    setWaiving(null)
    toast.info('Ajout forcé (motif enregistré au journal)')
  }
  const validate = async () => {
    const st = lu.starter_ids ?? []
    if (st.length === 0) { toast.error('Sélectionnez les titulaires'); return }
    if (st.length > max) { toast.error(`${max} titulaires maximum (1 gardien + ${max - 1} joueurs de champ)`); return }
    if (!lu.goalkeeper_id || !st.includes(lu.goalkeeper_id)) { toast.error('Désignez le gardien parmi les titulaires'); return }
    const subs = (lu.present_ids ?? []).filter((x) => !st.includes(x))
    if (subs.length > REGLEMENT.format.maxSubstitutes) { toast.error(`${REGLEMENT.format.maxSubstitutes} remplaçants au plus (Art. ${REGLEMENT.format.art})`); return }
    const data = { ...lu, match_id: match.id, team_id: teamId, substitute_ids: subs, validated: true, validated_by: user?.full_name ?? user?.email, validated_at: new Date().toISOString() }
    if (existing) await base44.entities.Lineup.update(existing.id, data); else await base44.entities.Lineup.create(data as Lineup)
    toast.success(`Composition ${team?.short_name} validée`); onValidated?.()
  }
  return (
    <div className="glass rounded-2xl p-3">
      <div className="mb-2 flex items-center gap-2"><TeamLogo team={team} size={28} /><span className="title-caps text-lg">{team?.name}</span>
        <Badge variant={starters.size === max ? 'success' : 'warning'} className="ml-auto">{starters.size}/{max} titulaires</Badge>
        {existing?.validated && <Badge variant="success"><CheckCircle2 className="size-3" />Validée</Badge>}</div>
      <div className="space-y-1">
        {squad.map((p) => {
          const el = elig.get(p.id)
          const isBlocked = blocked(p)
          return (
            <Fragment key={p.id}>
            <div className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm', starters.has(p.id) ? 'bg-neon/15' : present.has(p.id) ? 'bg-white/5' : 'opacity-50', isBlocked && 'ring-1 ring-red-500/50')}>
              <input type="checkbox" aria-label="Présent" checked={present.has(p.id)} onChange={() => toggle(p.id, 'present')} className="size-4 accent-[#F85A00]" disabled={readOnly} />
              <Input type="number" aria-label="Numéro" className="h-7 w-12 px-1 text-center" value={lu.numbers?.[p.id] ?? p.number ?? ''} disabled={readOnly} onChange={(e) => setLu({ ...lu, numbers: { ...(lu.numbers ?? {}), [p.id]: +e.target.value } })} />
              <button className="flex-1 truncate text-left cursor-pointer" onClick={() => toggle(p.id, 'starter')}>{p.first_name} {p.last_name}</button>
              <RoleBadge position={p.position} />
              {isBlocked && <span title={el?.reasons.map((r) => r.label).join(' · ')} className="text-red-400"><ShieldAlert className="size-4" /></span>}
              {isBlocked && el?.reasons.some((r) => r.reason === 'suspended') && <Badge variant="destructive" className="hidden sm:inline-flex">Suspendu</Badge>}
              {isBlocked && can(user, 'derogation') && !readOnly && <button title="Forcer l’ajout (motif obligatoire, journalisé)" aria-label={`Forcer l’ajout de ${p.first_name} ${p.last_name}`} onClick={() => setWaiving({ id: p.id, motif: '' })} className="cursor-pointer text-amber-300"><Unlock className="size-4" /></button>}
              {waived(p.id) && <Badge variant="warning" title={lu.waivers?.find((w) => w.player_id === p.id)?.motif}>Forcé</Badge>}
              <button disabled={readOnly || !starters.has(p.id)} onClick={() => setLu({ ...lu, goalkeeper_id: p.id })} className={cn('flex size-6 items-center justify-center rounded-full text-[10px] font-black', lu.goalkeeper_id === p.id ? 'bg-award-blue text-white' : 'bg-white/5 text-muted-foreground')} title="Gardien">G</button>
              <button disabled={readOnly || !present.has(p.id)} onClick={() => setLu({ ...lu, captain_id: p.id })} className={cn('flex size-6 items-center justify-center rounded-full text-[10px] font-black', lu.captain_id === p.id ? 'bg-award-gold text-night-950' : 'bg-white/5 text-muted-foreground')} title="Capitaine">C</button>
            </div>
            {waiving?.id === p.id && (
              <form className="mx-2 mb-1 flex flex-wrap items-center gap-2 rounded-lg bg-amber-400/10 p-2 text-xs" onSubmit={(e) => { e.preventDefault(); if (waiving.motif.trim()) void waive(p, waiving.motif.trim()) }}>
                <span className="w-full text-amber-200">{el?.reasons.map((r) => r.label).join(' · ')} — motif obligatoire pour forcer l’ajout (journalisé)</span>
                <Input autoFocus value={waiving.motif} onChange={(e) => setWaiving({ id: p.id, motif: e.target.value })} placeholder="Motif (ex. décision Ardentia du …)" className="h-8 min-w-0 flex-1" aria-label="Motif" />
                <Button type="submit" size="sm" disabled={!waiving.motif.trim()}>Forcer</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setWaiving(null)}>Annuler</Button>
              </form>
            )}
            </Fragment>
          )
        })}
      </div>
      {[...elig.values()].some((e) => e.reasons.some((r) => r.reason === 'suspended')) && <p className="mt-2 text-xs text-muted-foreground">Joueurs suspendus bloqués : 3 jaunes cumulés = 1 match, rouge = au moins 1 match. <ArtLink art={REGLEMENT.cards.artYellow} /> <ArtLink art={REGLEMENT.cards.artRed} /></p>}
      {!readOnly && <Button className="mt-3 w-full" size="lg" onClick={validate}><CheckCircle2 />Valider la composition</Button>}
    </div>
  )
}

// Feuille de compo d'avant-match : présents, 6 titulaires + remplaçants, gardien, capitaine, numéros.
// Blocage automatique : joueurs suspendus et documents non validés (dérogation Super Admin tracée au journal).
import { useMemo, useState } from 'react'
import { CheckCircle2, ShieldAlert, Unlock } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TeamLogo, PositionBadge } from '@/components/league/Identity'
import { toast } from '@/components/ui/toast'
import { eligibility, suspensionRemaining } from '@/lib/matchEngine'
import { can } from '@/lib/permissions'
import { isPlayed } from '@/lib/stats'
import type { Lineup, Match, Player } from '@/types/entities'
import { cn } from '@/lib/utils'

export function useEligibility(match: Match) {
  const { db } = useData()
  return useMemo(() => {
    const out = new Map<string, ReturnType<typeof eligibility>>()
    for (const p of db.Player.filter((x) => x.team_id === match.home_team_id || x.team_id === match.away_team_id)) {
      let left = 0
      for (const s of db.Suspension.filter((x) => x.player_id === p.id && x.season_id === match.season_id)) {
        const origin = db.Match.find((m) => m.id === s.origin_match_id)
        const after = db.Match.filter((m) => m.season_id === match.season_id && m.id !== match.id && isPlayed(m) && (m.home_team_id === p.team_id || m.away_team_id === p.team_id) && (m.date ?? '') > (origin?.date ?? s.date ?? '') && (m.date ?? '') < (match.date ?? '')).length
        left += suspensionRemaining(s, after)
      }
      out.set(p.id, eligibility(p, { suspendedMatchesLeft: left }))
    }
    return out
  }, [db.Player, db.Suspension, db.Match, match])
}

export function LineupEditor({ match, teamId, onValidated, readOnly }: { match: Match; teamId: string; onValidated?: () => void; readOnly?: boolean }) {
  const { db, settings } = useData()
  const { user } = useAuth()
  const max = settings.starters_count ?? 6
  const team = db.Team.find((t) => t.id === teamId)
  const existing = db.Lineup.find((l) => l.match_id === match.id && l.team_id === teamId)
  const squad = db.Player.filter((p) => p.team_id === teamId && p.season_ids?.includes(match.season_id) && p.status !== 'inactive').sort((a, b) => (a.number ?? 99) - (b.number ?? 99))
  const elig = useEligibility(match)
  const [lu, setLu] = useState<Partial<Lineup>>(() => existing ?? { present_ids: squad.map((p) => p.id), starter_ids: [], substitute_ids: [], numbers: {}, waivers: [] })
  const waived = (pid: string) => lu.waivers?.some((w) => w.player_id === pid)
  const blocked = (p: Player) => elig.get(p.id)?.blocked && !waived(p.id)
  const present = new Set(lu.present_ids ?? [])
  const starters = new Set(lu.starter_ids ?? [])
  const toggle = (pid: string, field: 'present' | 'starter') => {
    if (readOnly) return
    const p = squad.find((x) => x.id === pid)!
    if (blocked(p) && field !== 'present') { toast.error(elig.get(pid)!.reasons.map((r) => r.label).join(' · ')); return }
    if (field === 'present') {
      const pres = present.has(pid) ? [...present].filter((x) => x !== pid) : [...present, pid]
      setLu({ ...lu, present_ids: pres, starter_ids: (lu.starter_ids ?? []).filter((x) => pres.includes(x)) })
    } else {
      if (!starters.has(pid) && starters.size >= max) { toast.error(`${max} titulaires maximum`); return }
      const st = starters.has(pid) ? [...starters].filter((x) => x !== pid) : [...starters, pid]
      setLu({ ...lu, starter_ids: st, present_ids: [...new Set([...present, pid])], goalkeeper_id: st.includes(lu.goalkeeper_id ?? '') ? lu.goalkeeper_id : st.find((x) => squad.find((p) => p.id === x)?.position === 'GK') })
    }
  }
  const waive = async (p: Player) => {
    const reason = elig.get(p.id)!.reasons[0].reason
    setLu({ ...lu, waivers: [...(lu.waivers ?? []), { player_id: p.id, reason, by: user!.email, at: new Date().toISOString() }] })
    base44.logActivity('waiver', 'Lineup', { id: existing?.id ?? match.id, name: `${p.first_name} ${p.last_name}` } as never, { joueur: `${p.first_name} ${p.last_name}`, motif: elig.get(p.id)!.reasons.map((r) => r.label).join(' · '), match: match.id })
    toast.info('Dérogation accordée (tracée au journal)')
  }
  const validate = async () => {
    const st = lu.starter_ids ?? []
    if (st.length === 0) { toast.error('Sélectionnez les titulaires'); return }
    if (!lu.goalkeeper_id) { toast.error('Désignez le gardien'); return }
    const subs = (lu.present_ids ?? []).filter((x) => !st.includes(x))
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
            <div key={p.id} className={cn('flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm', starters.has(p.id) ? 'bg-neon/15' : present.has(p.id) ? 'bg-white/5' : 'opacity-50', isBlocked && 'ring-1 ring-red-500/50')}>
              <input type="checkbox" aria-label="Présent" checked={present.has(p.id)} onChange={() => toggle(p.id, 'present')} className="size-4 accent-[#F85A00]" disabled={readOnly} />
              <Input type="number" aria-label="Numéro" className="h-7 w-12 px-1 text-center" value={lu.numbers?.[p.id] ?? p.number ?? ''} disabled={readOnly} onChange={(e) => setLu({ ...lu, numbers: { ...(lu.numbers ?? {}), [p.id]: +e.target.value } })} />
              <button className="flex-1 truncate text-left cursor-pointer" onClick={() => toggle(p.id, 'starter')}>{p.first_name} {p.last_name}</button>
              <PositionBadge position={p.position} />
              {isBlocked && <span title={el?.reasons.map((r) => r.label).join(' · ')} className="text-red-400"><ShieldAlert className="size-4" /></span>}
              {isBlocked && can(user, 'derogation') && !readOnly && <button title="Dérogation Super Admin" onClick={() => waive(p)} className="text-amber-300"><Unlock className="size-4" /></button>}
              {waived(p.id) && <Badge variant="warning">Dérogation</Badge>}
              <button disabled={readOnly || !starters.has(p.id)} onClick={() => setLu({ ...lu, goalkeeper_id: p.id })} className={cn('flex size-6 items-center justify-center rounded-full text-[10px] font-black', lu.goalkeeper_id === p.id ? 'bg-award-blue text-white' : 'bg-white/5 text-muted-foreground')} title="Gardien">G</button>
              <button disabled={readOnly || !present.has(p.id)} onClick={() => setLu({ ...lu, captain_id: p.id })} className={cn('flex size-6 items-center justify-center rounded-full text-[10px] font-black', lu.captain_id === p.id ? 'bg-award-gold text-night-950' : 'bg-white/5 text-muted-foreground')} title="Capitaine">C</button>
            </div>
          )
        })}
      </div>
      {!readOnly && <Button className="mt-3 w-full" size="lg" onClick={validate}><CheckCircle2 />Valider la composition</Button>}
    </div>
  )
}

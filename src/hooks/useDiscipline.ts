// Discipline (cumul des jaunes, suspensions) calculée depuis les événements, avec les règles de la version
// du règlement rattachée à la saison. Saisons sans cumul (anciennes) : suspensions saisies à la main.
import { useMemo } from 'react'
import { useData } from './useData'
import { computeDiscipline, rulesForSeason, suspendedFor, type DisciplineData, type PlayerDiscipline } from '@/lib/reglement'
import { isPlayed } from '@/lib/standings'
import type { Match, Suspension } from '@/types/entities'

export function useDisciplineData(): DisciplineData {
  const { db } = useData()
  return useMemo(() => ({ matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, players: db.Player, extras: db.Suspension.filter((s) => s.kind === 'extra') }), [db.Match, db.MatchEvent, db.Lineup, db.Player, db.Suspension])
}

export function useSeasonRules(seasonId?: string | null) {
  const { db } = useData()
  return rulesForSeason(db.Season.find((s) => s.id === seasonId))
}

/** Discipline de toutes les compétitions d'une saison (règlement avec cumul uniquement). */
export function useSeasonDiscipline(seasonId?: string | null) {
  const { db } = useData()
  const data = useDisciplineData()
  const rules = useSeasonRules(seasonId)
  return useMemo(() => {
    if (!seasonId || !rules.cumulativeCards) return []
    return db.Competition.filter((c) => c.season_id === seasonId).map((c) => ({ competition: c, ...computeDiscipline(c.id, data) }))
  }, [db.Competition, data, seasonId, rules.cumulativeCards])
}

/** Ancien régime (saisons sans cumul) : suspensions saisies dans l'admin, purgées par les matchs joués ensuite. */
export function legacyRemaining(s: Suspension, matches: Match[], teamId: string, before?: Pick<Match, 'id' | 'date'>) {
  const origin = matches.find((m) => m.id === s.origin_match_id)
  const after = matches.filter((m) => m.season_id === s.season_id && m.id !== before?.id && isPlayed(m) && (m.home_team_id === teamId || m.away_team_id === teamId) && (m.date ?? '') > (origin?.date ?? s.date ?? '') && (!before || (m.date ?? '') < (before.date ?? ''))).length
  return Math.max(0, s.matches - after)
}

/** Joueurs suspendus pour un match (bloqués à la feuille de match). */
export function useSuspendedFor(match?: Match): Map<string, { remaining: number; label: string; discipline?: PlayerDiscipline }> {
  const { db } = useData()
  const data = useDisciplineData()
  const rules = useSeasonRules(match?.season_id)
  return useMemo(() => {
    const out = new Map<string, { remaining: number; label: string; discipline?: PlayerDiscipline }>()
    if (!match) return out
    if (rules.cumulativeCards) {
      for (const [pid, d] of suspendedFor(match, data)) out.set(pid, { remaining: d.remaining, label: suspensionLabel(d.remaining), discipline: d })
      return out
    }
    for (const p of db.Player.filter((x) => x.team_id === match.home_team_id || x.team_id === match.away_team_id)) {
      const left = db.Suspension.filter((s) => s.player_id === p.id && s.season_id === match.season_id).reduce((a, s) => a + legacyRemaining(s, db.Match, p.team_id, match), 0)
      if (left > 0) out.set(p.id, { remaining: left, label: suspensionLabel(left) })
    }
    return out
  }, [match, data, rules.cumulativeCards, db.Player, db.Suspension, db.Match])
}

export const suspensionLabel = (n: number) => `Suspendu (${n} match${n > 1 ? 's' : ''} restant${n > 1 ? 's' : ''})`

/** Discipline d'un joueur sur la saison : par compétition + totaux. */
export function usePlayerDiscipline(playerId?: string, seasonId?: string | null) {
  const all = useSeasonDiscipline(seasonId)
  return useMemo(() => {
    const rows = all.map((c) => ({ competition: c.competition, d: playerId ? c.players.get(playerId) : undefined })).filter((r) => r.d)
    const totals = rows.reduce((a, r) => ({ yellow: a.yellow + r.d!.yellowsTotal, red: a.red + r.d!.redsTotal, remaining: a.remaining + r.d!.remaining }), { yellow: 0, red: 0, remaining: 0 })
    return { rows: rows as { competition: (typeof all)[number]['competition']; d: PlayerDiscipline }[], totals, active: all.length > 0 }
  }, [all, playerId])
}

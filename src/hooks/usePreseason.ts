// Pré-saison d'une saison : compétition, paramètres, matchs au format du moteur, état (classement, repos…).
import { useMemo } from 'react'
import { useData } from './useData'
import { isDisputed } from '@/lib/reglement'
import { PRESEASON_DEFAULTS, preseasonState, resolvePreseasonConfig, type PMatch } from '@/lib/preseason'
import type { Competition, Match } from '@/types/entities'
import { activeAdjustments } from '@/lib/adjustments'

export const isPreseasonComp = (c?: Competition) => !!c && c.phase === 'league_phase' && c.format === 'swiss'
export const toPMatch = (m: Match): PMatch => ({ id: m.id, round: m.round ?? 0, home: m.home_team_id, away: m.away_team_id, hs: m.home_score, as: m.away_score, played: isDisputed(m), reason: m.pairing_reason })

export function usePreseason(seasonId?: string | null) {
  const { db } = useData()
  return useMemo(() => {
    const comp = db.Competition.find((c) => c.season_id === seasonId && isPreseasonComp(c))
    if (!comp) return null
    const ps = comp.preseason ?? {}
    const cfg = resolvePreseasonConfig({ ...PRESEASON_DEFAULTS, ...(ps.config ?? {}) })
    const teamIds = comp.team_ids ?? []
    const matches = db.Match.filter((m) => m.competition_id === comp.id && m.status !== 'cancelled').sort((a, b) => (a.round ?? 0) - (b.round ?? 0) || (a.date ?? '').localeCompare(b.date ?? ''))
    const pm = matches.map(toPMatch)
    const rests: Record<number, string | undefined> = Object.fromEntries(Object.entries(ps.rests ?? {}).map(([k, v]) => [Number(k), v]))
    const drawOrder = ps.tiebreak_order ?? ps.draw_order ?? [...teamIds].sort()
    const adjustments = activeAdjustments(db.StandingAdjustment, comp.id)
    const state = preseasonState(teamIds, pm, rests, cfg, drawOrder, adjustments)
    const totalRounds = cfg.rounds + (state.format.catchup ? 1 : 0)
    const roundLabel = (r: number) => (r > cfg.rounds ? 'Rattrapage' : `Journée ${r}`)
    const shortLabel = (r: number) => (r > cfg.rounds ? 'Rattrapage' : `J${r}`)
    const teamName = (id?: string) => db.Team.find((t) => t.id === id)?.name ?? id ?? '—'
    return { comp, ps, cfg, teamIds, matches, pm, rests, drawOrder, adjustments, state, totalRounds, roundLabel, shortLabel, teamName }
  }, [db.Competition, db.Match, db.Team, db.StandingAdjustment, seasonId])
}
export type PreseasonView = NonNullable<ReturnType<typeof usePreseason>>

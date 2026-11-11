// Bandeau de chiffres de l'accueil (sous le billboard) — calculé depuis le calendrier réel de la saison.
import type { Competition, Match } from '@/types/entities'
import type { LeagueData } from './stats'
import { isDisputed } from './reglement'
import { competitionNames, phaseName, slugify } from './competitionNames'

export interface PhaseState {
  /** nom affiché (PRÉ-SAISON, MASTER, CHALLENGER) */
  name: string
  status: 'upcoming' | 'running' | 'done'
  /** journée en cours (première journée qui a encore des matchs à jouer) */
  round?: number
  played: number
  total: number
  /** « J3 · 24/90 matchs », « Terminée ✓ », « À venir » */
  label: string
  href: string
  competition?: Competition
}
export interface SeasonStrip { teams: number; players: number; played: number; total: number; preseason: PhaseState; master: PhaseState; challenger: PhaseState }

/** matchs programmés : tout sauf annulés (un match reporté reste à jouer) */
const scheduled = (m: Match) => m.status !== 'cancelled'

export function phaseState(name: string, href: string, comp: Competition | undefined, matches: Match[]): PhaseState {
  const ms = comp ? matches.filter((m) => m.competition_id === comp.id && scheduled(m)) : []
  const played = ms.filter(isDisputed).length, total = ms.length
  if (!comp || !total) return { name, status: 'upcoming', played: 0, total: 0, label: 'À venir', href, competition: comp }
  if (played >= total) return { name, status: 'done', played, total, label: 'Terminée ✓', href, competition: comp }
  const open = ms.filter((m) => !isDisputed(m)).map((m) => m.round ?? 0).filter((r) => r > 0)
  const round = open.length ? Math.min(...open) : undefined
  return { name, status: 'running', round, played, total, label: `${round ? `J${round} · ` : ''}${played}/${total} matchs`, href, competition: comp }
}

export function seasonStrip(league: LeagueData, seasonId: string): SeasonStrip {
  const comps = league.competitions.filter((c) => c.season_id === seasonId)
  const ms = league.matches.filter((m) => m.season_id === seasonId && scheduled(m))
  const names = competitionNames()
  const pre = comps.find((c) => c.phase === 'league_phase'), gold = comps.find((c) => c.phase === 'gold'), silver = comps.find((c) => c.phase === 'silver')
  const teams = new Set(comps.flatMap((c) => c.team_ids ?? []))
  return {
    teams: teams.size,
    players: league.players.filter((p) => p.status !== 'inactive' && (p.season_ids?.includes(seasonId) ?? false)).length,
    played: ms.filter(isDisputed).length,
    total: ms.length,
    preseason: phaseState(names.league_phase, pre ? `/classement/${slugify(pre.name)}` : '/classement', pre, ms),
    master: phaseState(phaseName('gold'), `/classement/${slugify(phaseName('gold'))}`, gold, ms),
    challenger: phaseState(phaseName('silver'), `/classement/${slugify(phaseName('silver'))}`, silver, ms),
  }
}

// Accueil : mises en avant tirées de la saison précédente, UNIQUEMENT pour les équipes et joueurs qui
// participent aussi à la saison en cours avec un lien approuvé (club / identité commune).
import type { LeagueData } from './stats'
import { computePlayerXP, generalStandings } from './stats'
import { race } from './xp'
import { playerInSeason, teamInSeason } from './clubs'
import type { Player, Team } from '@/types/entities'

export interface Highlight { key: string; kind: 'team' | 'player'; label: string; team: Team; player?: Player; value: number; unit: string; sub: string }

export function returningHighlights(league: LeagueData, prevSeasonId: string, seasonId: string): Highlight[] {
  const out: Highlight[] = []
  const prevName = league.seasons.find((s) => s.id === prevSeasonId)?.name.replace(/^Saison /, '') ?? ''
  const now = (teamId: string) => { const t = league.teams.find((x) => x.id === teamId); return t ? teamInSeason(t, seasonId, league.teams, league.competitions) : undefined }
  const nowPlayer = (pid: string) => { const p = league.players.find((x) => x.id === pid); return p ? playerInSeason(p, seasonId, league.players) : undefined }
  // équipes : champion, puis podium
  const table = generalStandings(league, prevSeasonId).filter((r) => r.played > 0)
  table.slice(0, 3).forEach((r, i) => {
    const t = now(r.team_id); if (!t) return
    out.push({ key: `prev-team-${i + 1}`, kind: 'team', label: i === 0 ? `Champion ${prevName}` : `${i + 1}e en ${prevName}`, team: t, value: r.points, unit: 'PTS', sub: `${r.won} victoires · de retour en ${league.seasons.find((s) => s.id === seasonId)?.name.replace(/^Saison /, '') ?? ''}` })
  })
  // joueurs : XP, buteur, passeur, gant d'or (le premier qui est revenu)
  const list = [...computePlayerXP(league, { seasonId: prevSeasonId }).values()]
  const take = (key: 'xp' | 'top_scorer' | 'top_assist' | 'golden_glove', label: string, unit: string, val: (x: (typeof list)[number]) => number) => {
    const r = race(league, list, key, prevSeasonId)[0]
    if (!r || !val(r.item)) return
    const p = nowPlayer(r.item.player_id); if (!p) return
    const t = league.teams.find((x) => x.id === p.team_id); if (!t) return
    out.push({ key: `prev-${key}`, kind: 'player', label: `${label} ${prevName}`, team: t, player: p, value: val(r.item), unit, sub: `De retour avec ${t.name}` })
  }
  take('xp', 'N°1 XP', 'XP', (x) => x.xp)
  take('top_scorer', 'Meilleur buteur', 'BUTS', (x) => x.goals)
  take('top_assist', 'Meilleur passeur', 'PASSES', (x) => x.assists)
  take('golden_glove', 'Gant d’or', 'ARRÊTS', (x) => x.saves)
  return out
}

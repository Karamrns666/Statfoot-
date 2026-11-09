// Jeu de données CONNU (phase de ligue, 4 équipes, 3 journées) — résultats calculés à la main dans les tests.
//  J1  A 2-0 B   |  C 1-1 D        Classement avant J2 : A1 C2 D3 B4
//  J2  A 1-1 C   |  B 3-1 D        Classement avant J3 : A1 B2 C3 D4
//  J3  A 0-1 D   |  B 2-2 C
import type { Lineup, Match, MatchEvent, Player, Team } from '@/types/entities'
import type { LeagueData } from '../stats'

const T = ['A', 'B', 'C', 'D'] as const
// suffixes d'identifiants hérités ; le rôle n'est que GK (gardien) ou FIELD (joueur de champ)
const POS = ['GK', 'DEF', 'MID', 'FWD'] as const
export const teams: Team[] = T.map((t) => ({ id: t, name: `Équipe ${t}`, short_name: `EQ${t}` }))
export const players: Player[] = T.flatMap((t) => POS.map((pos) => ({
  id: `${t}_${pos}`, first_name: pos, last_name: `${t}-${pos}`, position: pos === 'GK' ? 'GK' : 'FIELD', team_id: t,
  birth_date: t === 'C' && pos === 'MID' ? '2006-03-01' : '1990-01-01', season_ids: t === 'A' && pos === 'FWD' ? ['s1'] : ['s0', 's1'],
})))

let n = 0
const match = (round: number, home: string, away: string, hs: number, as: number): Match => ({
  id: `M${++n}`, season_id: 's1', competition_id: 'lp', round, stage: 'league_phase',
  date: `2025-09-${String(round * 7).padStart(2, '0')}T19:00:00`, home_team_id: home, away_team_id: away, home_score: hs, away_score: as, status: 'finished', published: true,
})
export const matches: Match[] = [match(1, 'A', 'B', 2, 0), match(1, 'C', 'D', 1, 1), match(2, 'A', 'C', 1, 1), match(2, 'B', 'D', 3, 1), match(3, 'A', 'D', 0, 1), match(3, 'B', 'C', 2, 2)]

let e = 0
const ev = (match_id: string, type: MatchEvent['type'], player_id: string, minute: number, extra: Partial<MatchEvent> = {}): MatchEvent => ({
  id: `E${++e}`, match_id, type, player_id, team_id: player_id[0], minute, period: minute <= 15 ? '1H' : '2H', ...extra,
})
export const events: MatchEvent[] = [
  ev('M1', 'goal', 'A_FWD', 10, { related_player_id: 'A_MID' }), ev('M1', 'goal', 'A_FWD', 25, { goal_kind: 'penalty' }),
  ev('M1', 'save', 'A_GK', 12), ev('M1', 'save', 'A_GK', 20), ev('M1', 'save', 'B_GK', 14), ev('M1', 'yellow_card', 'B_DEF', 22),
  ev('M2', 'goal', 'C_FWD', 8, { related_player_id: 'C_DEF' }), ev('M2', 'goal', 'D_MID', 26, { related_player_id: 'D_FWD' }),
  ev('M3', 'goal', 'A_MID', 5, { related_player_id: 'A_FWD' }), ev('M3', 'own_goal', 'A_DEF', 28),
  ev('M4', 'goal', 'B_FWD', 4, { related_player_id: 'B_MID' }), ev('M4', 'goal', 'B_FWD', 18), ev('M4', 'goal', 'B_MID', 26),
  ev('M4', 'goal', 'D_FWD', 29, { related_player_id: 'D_MID' }), ev('M4', 'red_card', 'D_DEF', 29),
  ev('M5', 'goal', 'D_FWD', 14, { related_player_id: 'D_MID' }),
  ev('M6', 'goal', 'B_FWD', 3), ev('M6', 'goal', 'C_FWD', 11), ev('M6', 'goal', 'C_MID', 24, { related_player_id: 'C_DEF' }), ev('M6', 'goal', 'B_DEF', 28, { related_player_id: 'B_FWD' }),
]
// D n'a pas de compo en M2 → participation déduite des événements (D_MID, D_FWD)
export const lineups: Lineup[] = matches.flatMap((m) => [m.home_team_id, m.away_team_id].filter((t) => !(m.id === 'M2' && t === 'D'))
  .map((t) => ({ id: `L_${m.id}_${t}`, match_id: m.id, team_id: t, starter_ids: POS.map((p) => `${t}_${p}`), goalkeeper_id: `${t}_GK`, validated: true })))

export function makeLeague(o: Partial<LeagueData> = {}): LeagueData {
  return {
    seasons: [{ id: 's1', name: 'Saison test', start_date: '2025-09-01' }],
    competitions: [{ id: 'lp', season_id: 's1', name: 'Phase de ligue', phase: 'league_phase', team_ids: ['A', 'B', 'C', 'D'] }],
    teams, players, matches, events, lineups, xpRules: [], suspensions: [], monthlyAwards: [],
    settings: {}, ...o,
  }
}

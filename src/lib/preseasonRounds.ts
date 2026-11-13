// Pré-saison : matchs d'une journée générée par le moteur suisse (fonction pure, testée).
// Les matchs sont créés NON publiés, sans date ni terrain (« Horaire à définir »), avec les numéros officiels suivants.
import { nextNumbers } from './matchTime'
import type { Competition, Match, PreseasonData } from '@/types/entities'

export function roundMatches(pending: NonNullable<PreseasonData['pending']>, comp: Pick<Competition, 'id' | 'season_id' | 'preseason'>, all: Pick<Match, 'number'>[]): Omit<Match, 'id'>[] {
  const numbers = nextNumbers(all.map((m) => m.number), comp.preseason?.number_counter, pending.pairs.length)
  return pending.pairs.map((p, i) => ({
    season_id: comp.season_id, competition_id: comp.id, round: pending.round, stage: 'league_phase', number: numbers[i],
    home_team_id: p.home, away_team_id: p.away, status: 'scheduled', published: false, date: undefined, pitch: undefined,
    pairing_reason: p.reason, pairing_manual: p.manual,
  }))
}

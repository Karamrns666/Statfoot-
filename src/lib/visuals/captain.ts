// Visuel résultat du Match des capitaines (Orange contre Bleue), au format du visuel résultat de la ligue.
import type { CaptainMatch, CaptainSide, CaptainTeam, Player } from '@/types/entities'
import { captainLogo, captainScore, other } from '@/lib/captains'
import { fmtDate, fmtTime } from '@/lib/format'
import { shortName, type ResultModel, type ResultRow } from './model'

const upper = (s: string) => s.toLocaleUpperCase('fr-FR')

function rows(m: CaptainMatch, side: CaptainSide, players: Map<string, Player>): ResultRow[] {
  const mine = m.lines.filter((l) => l.side === side)
  const scorers = mine.filter((l) => l.goals > 0).sort((a, b) => b.goals - a.goals).map((l) => ({ name: shortName(players.get(l.player_id)), goals: l.goals, yellow: l.yc, red: l.rc }))
  const og = m.lines.filter((l) => l.side === other(side)).reduce((a, l) => a + l.og, 0)
  const carded = mine.filter((l) => !l.goals && (l.yc || l.rc)).map((l) => ({ name: shortName(players.get(l.player_id)), goals: 0, yellow: l.yc, red: l.rc }))
  return [...scorers, ...(og ? [{ name: '(C.S.C)', goals: og, yellow: 0, red: 0, og: true }] : []), ...carded]
}

export function captainResultModel(m: CaptainMatch, teams: Record<CaptainSide, CaptainTeam>, players: Map<string, Player>): ResultModel {
  const s = captainScore(m)
  const pens = s.orange === s.bleue && m.orange_pens != null && m.bleue_pens != null
  const month = upper(fmtDate(m.date, 'MMM yyyy'))
  return {
    competition: `CAPITAINES · ${month}`,
    home: { name: upper(teams.orange.name), short: 'ORA', logo: captainLogo(teams.orange) },
    away: { name: upper(teams.bleue.name), short: 'BLE', logo: captainLogo(teams.bleue) },
    homeScore: s.orange, awayScore: s.bleue,
    sub: pens ? `T.A.B. ${m.orange_pens}-${m.bleue_pens}` : undefined,
    forfeit: false,
    homeScorers: [], awayScorers: [],
    homeRows: rows(m, 'orange', players), awayRows: rows(m, 'bleue', players),
    ...(pens ? { homePens: m.orange_pens!, awayPens: m.bleue_pens! } : {}),
    footer: upper([fmtDate(m.date, 'EEE d MMM'), fmtTime(m.date), m.pitch].filter(Boolean).join(' · ')),
  }
}

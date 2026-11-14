// Tirage au sort OFFICIEL de la journée 1 de la pré-saison 2026-2027 (saisi à la main, il remplace tout tirage antérieur).
// Heures = heure du Maroc. Terrain 1 pour le premier match de chaque créneau, Terrain 2 pour le second (modifiable dans l'admin).
import { matchOfficial } from '@/lib/officialTeams'
import { PITCHES } from '@/config/pitches'
import { fmtNumber, numberValue, wallToISO } from '@/lib/matchTime'
import type { Match, PreseasonData, Team } from '@/types/entities'

export const OFFICIAL_J1_2026 = [
  { number: 'PS-01', day: '2026-11-16', time: '21:00', a: 'Distra', b: 'BMCI' },
  { number: 'PS-02', day: '2026-11-16', time: '21:00', a: 'Crédit Agricole', b: 'Pharmaprom' },
  { number: 'PS-03', day: '2026-11-16', time: '22:00', a: 'CAC', b: 'Taqeef (Midea)' },
  { number: 'PS-04', day: '2026-11-17', time: '20:00', a: "L'Heure Joyeuse", b: 'ALD Automotive' },
  { number: 'PS-05', day: '2026-11-17', time: '20:00', a: 'G3C', b: 'Mega Post Tension' },
  { number: 'PS-06', day: '2026-11-17', time: '21:00', a: 'Michoc', b: 'Atelier Vert Casa' },
  { number: 'PS-07', day: '2026-11-17', time: '21:00', a: 'JTI', b: 'Cobco' },
  { number: 'PS-09', day: '2026-11-19', time: '21:00', a: 'Arrow ECS', b: 'Marjane Market' },
  { number: 'PS-10', day: '2026-11-19', time: '21:00', a: 'Atelier Vert Rabat', b: 'Attijariwafa bank' },
  { number: 'PS-11', day: '2026-11-19', time: '22:00', a: 'Parebrise Express', b: 'CTR' },
] as const
// Canpack 1 et Canpack 2 retirés de la saison (nov. 2026) : PS-08 supprimé (numéro non réutilisé), Wafasalaf au repos
export const OFFICIAL_J1_REST = 'Wafasalaf'
export const OFFICIAL_J1_LABEL = 'Tirage au sort officiel (saisie manuelle)'

/** Identifiant d'équipe 2026-2027 à partir d'un nom du tableau officiel (via la liste officielle et ses alias). */
export const teamIdOf = (name: string, teams: Pick<Team, 'id' | 'short_name' | 'season_id'>[] = []) => {
  const o = matchOfficial([name]); if (!o) throw new Error(`Équipe inconnue : ${name}`)
  return teams.find((t) => t.season_id === 'season_2026' && t.short_name === o.short)?.id ?? `t26_${o.short.toLowerCase()}`
}

/**
 * Matchs et données de pré-saison du tirage officiel. Vérifie que les 22 équipes jouent exactement une fois
 * et que l'équipe au repos est la seule des équipes de la pré-saison absente du tirage.
 */
export function buildOfficialJ1(compId: string, seasonId: string, teamIds: string[], now = new Date().toISOString(), teams: Pick<Team, 'id' | 'short_name' | 'season_id'>[] = []) {
  const slotCount = new Map<string, number>()
  const matches: Match[] = OFFICIAL_J1_2026.map((r) => {
    const key = `${r.day}T${r.time}`, i = slotCount.get(key) ?? 0
    slotCount.set(key, i + 1)
    return {
      id: `m26_${r.number.toLowerCase().replace('-', '')}`, season_id: seasonId, competition_id: compId, round: 1, stage: 'league_phase',
      number: r.number, date: wallToISO(r.day, r.time), pitch: PITCHES[i], home_team_id: teamIdOf(r.a, teams), away_team_id: teamIdOf(r.b, teams),
      status: 'scheduled', published: true, pairing_reason: 'Tirage au sort', created_date: now,
    } as Match
  })
  const rest = teamIdOf(OFFICIAL_J1_REST, teams)
  const playing = matches.flatMap((m) => [m.home_team_id, m.away_team_id])
  const errors: string[] = []
  for (const t of teamIds) {
    const n = playing.filter((x) => x === t).length
    if (t === rest ? n !== 0 : n !== 1) errors.push(`${t} apparaît ${n} fois`)
  }
  for (const t of playing) if (!teamIds.includes(t)) errors.push(`${t} ne fait pas partie de la pré-saison`)
  if (teamIds.length !== playing.length + 1) errors.push(`${teamIds.length} équipes en pré-saison pour ${playing.length} équipes tirées + 1 au repos`)
  if (errors.length) throw new Error(`Tirage officiel incohérent : ${errors.join(' ; ')}`)
  const preseason: PreseasonData = {
    draw_source: 'manual', seed: undefined, draw_order: [...playing, rest], drawn_at: '2026-11-13T12:00:00.000Z', drawn_by: OFFICIAL_J1_LABEL,
    revealed: playing.length + 1, rests: { '1': rest }, created_rounds: [1], published_rounds: [1],
    number_counter: Math.max(...matches.map((m) => numberValue(m.number))),
  }
  return { matches, rest, preseason, nextNumber: fmtNumber(preseason.number_counter! + 1) }
}

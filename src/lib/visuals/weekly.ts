// Visuels de la semaine (fonctions PURES, testées) — par compétition (PRÉ-SAISON, MASTER, CHALLENGER) et par journée :
//  • Résultats de la journée · • Classement après la journée · • Top 10 joueurs (XP), passeurs, gardiens.
// Uniquement la journée et la compétition choisies. Le Match des capitaines n'est jamais lu (données séparées).
import type { Competition, Player, Team } from '@/types/entities'
import { isPlayed, competitionStandings, type StandingRow } from '@/lib/standings'
import { matchXPLines, xpConfig, type XPData } from '@/lib/xp'
import { keeperMatchStats } from '@/lib/matchEngine'
import type { LeagueData } from '@/lib/stats'
import { shortName } from './model'

const upper = (s: string) => s.toLocaleUpperCase('fr-FR')

export const competitionTitle = (c?: Competition) => upper(c?.name ?? '')

/** Journées disponibles (matchs joués) d'une compétition, de la plus récente à la plus ancienne. */
export function playedRounds(league: Pick<LeagueData, 'matches'>, competitionId: string) {
  return [...new Set(league.matches.filter((m) => m.competition_id === competitionId && isPlayed(m) && m.round != null).map((m) => m.round!))].sort((a, b) => b - a)
}
export function roundMatches(league: Pick<LeagueData, 'matches'>, competitionId: string, round: number) {
  return league.matches.filter((m) => m.competition_id === competitionId && m.round === round && m.status !== 'cancelled')
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || (a.pitch ?? '').localeCompare(b.pitch ?? ''))
}

// ---------------------------------------------------------------------------
//  Résultats de la journée
// ---------------------------------------------------------------------------
export interface WeeklyResultRow { tag: string; home: { name: string; logo?: string; color?: string }; away: { name: string; logo?: string; color?: string }; score: string; sub?: string }
export function weeklyResults(league: LeagueData, competitionId: string, round: number): WeeklyResultRow[] {
  const T = new Map(league.teams.map((t) => [t.id, t]))
  return roundMatches(league, competitionId, round).map((m) => {
    const h = T.get(m.home_team_id), a = T.get(m.away_team_id)
    const played = isPlayed(m)
    const time = m.date ? m.date.slice(11, 16) : ''
    const pitch = m.pitch?.match(/\d+/)?.[0]
    return {
      tag: pitch ? `T${pitch}` : time || '—',
      home: { name: upper(h?.short_name || h?.name || '?'), logo: h?.logo_url, color: h?.primary_color },
      away: { name: upper(a?.short_name || a?.name || '?'), logo: a?.logo_url, color: a?.primary_color },
      score: played ? `${m.home_score ?? 0} - ${m.away_score ?? 0}` : time || 'vs',
      sub: m.forfeit_team_id ? 'T.V.' : m.penalties && m.home_pens != null && m.away_pens != null ? `t.a.b. ${m.home_pens}-${m.away_pens}` : undefined,
    }
  })
}

// ---------------------------------------------------------------------------
//  Classement après la journée
// ---------------------------------------------------------------------------
export interface WeeklyStandingRow extends StandingRow { name: string; short: string; logo?: string; color?: string }
export function weeklyStandings(league: LeagueData, competitionId: string, round: number): WeeklyStandingRow[] {
  const T = new Map(league.teams.map((t) => [t.id, t]))
  return competitionStandings(league, competitionId, { beforeRound: round + 1 }).map((r) => {
    const t = T.get(r.team_id)
    return { ...r, name: upper(t?.name ?? '?'), short: upper(t?.short_name ?? ''), logo: t?.logo_url, color: t?.primary_color }
  })
}

// ---------------------------------------------------------------------------
//  Top 10 de la journée
// ---------------------------------------------------------------------------
export type TopKind = 'xp' | 'assists' | 'keepers'
export const TOP_LABEL: Record<TopKind, string> = { xp: 'TOP 10 JOUEURS', assists: 'TOP 10 PASSEURS', keepers: 'TOP 10 GARDIENS' }
export const TOP_UNIT: Record<TopKind, [string, string]> = { xp: ['XP', 'XP'], assists: ['PASSE D.', 'PASSES D.'], keepers: ['ARRÊT', 'ARRÊTS'] }
export interface TopEntry { player: Player; team?: Team; value: number; xp: number; rank: number; display: string; name: string }

const KEEPER_KEYS = new Set(['clean_sheet_gk', 'save', 'penalty_saved', 'shootout_saved', 'goal_conceded_gk'])

/**
 * Top 10 de la journée et de la compétition choisies :
 *  - xp : XP gagnés sur la journée ; - assists : passes décisives ; - keepers : arrêts (départage : XP de gardien).
 * Égalité : XP de la journée, puis ordre alphabétique. Valeur nulle exclue.
 */
export function weeklyTop(league: LeagueData & XPData, competitionId: string, round: number, kind: TopKind, n = 10): TopEntry[] {
  const ms = roundMatches(league, competitionId, round).filter(isPlayed)
  const P = new Map(league.players.map((p) => [p.id, p])), T = new Map(league.teams.map((t) => [t.id, t]))
  const xp = new Map<string, number>(), kxp = new Map<string, number>(), assists = new Map<string, number>(), saves = new Map<string, number>()
  const add = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v)
  const teamOf = new Map<string, string>()
  for (const m of ms) {
    const cfg = xpConfig(league.xpRules, m.season_id)
    for (const l of matchXPLines(league, m, cfg)) { add(xp, l.player_id, l.points); if (KEEPER_KEYS.has(l.key)) add(kxp, l.player_id, l.points) }
    const evs = league.events.filter((e) => e.match_id === m.id && e.period !== 'PENS')
    for (const e of evs) if (e.type === 'goal' && e.related_player_id && e.related_player_id !== e.player_id) { add(assists, e.related_player_id, 1); teamOf.set(e.related_player_id, e.team_id) }
    for (const tid of [m.home_team_id, m.away_team_id]) {
      const lu = league.lineups.find((l) => l.match_id === m.id && l.team_id === tid)
      for (const k of keeperMatchStats(m, lu, evs, tid)) { add(saves, k.player_id, k.saves); teamOf.set(k.player_id, tid); if (!kxp.has(k.player_id)) kxp.set(k.player_id, 0) }
    }
  }
  const src = kind === 'xp' ? xp : kind === 'assists' ? assists : saves
  const tie = kind === 'keepers' ? kxp : xp
  const list = [...src.entries()].filter(([pid, v]) => P.has(pid) && (kind === 'keepers' ? v > 0 || (kxp.get(pid) ?? 0) > 0 : v > 0))
    .map(([pid, v]) => ({ pid, v, t: tie.get(pid) ?? 0, x: xp.get(pid) ?? 0, name: `${P.get(pid)!.last_name} ${P.get(pid)!.first_name}` }))
    .sort((a, b) => b.v - a.v || b.t - a.t || b.x - a.x || a.name.localeCompare(b.name, 'fr'))
    .slice(0, n)
  const [one, many] = TOP_UNIT[kind]
  let prev: (typeof list)[number] | undefined, rank = 0
  return list.map((e, i) => {
    if (!prev || prev.v !== e.v || prev.t !== e.t) rank = i + 1
    prev = e
    const p = P.get(e.pid)!
    const team = T.get(teamOf.get(e.pid) ?? p.team_id) ?? T.get(p.team_id)
    const value = e.v
    return { player: p, team, value, xp: e.x, rank, name: shortName(p), display: kind === 'xp' ? `${value > 0 ? '+' : ''}${value} XP` : `${value} ${value > 1 ? many : one}` }
  })
}

/** Textes de publication des visuels de la semaine. */
export function weeklyCaption(kind: 'resultats' | 'classement' | TopKind, comp: string, round: number, lines: string[] = []) {
  const head = kind === 'resultats' ? `⚽ RÉSULTATS | ${comp} · J${round}` : kind === 'classement' ? `📊 CLASSEMENT | ${comp} · après la J${round}` : `🏅 ${TOP_LABEL[kind]} | ${comp} · J${round}`
  return [head, ...lines, '', '#MoroccoBusinessLeague #MBL #Ardentia #FootEntreprise'].join('\n')
}

/** Couleur de texte lisible sur une couleur de fond (contraste WCAG). */
export function contrastText(bg?: string) {
  const hex = (bg ?? '#0B2E73').replace('#', '')
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex.padEnd(6, '0').slice(0, 6)
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  const L = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return (1.05) / (L + 0.05) >= (L + 0.05) / 0.05 ? '#FFFFFF' : '#0B1B3F'
}
export function shade(hex: string | undefined, k: number) {
  const h = (hex ?? '#0B2E73').replace('#', '').padEnd(6, '0').slice(0, 6)
  const c = [0, 2, 4].map((i) => Math.max(0, Math.min(255, Math.round(parseInt(h.slice(i, i + 2), 16) * k))))
  return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

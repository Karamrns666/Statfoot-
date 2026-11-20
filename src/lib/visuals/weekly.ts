// Visuels de la semaine (fonctions PURES, testées) — par compétition (PRÉ-SAISON, MASTER, CHALLENGER) et par journée :
//  • Résultats de la journée · • Classement après la journée · • Top 10 joueurs (XP), buteurs, passeurs, gardiens.
// Uniquement la journée et la compétition choisies. Le Match des capitaines n'est jamais lu (données séparées).
import type { Competition, Player, Team } from '@/types/entities'
import { isPlayed, competitionStandings, type StandingRow } from '@/lib/standings'
import { computePlayerXP, matchXPLines, xpConfig, type XPData } from '@/lib/xp'
import { keeperMatchStats } from '@/lib/matchEngine'
import type { LeagueData } from '@/lib/stats'
import { shortName } from './model'
import { logoPlate, tileLogo } from '@/lib/logoPlate'
import { PRESEASON_DEFAULTS, preseasonState, resolvePreseasonConfig, type PMatch } from '@/lib/preseason'
import { isDisputed } from '@/lib/reglement'
import { activeAdjustments } from '@/lib/adjustments'

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
export interface WeeklyResultRow { tag: string; home: { name: string; logo?: string; logoBg?: string; color?: string }; away: { name: string; logo?: string; logoBg?: string; color?: string }; score: string; sub?: string }
export function weeklyResults(league: LeagueData, competitionId: string, round: number): WeeklyResultRow[] {
  const T = new Map(league.teams.map((t) => [t.id, t]))
  return roundMatches(league, competitionId, round).map((m) => {
    const h = T.get(m.home_team_id), a = T.get(m.away_team_id)
    const played = isPlayed(m)
    const time = m.date ? m.date.slice(11, 16) : ''
    const pitch = m.pitch?.match(/\d+/)?.[0]
    return {
      tag: pitch ? `T${pitch}` : time || '—',
      home: { name: upper(h?.short_name || h?.name || '?'), logo: tileLogo(h, true), logoBg: logoPlate(h).bg, color: h?.primary_color },
      away: { name: upper(a?.short_name || a?.name || '?'), logo: tileLogo(a, true), logoBg: logoPlate(a).bg, color: a?.primary_color },
      score: played ? `${m.home_score ?? 0} - ${m.away_score ?? 0}` : time || 'vs',
      sub: m.forfeit_team_id ? 'T.V.' : m.penalties && m.home_pens != null && m.away_pens != null ? `t.a.b. ${m.home_pens}-${m.away_pens}` : undefined,
    }
  })
}

// ---------------------------------------------------------------------------
//  Classement après la journée
// ---------------------------------------------------------------------------
export interface WeeklyStandingRow extends StandingRow { name: string; short: string; logo?: string; logoBg?: string; color?: string }
/** Classement après la journée choisie, TOUTES les équipes de la compétition (aucune limite de lignes).
 *  Pré-saison : même classement que la page Classement (départage spécifique : force des adversaires, tirage). */
export function weeklyStandingsInfo(league: LeagueData, competitionId: string, round: number): { rows: WeeklyStandingRow[]; masterSize?: number; provisional: boolean } {
  const T = new Map(league.teams.map((t) => [t.id, t]))
  const comp = league.competitions.find((c) => c.id === competitionId)
  const deco = (r: StandingRow) => { const t = T.get(r.team_id); return { ...r, name: upper(t?.name ?? '?'), short: upper(t?.short_name ?? ''), logo: tileLogo(t, true), logoBg: logoPlate(t).bg, color: t?.primary_color } }
  if (comp?.phase === 'league_phase' && comp.format === 'swiss') {
    const ps = comp.preseason ?? {}
    const cfg = resolvePreseasonConfig({ ...PRESEASON_DEFAULTS, ...(ps.config ?? {}) })
    const teamIds = comp.team_ids ?? []
    const pm: PMatch[] = league.matches.filter((m) => m.competition_id === competitionId && m.status !== 'cancelled' && (m.round ?? 0) <= round)
      .map((m) => ({ id: m.id, round: m.round ?? 0, home: m.home_team_id, away: m.away_team_id, hs: m.home_score, as: m.away_score, played: isDisputed(m), reason: m.pairing_reason }))
    const rests = Object.fromEntries(Object.entries(ps.rests ?? {}).map(([k, v]) => [Number(k), v]))
    const drawOrder = ps.tiebreak_order ?? ps.draw_order ?? [...teamIds].sort()
    const st = preseasonState(teamIds, pm, rests, cfg, drawOrder, activeAdjustments(league.adjustments, comp.id))
    const byId = new Map(st.ranking.map((r) => [r.team_id, r]))
    const ranking = ps.final_ranking && st.finished ? ps.final_ranking.map((id, i) => ({ ...byId.get(id)!, rank: i + 1 })).filter((r) => r.team_id) : st.ranking
    const rows = ranking.map((r) => deco({ team_id: r.team_id, rank: r.rank, played: r.played, won: r.won, drawn: r.drawn, lost: r.lost, gf: r.gf, ga: r.ga, gd: r.diff, points: r.points, yellow: 0, red: 0, form: [], adjustments: r.adjustments }))
    return { rows, masterSize: ps.split?.master_size ?? cfg.masterSize, provisional: !ps.final_ranking }
  }
  return { rows: competitionStandings(league, competitionId, { beforeRound: round + 1 }).map(deco), provisional: false }
}
export function weeklyStandings(league: LeagueData, competitionId: string, round: number): WeeklyStandingRow[] {
  return weeklyStandingsInfo(league, competitionId, round).rows
}

// ---------------------------------------------------------------------------
//  Top 10 de la journée
// ---------------------------------------------------------------------------
export type TopKind = 'xp' | 'goals' | 'assists' | 'keepers'
export const TOP_KINDS: TopKind[] = ['xp', 'goals', 'assists', 'keepers']
export const TOP_LABEL: Record<TopKind, string> = { xp: 'TOP 10 JOUEURS', goals: 'TOP 10 BUTEURS', assists: 'TOP 10 PASSEURS', keepers: 'TOP 10 GARDIENS' }
export const TOP_CARD_LABEL: Record<TopKind, string> = { xp: 'Top 10 joueurs (XP)', goals: 'Top 10 buteurs', assists: 'Top 10 passeurs', keepers: 'Top 10 gardiens' }
// unités au singulier / pluriel (jamais tronquées : « 3 PASSES » plutôt que « 3 PASSES D. »)
export const TOP_UNIT: Record<TopKind, [string, string]> = { xp: ['XP', 'XP'], goals: ['BUT', 'BUTS'], assists: ['PASSE', 'PASSES'], keepers: ['ARRÊT', 'ARRÊTS'] }
export interface TopEntry { player: Player; team?: Team; value: number; xp: number; rank: number; display: string; name: string }
/** « journée » : uniquement la journée choisie ; « cumul » : de la 1re journée de la compétition à la journée choisie */
export type TopPeriod = 'round' | 'cumul'

const KEEPER_KEYS = new Set(['clean_sheet_gk', 'save', 'penalty_saved', 'shootout_saved', 'goal_conceded_gk'])

/** Matchs joués pris en compte : la journée choisie, ou le cumul jusqu'à elle (même compétition). */
export function topMatches(league: Pick<LeagueData, 'matches'>, competitionId: string, round: number, period: TopPeriod = 'round') {
  return league.matches.filter((m) => m.competition_id === competitionId && m.status !== 'cancelled' && isPlayed(m) && m.round != null && (period === 'cumul' ? m.round <= round : m.round === round))
}

/**
 * Top 10 de la journée (ou du cumul) et de la compétition choisies :
 *  - xp : XP gagnés ; - goals : buts ; - assists : passes décisives ; - keepers : arrêts (départage : XP de gardien).
 * Buteurs : ni buts contre son camp, ni tirs au but, ni matchs sur tapis vert (forfait) ; le Match des capitaines
 * (données séparées) n'est jamais lu. Départage : moins de matchs joués, plus de tirs cadrés, plus de passes, nom.
 * Autres : XP de la période, puis ordre alphabétique. Valeur nulle exclue.
 */
export function weeklyTop(league: LeagueData & XPData, competitionId: string, round: number, kind: TopKind, n = 10, period: TopPeriod = 'round'): TopEntry[] {
  const ms = topMatches(league, competitionId, round, period)
  const P = new Map(league.players.map((p) => [p.id, p])), T = new Map(league.teams.map((t) => [t.id, t]))
  const xp = new Map<string, number>(), kxp = new Map<string, number>(), assists = new Map<string, number>(), saves = new Map<string, number>(), goals = new Map<string, number>()
  const add = (m: Map<string, number>, k: string, v: number) => m.set(k, (m.get(k) ?? 0) + v)
  const teamOf = new Map<string, string>()
  for (const m of ms) {
    const cfg = xpConfig(league.xpRules, m.season_id)
    for (const l of matchXPLines(league, m, cfg)) { add(xp, l.player_id, l.points); if (KEEPER_KEYS.has(l.key)) add(kxp, l.player_id, l.points) }
    const evs = league.events.filter((e) => e.match_id === m.id && e.period !== 'PENS')
    for (const e of evs) if (e.type === 'goal' && e.related_player_id && e.related_player_id !== e.player_id) { add(assists, e.related_player_id, 1); teamOf.set(e.related_player_id, e.team_id) }
    // buts : type « goal » seulement (CSC exclus), hors tirs au but (PENS) et hors tapis vert (forfait)
    if (!m.forfeit_team_id) for (const e of evs) if (e.type === 'goal' && e.player_id) { add(goals, e.player_id, 1); teamOf.set(e.player_id, e.team_id) }
    for (const tid of [m.home_team_id, m.away_team_id]) {
      const lu = league.lineups.find((l) => l.match_id === m.id && l.team_id === tid)
      for (const k of keeperMatchStats(m, lu, evs, tid)) { add(saves, k.player_id, k.saves); teamOf.set(k.player_id, tid); if (!kxp.has(k.player_id)) kxp.set(k.player_id, 0) }
    }
  }
  const nameOf = (pid: string) => `${P.get(pid)!.last_name} ${P.get(pid)!.first_name}`
  let list: { pid: string; v: number; x: number }[]
  if (kind === 'goals') {
    // matchs joués et tirs cadrés sur la même période (statistiques du site)
    const ids = new Set(ms.map((m) => m.id))
    const st = computePlayerXP({ ...league, matches: ms, events: league.events.filter((e) => ids.has(e.match_id)) }, {})
    list = [...goals.entries()].filter(([pid, v]) => P.has(pid) && v > 0)
      .map(([pid, v]) => ({ pid, v, x: xp.get(pid) ?? 0, mj: st.get(pid)?.matches ?? 1, ot: st.get(pid)?.shot.on_target ?? 0, a: assists.get(pid) ?? 0, name: nameOf(pid) }))
      .sort((a, b) => b.v - a.v || a.mj - b.mj || b.ot - a.ot || b.a - a.a || a.name.localeCompare(b.name, 'fr'))
  } else {
    const src = kind === 'xp' ? xp : kind === 'assists' ? assists : saves
    const tie = kind === 'keepers' ? kxp : xp
    list = [...src.entries()].filter(([pid, v]) => P.has(pid) && (kind === 'keepers' ? v > 0 || (kxp.get(pid) ?? 0) > 0 : v > 0))
      .map(([pid, v]) => ({ pid, v, t: tie.get(pid) ?? 0, x: xp.get(pid) ?? 0, name: nameOf(pid) }))
      .sort((a, b) => b.v - a.v || b.t - a.t || b.x - a.x || a.name.localeCompare(b.name, 'fr'))
  }
  const [one, many] = TOP_UNIT[kind]
  // départage complet : rangs distincts
  return list.slice(0, n).map((e, i) => {
    const rank = i + 1
    const p = P.get(e.pid)!
    const team = T.get(teamOf.get(e.pid) ?? p.team_id) ?? T.get(p.team_id)
    const value = e.v
    return { player: p, team, value, xp: e.x, rank, name: shortName(p), display: kind === 'xp' ? `${value > 0 ? '+' : ''}${value} XP` : `${value} ${Math.abs(value) > 1 ? many : one}` }
  })
}

/** Lignes du texte de publication d'un Top 10 : « 1. A. Mazrhi (Attijariwafa bank) – 4 buts » */
export function topCaptionLines(top: TopEntry[], n = 3) {
  return top.slice(0, n).map((e) => `${e.rank}. ${e.player.first_name.trim().charAt(0)}. ${e.player.last_name.trim().replace(/\S+/g, (w) => w.charAt(0) + w.slice(1).toLocaleLowerCase('fr-FR'))} (${e.team?.name ?? ''}) – ${e.display.toLocaleLowerCase('fr-FR')}`)
}

/** Textes de publication des visuels de la semaine. */
export function weeklyCaption(kind: 'resultats' | 'classement' | TopKind, comp: string, round: number, lines: string[] = [], period: TopPeriod = 'round') {
  const when = period === 'cumul' ? `cumul J1 à J${round}` : `J${round}`
  const head = kind === 'resultats' ? `⚽ RÉSULTATS | ${comp} · J${round}` : kind === 'classement' ? `📊 CLASSEMENT | ${comp} · après la J${round}` : `${kind === 'goals' ? '⚽' : '🏅'} ${TOP_LABEL[kind]} | ${comp} · ${when}`
  return [head, ...lines, '', '#MoroccoBusinessLeague #MBL #Ardentia #FootEntreprise'].join('\n')
}

// Lignes du classement / des résultats : AUCUNE limite — le nombre de lignes suit les données ; elles se
// répartissent entre y = 274 et y = 1222 (hauteur de la barre orange) ; tailles ajustées à la hauteur de ligne.
const ROWS_TOP = 274, ROWS_BOTTOM = 1222
export function weeklyRowsLayout(n: number, maxStep = 59) {
  const step = Math.min(maxStep, (ROWS_BOTTOM - ROWS_TOP) / Math.max(1, n))
  const big = maxStep > 59
  const h = Math.round(Math.max(24, Math.min(step * 0.6, big ? 52 : 35)))
  return {
    n, step, h,
    top: (i: number) => ROWS_TOP + i * step,
    /** taille du nom d'équipe (≥ 24 px : lisible sur téléphone) */
    name: Math.round(Math.max(24, Math.min(step * 0.66, big ? 46 : 30))),
    logo: Math.round(Math.min(step * 0.86, big ? 70 : 50)),
    stats: Math.round(Math.max(16, Math.min(step * 0.42, big ? 28 : 22))),
    pillFont: Math.round(Math.max(18, Math.min(h * 0.8, big ? 40 : 28))),
  }
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

// Données des visuels « Résultat » et « Homme du match » (fonctions PURES, testées) :
// buteurs groupés, ligne t.a.b. / tapis vert, choix automatique de l'homme du match, texte de publication,
// empreinte (hash) qui change dès que le score, les buteurs, l'homme du match ou la mise en page changent.
import type { Competition, Match, MatchEvent, Player, Team } from '@/types/entities'
import { matchXPLines, xpConfig, type XPData } from '@/lib/xp'
import { playerMatchShots } from '@/lib/shots'
import { fmtMinute } from '@/lib/matchEngine'
import { fmtDate, fmtTime } from '@/lib/format'

export interface ScorerLine { text: string }
/** Ligne du visuel résultat : « A.MAZRHI » + cartons + un ballon par but ; ligne « (C.S.C) » côté bénéficiaire. */
export interface ResultRow { name: string; goals: number; yellow: number; red: number; og?: boolean }
export interface ResultModel {
  competition: string
  home: { name: string; short: string; logo?: string }
  away: { name: string; short: string; logo?: string }
  homeScore: number; awayScore: number
  /** « t.a.b. 4-3 » ou « TAPIS VERT » */
  sub?: string
  forfeit: boolean
  homeScorers: string[]; awayScorers: string[]
  /** une colonne par équipe (refonte : ballons, cartons, C.S.C) */
  homeRows: ResultRow[]; awayRows: ResultRow[]
  /** tirs au but, affichés entre parenthèses sous le score */
  homePens?: number; awayPens?: number
  footer: string
}
export interface MvpModel {
  competition: string
  scoreLine: { home: string; away: string; homeShort?: string; awayShort?: string; homeLogo?: string; awayLogo?: string; score: string }
  firstName: string; lastName: string
  team: { name: string; logo?: string }
  photo?: { url: string; cutout: boolean }
  captain: boolean
  keeper: boolean
  stats: { label: string; value: string }[]
  xp: number
}

const upper = (s: string) => s.toLocaleUpperCase('fr-FR')
const KNOCKOUT_LABEL: Partial<Record<NonNullable<Match['stage']>, string>> = { round_of_16: 'Huitième de finale', quarter: 'Quart de finale', semi: 'Demi-finale', third_place: 'Petite finale', final: 'Finale' }

export function competitionLabel(m: Match, comp?: Competition) {
  const knockout = m.stage ? KNOCKOUT_LABEL[m.stage] : undefined
  return upper([comp?.name, knockout ?? (m.round ? `J${m.round}` : undefined)].filter(Boolean).join(' · '))
}

export const isForfeit = (m: Match) => !!m.forfeit_team_id && (m.forfeit_team_id === m.home_team_id || m.forfeit_team_id === m.away_team_id)

/** Buteurs d'une équipe, groupés par joueur : « Lamghari 12', 31' » ; csc et inconnus à part. Max N lignes + « +K autres ». */
export function scorerLines(m: Match, events: MatchEvent[], teamId: string, players: Map<string, Player>, max = 5) {
  if (isForfeit(m)) return []
  const order = ['1H', '2H', 'ET1', 'ET2']
  const goals = events
    .filter((e) => e.match_id === m.id && e.period !== 'PENS' && ((e.type === 'goal' && e.team_id === teamId) || (e.type === 'own_goal' && e.team_id !== teamId)))
    .sort((a, b) => order.indexOf(a.period ?? '1H') - order.indexOf(b.period ?? '1H') || (a.minute ?? 0) - (b.minute ?? 0))
  const groups = new Map<string, { name: string; mins: string[]; n: number }>()
  for (const e of goals) {
    const p = e.player_id ? players.get(e.player_id) : undefined
    const base = p ? p.last_name : e.player_name_free || (e.type === 'own_goal' ? 'Contre son camp' : 'But')
    const key = e.type === 'own_goal' ? `csc:${e.player_id ?? e.id}` : p ? p.id : `x:${e.id}`
    const name = e.type === 'own_goal' ? `${base} (csc)` : base
    if (!groups.has(key)) groups.set(key, { name, mins: [], n: 0 })
    groups.get(key)!.n++
    const min = fmtMinute(e.minute, e.added_minute)
    if (min) groups.get(key)!.mins.push(e.goal_kind === 'penalty' ? `${min} (s.p.)` : min)
  }
  // minutes si elles sont connues (« Lamghari 12', 31' »), sinon nombre de buts (« Afakhar ×8 »)
  const lines = [...groups.values()].map((g) => (g.mins.length ? `${g.name} ${g.mins.join(', ')}` : g.n > 1 ? `${g.name} ×${g.n}` : g.name))
  if (lines.length <= max) return lines
  const rest = lines.length - (max - 1)
  return [...lines.slice(0, max - 1), `+${rest} autre${rest > 1 ? 's' : ''}`]
}

/** « A.MAZRHI » : initiale du prénom + nom en capitales */
export function shortName(p?: Pick<Player, 'first_name' | 'last_name'> | null, free?: string) {
  if (!p) return upper(free ?? '?')
  const first = p.first_name.trim().charAt(0)
  return upper(`${first ? `${first}.` : ''}${p.last_name.trim()}`)
}

/**
 * Lignes d'une équipe : un joueur par ligne avec ses buts (hors t.a.b.) et ses cartons ; les buts contre son camp
 * de l'adversaire sont regroupés sur une ligne « (C.S.C) » du côté de l'équipe qui en profite.
 * Tri : buteurs (plus de buts d'abord), puis la ligne C.S.C, puis les joueurs seulement avertis / exclus.
 */
export function resultRows(m: Match, events: MatchEvent[], teamId: string, players: Map<string, Player>): ResultRow[] {
  if (isForfeit(m)) return []
  const evs = events.filter((e) => e.match_id === m.id && e.period !== 'PENS')
  const rows = new Map<string, ResultRow & { order: number }>()
  const row = (key: string, name: string, order: number) => { if (!rows.has(key)) rows.set(key, { name, goals: 0, yellow: 0, red: 0, order }); return rows.get(key)! }
  let i = 0
  for (const e of evs.filter((x) => x.team_id === teamId)) {
    const key = e.player_id ?? `free:${e.player_name_free ?? e.id}`
    const name = shortName(e.player_id ? players.get(e.player_id) : undefined, e.player_name_free)
    if (e.type === 'goal') row(key, name, i++).goals++
    else if (e.type === 'yellow_card') row(key, name, i++).yellow++
    else if (e.type === 'second_yellow') { const r = row(key, name, i++); r.yellow++; r.red++ }
    else if (e.type === 'red_card') row(key, name, i++).red++
  }
  const og = evs.filter((e) => e.type === 'own_goal' && e.team_id !== teamId).length
  const list = [...rows.values()]
  const scorers = list.filter((r) => r.goals > 0).sort((a, b) => b.goals - a.goals || a.order - b.order)
  const carded = list.filter((r) => r.goals === 0).sort((a, b) => a.order - b.order)
  const strip = (r: ResultRow): ResultRow => ({ name: r.name, goals: r.goals, yellow: r.yellow, red: r.red })
  return [...scorers.map(strip), ...(og ? [{ name: '(C.S.C)', goals: og, yellow: 0, red: 0, og: true }] : []), ...carded.map(strip)]
}

export function footerLine(m: Match) {
  return upper([fmtDate(m.date, 'EEE d MMM'), fmtTime(m.date), m.pitch].filter(Boolean).join(' · '))
}

export interface VisualData {
  match: Match
  teams: Map<string, Team>
  players: Map<string, Player>
  competition?: Competition
  events: MatchEvent[]
}

export function buildResultModel({ match: m, teams, players, competition, events }: VisualData): ResultModel {
  const h = teams.get(m.home_team_id), a = teams.get(m.away_team_id)
  const forfeit = isForfeit(m)
  const hs = forfeit ? (m.forfeit_team_id === m.home_team_id ? 0 : 3) : m.home_score ?? 0
  const as = forfeit ? (m.forfeit_team_id === m.away_team_id ? 0 : 3) : m.away_score ?? 0
  const pens = m.penalties && m.home_pens != null && m.away_pens != null ? `T.A.B. ${m.home_pens}-${m.away_pens}` : undefined
  return {
    competition: competitionLabel(m, competition),
    home: { name: upper(h?.name ?? 'Domicile'), short: h?.short_name ?? '', logo: h?.logo_url },
    away: { name: upper(a?.name ?? 'Extérieur'), short: a?.short_name ?? '', logo: a?.logo_url },
    homeScore: hs, awayScore: as,
    sub: forfeit ? 'TAPIS VERT' : pens,
    forfeit,
    homeScorers: scorerLines(m, events, m.home_team_id, players),
    awayScorers: scorerLines(m, events, m.away_team_id, players),
    homeRows: resultRows(m, events, m.home_team_id, players),
    awayRows: resultRows(m, events, m.away_team_id, players),
    ...(pens && !forfeit ? { homePens: m.home_pens!, awayPens: m.away_pens! } : {}),
    footer: footerLine(m),
  }
}

/** XP gagnés par joueur dans un match (avec ou sans le bonus homme du match). */
export function matchXPByPlayer(data: XPData, m: Match, withMotm = true) {
  const cfg = xpConfig(data.xpRules, m.season_id)
  const out = new Map<string, number>()
  for (const l of matchXPLines(data, m, cfg)) if (withMotm || l.key !== 'motm') out.set(l.player_id, (out.get(l.player_id) ?? 0) + l.points)
  return out
}

/**
 * Homme du match proposé : le plus d'XP gagnés dans le match (hors bonus homme du match),
 * à égalité : plus de buts, puis plus de passes, puis joueur de l'équipe gagnante.
 */
export function suggestMotm(data: XPData, m: Match): { player_id: string; xp: number } | undefined {
  const motmless = { ...m, motm_player_id: undefined }
  const xp = matchXPByPlayer(data, motmless, false)
  const evs = data.events.filter((e) => e.match_id === m.id && e.period !== 'PENS')
  const goals = (pid: string) => evs.filter((e) => e.type === 'goal' && e.player_id === pid).length
  const assists = (pid: string) => evs.filter((e) => e.type === 'goal' && e.related_player_id === pid && e.player_id !== pid).length
  const winner = (m.home_score ?? 0) > (m.away_score ?? 0) ? m.home_team_id : (m.away_score ?? 0) > (m.home_score ?? 0) ? m.away_team_id : undefined
  const teamOf = (pid: string) => data.players.find((p) => p.id === pid)?.team_id
  const ranked = [...xp.entries()].map(([player_id, v]) => ({ player_id, xp: v, g: goals(player_id), a: assists(player_id), w: winner && teamOf(player_id) === winner ? 1 : 0 }))
    .sort((x, y) => y.xp - x.xp || y.g - x.g || y.a - x.a || y.w - x.w || x.player_id.localeCompare(y.player_id))
  return ranked[0] ? { player_id: ranked[0].player_id, xp: ranked[0].xp } : undefined
}

export function buildMvpModel(d: VisualData & { xp: XPData }, playerId: string): MvpModel | undefined {
  const { match: m, teams, players, competition, events } = d
  const p = players.get(playerId)
  if (!p) return undefined
  const r = buildResultModel(d)
  const team = teams.get(p.team_id)
  const keeper = p.position === 'GK'
  const evs = events.filter((e) => e.match_id === m.id && e.period !== 'PENS')
  const goals = evs.filter((e) => e.type === 'goal' && e.player_id === p.id).length
  const assists = evs.filter((e) => e.type === 'goal' && e.related_player_id === p.id && e.player_id !== p.id).length
  const xp = matchXPByPlayer(d.xp, m).get(p.id) ?? 0
  const stats: MvpModel['stats'] = []
  if (keeper) {
    const saves = evs.filter((e) => e.type === 'save' && e.player_id === p.id).length
    const conceded = p.team_id === m.home_team_id ? r.awayScore : r.homeScore
    stats.push({ label: saves > 1 ? 'Arrêts' : 'Arrêt', value: String(saves) }, { label: conceded > 1 ? 'Buts encaissés' : 'But encaissé', value: String(conceded) })
    if (goals) stats.push({ label: goals > 1 ? 'Buts' : 'But', value: String(goals) })
  } else {
    stats.push({ label: goals > 1 ? 'Buts' : 'But', value: String(goals) }, { label: assists > 1 ? 'Passes déc.' : 'Passe déc.', value: String(assists) })
    const shots = playerMatchShots(evs, p.team_id)?.get(p.id)
    if (shots) stats.push({ label: 'Tirs cadrés', value: String(shots.on_target) })
  }
  stats.push({ label: 'XP gagnés', value: `${xp > 0 ? '+' : ''}${xp}` })
  const captain = !!p.is_captain || team?.captain_player_id === p.id
  const photo = p.photo_card_mode !== 'original' && p.photo_cutout_url ? { url: p.photo_cutout_url, cutout: true } : p.photo_url ? { url: p.photo_url, cutout: false } : undefined
  return {
    competition: competitionLabel(m, competition),
    scoreLine: { home: r.home.name, away: r.away.name, homeShort: r.home.short.toLocaleUpperCase('fr-FR'), awayShort: r.away.short.toLocaleUpperCase('fr-FR'), homeLogo: r.home.logo, awayLogo: r.away.logo, score: `${r.homeScore} - ${r.awayScore}` },
    firstName: upper(p.first_name), lastName: upper(p.last_name),
    team: { name: upper(team?.name ?? ''), logo: team?.logo_url },
    photo, captain, keeper, stats, xp,
  }
}

/** Texte de publication Instagram / LinkedIn. */
export function captionText(d: VisualData, motm?: Player) {
  const { match: m, teams, competition } = d
  const r = buildResultModel(d)
  const h = teams.get(m.home_team_id), a = teams.get(m.away_team_id)
  const comp = [competition?.name, m.stage && KNOCKOUT_LABEL[m.stage] ? KNOCKOUT_LABEL[m.stage] : m.round ? `J${m.round}` : ''].filter(Boolean).join(' · ')
  const lines = [`🔥 RÉSULTAT | ${comp}`, `${h?.name ?? ''} ${r.homeScore} - ${r.awayScore} ${a?.name ?? ''}${r.sub && !r.forfeit ? ` (${r.sub.toLowerCase()})` : ''}`]
  if (r.forfeit) lines.push(`🟩 Victoire sur tapis vert (forfait : ${teams.get(m.forfeit_team_id!)?.name ?? '—'})`)
  const list = (teamId: string) => {
    const by = new Map<string, number>()
    for (const e of d.events.filter((x) => x.match_id === m.id && x.type === 'goal' && x.team_id === teamId && x.period !== 'PENS')) {
      const n = d.players.get(e.player_id ?? '')?.last_name ?? e.player_name_free ?? '?'
      by.set(n, (by.get(n) ?? 0) + 1)
    }
    return [...by.entries()].map(([n, k]) => (k > 1 ? `${n} ×${k}` : n)).join(', ')
  }
  const hs = list(m.home_team_id), as = list(m.away_team_id)
  if (!r.forfeit && (hs || as)) lines.push(`⚽ ${[hs && `${h?.short_name ?? h?.name} : ${hs}`, as && `${a?.short_name ?? a?.name} : ${as}`].filter(Boolean).join(' · ')}`)
  if (motm) lines.push(`🏆 Homme du match : ${motm.first_name} ${motm.last_name} (${teams.get(motm.team_id)?.short_name ?? teams.get(motm.team_id)?.name ?? ''})`)
  lines.push('', '#MoroccoBusinessLeague #MBL #Ardentia #FootEntreprise')
  return lines.join('\n')
}

/** Empreinte du contenu : change dès qu'une donnée affichée change (score, buteurs, homme du match, photo, modèle, mise en page). */
export function visualHash(parts: unknown[]) {
  const s = JSON.stringify(parts)
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}
export function matchVisualHash(d: VisualData, cfgVersion: number, mvpTemplate: string, motm?: MvpModel) {
  return visualHash([cfgVersion, mvpTemplate, buildResultModel(d), motm ?? null])
}

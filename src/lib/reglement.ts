// ============================================================================
//  RÈGLEMENT OFFICIEL ARDENTIA — module de règles unique de la plateforme.
//  Classement, admin, stats, match centre, mode TV et page /reglement lisent ce fichier :
//  aucune valeur réglementaire n'est codée ailleurs. Chaque règle porte son article.
//  Fonctions PURES (testées dans reglement.test.ts).
// ============================================================================
import type { Competition, Lineup, Match, MatchEvent, Period, Player, Season, Suspension } from '@/types/entities'

// ---------------------------------------------------------------------------
//  Articles (liens /reglement#art-17-3)
// ---------------------------------------------------------------------------
export const artAnchor = (ref: string) => `art-${ref.replace(/\./g, '-')}`
export const artHref = (ref: string) => `/reglement#${artAnchor(ref)}`
export const artLabel = (ref: string) => `Art. ${ref}`

// ---------------------------------------------------------------------------
//  Constantes réglementaires
// ---------------------------------------------------------------------------
export const REGLEMENT = {
  format: {
    playersOnPitch: 6, // dont 1 gardien obligatoire
    maxSubstitutes: 6,
    maxSheet: 12,
    minPlayers: 4, // pour débuter et pour continuer
    unlimitedSubstitutions: true,
    art: '2.1', artMin: '2.2', artSubs: '2.4',
  },
  duration: {
    halves: 2, halfMin: 20, halftimeMaxMin: 5, effectiveTime: true, maxStoppagesMin: 10,
    extraTime: false, // pas de prolongation : égalité en phase éliminatoire → tirs au but directement
    art: '5.1', artExtraTime: '5.5',
  },
  offside: { applies: false, art: '7' },
  throwIn: { byFoot: true, art: '8.2' },
  points: { win: 3, draw: 1, loss: 0, art: '17.2' },
  forfeit: { score: [3, 0] as const, graceMin: 15, art: '14.1', artUnderMin: '14.2', artGeneral: '14.3', artAbandon: '18.1' },
  cards: {
    /** 2 jaunes dans le même match = rouge ; pas de cumul d'un match à l'autre (v8) */
    yellowsForRed: 2,
    /** aucune suspension automatique après un rouge : seul le conseil de discipline suspend (v8) */
    autoSuspension: false,
    artYellow: '11.5', artRed: '11.6', artBench: '2.5', artCorrection: '11.7',
  },
  inferiority: { ms: 2 * 60_000, art: '2.7' },
  shootout: { kicksPerSide: 5, art: '13' },
  protest: { hours: 24, art: '17.4' },
  registration: { noticeHours: 48, art: '2.3' },
} as const

export const MATCH_MINUTES = REGLEMENT.duration.halves * REGLEMENT.duration.halfMin

/** Critères de départage (Art. 17.3), dans l'ordre exact. */
export const TIEBREAKERS = [
  { key: 'points', label: 'Points', short: 'points' },
  { key: 'h2h', label: 'Confrontation directe', short: 'confrontation directe' },
  { key: 'gd', label: 'Différence de buts générale', short: 'différence de buts' },
  { key: 'gf', label: 'Buts marqués', short: 'buts marqués' },
  { key: 'yellow', label: 'Moins de cartons jaunes', short: 'moins de cartons jaunes' },
  { key: 'red', label: 'Moins de cartons rouges', short: 'moins de cartons rouges' },
  { key: 'draw', label: 'Tirage au sort par Ardentia', short: 'tirage au sort' },
] as const
export type TiebreakKey = (typeof TIEBREAKERS)[number]['key']
export const TIEBREAK_ART = '17.3'

/** « L'essentiel en 1 minute » (page Règlement) */
export const ESSENTIALS: { text: string; art: string }[] = [
  { text: '6 contre 6 (1 gardien obligatoire), 6 remplaçants au plus, changements illimités', art: '2.1' },
  { text: '2 × 20 minutes de temps de jeu effectif, pas de prolongation', art: '5.1' },
  { text: 'Pas de hors-jeu', art: '7' },
  { text: 'Touches au pied', art: '8.2' },
  { text: 'Pré-saison en système suisse : J1 tirée au sort, puis adversaires aux points proches, sans revanche · 4 matchs par équipe', art: '17.1' },
  { text: 'Après la pré-saison : places 1 à 12 → MASTER, places 13 à 23 → CHALLENGER', art: '17.1' },
  { text: 'Victoire 3 pts · Nul 1 pt · Défaite 0 pt', art: '17.2' },
  { text: 'Forfait = défaite 3-0', art: '14.1' },
  { text: 'Départage MASTER / CHALLENGER : points, confrontation directe, différence de buts, buts marqués, moins de jaunes, moins de rouges, tirage au sort', art: '17.3' },
  { text: '2 jaunes dans le même match = rouge · Pas de cumul de jaunes d’un match à l’autre', art: '11.5' },
  { text: 'Pas de suspension automatique : seul le conseil de discipline (Ardentia, Sifflé d’Or, capitaines de l’autre division) suspend un joueur', art: '19' },
  { text: 'Réclamation sous 24 h après le coup de sifflet final', art: '17.4' },
]

// ---------------------------------------------------------------------------
//  Versions du règlement (une saison = une version)
// ---------------------------------------------------------------------------
export interface RulebookRules {
  /** v8+ : pas de cumul de jaunes ni de suspension automatique ; seul le conseil de discipline suspend (Art. 11.5, 11.6, 19).
   *  Sinon (anciennes saisons) : suspensions saisies à la main. Le cumul automatique de la v4 a été abandonné. */
  council: boolean
}
export const RULEBOOK_RULES: Record<string, RulebookRules> = {
  v3: { council: false },
  v4: { council: false },
  v8: { council: true },
  v9: { council: true },
}
export const CURRENT_RULEBOOK = 'v9'
/** Règles de cartons d'une saison : celles de sa version du règlement (les saisons sans version gardent l'ancien régime manuel). */
export function rulesForSeason(season?: Pick<Season, 'rulebook_version'> | null): RulebookRules {
  return RULEBOOK_RULES[season?.rulebook_version ?? ''] ?? { council: false }
}

/** Contrôle de cohérence texte ↔ constantes (avertissement dans l'admin). */
export function coherenceWarnings(text: string): string[] {
  const t = text.toLowerCase().replace(/\s+/g, ' ')
  const checks: [boolean, string][] = [
    [/deux \(2\) périodes de vingt \(20\) minutes/.test(t), `Durée : le texte ne mentionne plus « deux (2) périodes de vingt (20) minutes » (constante : ${REGLEMENT.duration.halves} × ${REGLEMENT.duration.halfMin} min).`],
    [/victoire : 3 points/.test(t) && /match nul : 1 point/.test(t), `Points : le texte ne mentionne plus « Victoire : 3 points » / « Match nul : 1 point » (constantes : ${REGLEMENT.points.win}/${REGLEMENT.points.draw}/${REGLEMENT.points.loss}).`],
    [/3-0/.test(t), 'Forfait : le score « 3-0 » n’apparaît plus dans le texte.'],
    [/ne se cumulent pas d'un match à l'autre|ne se cumulent pas d’un match à l’autre/.test(t), 'Cartons : le texte ne dit plus que les jaunes ne se cumulent pas d’un match à l’autre (Art. 11.5).'],
    [/n'entraîne pas de suspension automatique|n’entraîne pas de suspension automatique/.test(t), 'Cartons : le texte ne dit plus qu’un rouge n’entraîne pas de suspension automatique (Art. 11.6).'],
    [/seuls les capitaines de la ligue qui n'est pas concernée|seuls les capitaines de la ligue qui n’est pas concernée/.test(t), 'Conseil de discipline : le texte ne précise plus quels capitaines votent (Art. 19.3).'],
    [/confrontation directe/.test(t) && t.indexOf('confrontation directe') < t.indexOf('différence de buts :'), 'Départage : la confrontation directe doit précéder la différence de buts (Art. 17.3).'],
    [/hors-jeu ne s'applique pas|hors-jeu ne s’applique pas/.test(t), 'Hors-jeu : le texte ne dit plus que le hors-jeu ne s’applique pas.'],
    [/pas de prolongation/.test(t), 'Prolongation : le texte ne dit plus qu’il n’y a pas de prolongation.'],
    [/vingt-quatre \(24\) heures/.test(t), 'Réclamations : le délai de 24 h n’apparaît plus.'],
  ]
  return checks.filter(([ok]) => !ok).map(([, msg]) => msg)
}

// ---------------------------------------------------------------------------
//  Matchs comptés
// ---------------------------------------------------------------------------
/** Match disputé (ou réglé sur tapis vert) : compte au classement et pour purger une suspension. Reporté / annulé : non. */
export const isDisputed = (m: Match) =>
  m.status === 'finished' && typeof m.home_score === 'number' && typeof m.away_score === 'number' && m.published !== false

const byDate = (a: Match, b: Match) => (a.date ?? '').localeCompare(b.date ?? '') || (a.round ?? 0) - (b.round ?? 0) || a.id.localeCompare(b.id)

// ---------------------------------------------------------------------------
//  Classement (Art. 17.2, 17.3)
// ---------------------------------------------------------------------------
export interface TableRow { team_id: string; points: number; gd: number; gf: number; yellow: number; red: number }
type MiniFn = (ids: string[]) => Map<string, { points: number; gd: number; gf: number }>

export interface RankedRow<R extends TableRow> { row: R; reason?: TiebreakReason }
/** Pourquoi une équipe est classée derrière celle du dessus à égalité de points */
export interface TiebreakReason { key: TiebreakKey; above: string; detail: string; pending?: boolean }

/**
 * Tri du classement. Chaque critère ne s'applique qu'entre équipes encore à égalité.
 * Confrontation directe : mini-classement (points) sur les seuls matchs entre les équipes à égalité — à 2 comme à 3 ou plus.
 * Dernier recours : ordre fixé par tirage au sort (drawOrder), sinon ordre provisoire et `pending`.
 */
export function rankTable<R extends TableRow>(rows: R[], mini: MiniFn, drawOrder: string[] = [], name: (id: string) => string = (id) => id): RankedRow<R>[] {
  const reasons = new Map<string, TiebreakReason>()
  const value = (k: TiebreakKey, r: R, m?: ReturnType<MiniFn>) => {
    switch (k) {
      case 'points': return r.points
      case 'h2h': return m!.get(r.team_id)?.points ?? 0
      case 'gd': return r.gd
      case 'gf': return r.gf
      case 'yellow': return -r.yellow
      case 'red': return -r.red
      default: { const i = drawOrder.indexOf(r.team_id); return i < 0 ? -1e9 : -i }
    }
  }
  const describe = (k: TiebreakKey, a: R, b: R, m?: ReturnType<MiniFn>): string => {
    switch (k) {
      case 'h2h': return `confrontation directe (${m!.get(a.team_id)?.points ?? 0} pts contre ${m!.get(b.team_id)?.points ?? 0} dans les matchs entre équipes à égalité)`
      case 'gd': return `différence de buts (${a.gd > 0 ? '+' : ''}${a.gd} contre ${b.gd > 0 ? '+' : ''}${b.gd})`
      case 'gf': return `buts marqués (${a.gf} contre ${b.gf})`
      case 'yellow': return `moins de cartons jaunes (${a.yellow} contre ${b.yellow})`
      case 'red': return `moins de cartons rouges (${a.red} contre ${b.red})`
      default: return 'tirage au sort'
    }
  }
  const sort = (group: R[], ci: number): R[] => {
    if (group.length <= 1) return group
    if (ci >= TIEBREAKERS.length) return [...group].sort((a, b) => name(a.team_id).localeCompare(name(b.team_id)))
    const k = TIEBREAKERS[ci].key
    const noDraw = k === 'draw' && !group.every((r) => drawOrder.includes(r.team_id))
    if (noDraw) {
      const ordered = [...group].sort((a, b) => name(a.team_id).localeCompare(name(b.team_id)))
      ordered.slice(1).forEach((r, i) => reasons.set(r.team_id, { key: 'draw', above: ordered[i].team_id, detail: 'égalité parfaite : tirage au sort à effectuer par Ardentia (ordre provisoire alphabétique)', pending: true }))
      return ordered
    }
    const m = k === 'h2h' ? mini(group.map((r) => r.team_id)) : undefined
    const buckets = new Map<number, R[]>()
    for (const r of group) { const v = value(k, r, m); if (!buckets.has(v)) buckets.set(v, []); buckets.get(v)!.push(r) }
    const keys = [...buckets.keys()].sort((a, b) => b - a)
    const out: R[] = []
    keys.forEach((key, i) => {
      const sub = sort(buckets.get(key)!, ci + 1)
      if (i > 0 && k !== 'points') {
        const above = out[out.length - 1]
        reasons.set(sub[0].team_id, { key: k, above: above.team_id, detail: describe(k, above, sub[0], m) })
      }
      out.push(...sub)
    })
    return out
  }
  return sort(rows, 0).map((row) => ({ row, reason: reasons.get(row.team_id) }))
}

// ---------------------------------------------------------------------------
//  Discipline (règlement v8 — Art. 11.5, 11.6, 19)
//  · les jaunes ne se cumulent PAS d'un match à l'autre ; 2 jaunes dans le même match = rouge (moteur de match) ;
//  · un rouge n'entraîne AUCUNE suspension automatique ;
//  · seul le conseil de discipline suspend : chaque décision crée une ligne Suspension (kind 'council'),
//    purgée par les matchs disputés par l'équipe APRÈS la date de la décision.
//  Les anciennes saisons gardent leurs suspensions saisies à la main (purgées après le match d'origine).
// ---------------------------------------------------------------------------
export type SuspensionKind = 'council' | 'manual' | 'extra'
export const SUSPENSION_LABEL: Record<SuspensionKind, string> = {
  council: 'Décision du conseil de discipline', manual: 'Suspension', extra: 'Suspension supplémentaire (Ardentia)',
}
export const suspensionKind = (s: Pick<Suspension, 'kind'>): SuspensionKind => (s.kind === 'council' ? 'council' : s.kind === 'extra' ? 'extra' : 'manual')

export interface SuspensionRecord {
  id: string
  kind: SuspensionKind
  matches: number
  origin_match_id?: string
  case_id?: string
  /** date à partir de laquelle la suspension se purge */
  start: string
  reason?: string
  served: string[]
  art: string
}
export interface PlayerDiscipline {
  player_id: string
  team_id: string
  /** cartons de la saison (information : aucun effet automatique) */
  yellowsTotal: number
  redsTotal: number
  suspensions: SuspensionRecord[]
  /** matchs de suspension restant à purger */
  remaining: number
  /** matchs où le joueur a été aligné alors qu'il purgeait une suspension */
  violations: string[]
}

export interface DisciplineData {
  matches: Match[]
  events: MatchEvent[]
  lineups?: Lineup[]
  players: Pick<Player, 'id' | 'team_id'>[]
  /** suspensions (décisions du conseil, ou saisies à la main sur les anciennes saisons) */
  suspensions?: Suspension[]
}

/** A joué (titulaire, remplaçant inscrit ou action enregistrée) — sert à détecter un suspendu aligné. */
function appeared(m: Match, playerId: string, data: DisciplineData) {
  const lu = data.lineups?.find((l) => l.match_id === m.id && (l.starter_ids?.includes(playerId) || l.substitute_ids?.includes(playerId)))
  if (lu) return true
  return data.events.some((e) => e.match_id === m.id && (e.player_id === playerId || (e.type === 'goal' && e.related_player_id === playerId)) && e.card_target !== 'official')
}

/** Point de départ de la purge : date de la décision (conseil) ; sinon le match d'origine. */
function suspensionStart(s: Suspension, matches: Map<string, Match>) {
  if (s.kind === 'council') return s.date ?? ''
  return matches.get(s.origin_match_id ?? '')?.date ?? s.date ?? ''
}

/**
 * Discipline d'une saison : suspensions purgées dans l'ordre (la plus ancienne d'abord), un match disputé par l'équipe
 * (toutes compétitions de la saison) = un match purgé. `before` : état à la veille de ce match (feuille de match).
 */
export function computeDiscipline(seasonId: string, data: DisciplineData, opts: { before?: Pick<Match, 'id' | 'date'> } = {}) {
  const byId = new Map(data.matches.map((m) => [m.id, m]))
  const ms = data.matches.filter((m) => m.season_id === seasonId && isDisputed(m) && (!opts.before || (m.id !== opts.before.id && (m.date ?? '') < (opts.before.date ?? '\uffff')))).sort(byDate)
  const msIds = new Set(ms.map((m) => m.id))
  const teamOf = new Map(data.players.map((p) => [p.id, p.team_id]))
  const players = new Map<string, PlayerDiscipline>()
  const get = (pid: string, team?: string) => {
    let d = players.get(pid)
    if (!d) { d = { player_id: pid, team_id: teamOf.get(pid) ?? team ?? '', yellowsTotal: 0, redsTotal: 0, suspensions: [], remaining: 0, violations: [] }; players.set(pid, d) }
    return d
  }
  for (const e of data.events) {
    if (!msIds.has(e.match_id) || !e.player_id || e.card_target === 'official') continue
    if (e.type === 'yellow_card' || e.type === 'second_yellow') get(e.player_id, e.team_id).yellowsTotal++
    if (e.type === 'red_card' || e.type === 'second_yellow') get(e.player_id, e.team_id).redsTotal++
  }
  const sus = (data.suspensions ?? []).filter((s) => s.season_id === seasonId && s.player_id && s.matches > 0)
    .map((s) => ({ s, start: suspensionStart(s, byId) }))
    .sort((a, b) => a.start.localeCompare(b.start) || a.s.id.localeCompare(b.s.id))
  for (const { s, start } of sus) {
    const d = get(s.player_id, s.team_id)
    d.suspensions.push({ id: s.id, kind: suspensionKind(s), matches: s.matches, origin_match_id: s.origin_match_id, case_id: s.case_id, start, reason: s.reason, served: [], art: s.kind === 'council' ? '19' : REGLEMENT.cards.artRed })
  }
  for (const d of players.values()) {
    const used = new Set<string>()
    const teamMs = ms.filter((m) => m.home_team_id === d.team_id || m.away_team_id === d.team_id)
    for (const r of d.suspensions) {
      for (const m of teamMs) {
        if (r.served.length >= r.matches) break
        // seuls les matchs disputés APRÈS la décision (ou après le match d'origine) purgent la suspension
        if (used.has(m.id) || m.id === r.origin_match_id || (r.start && (m.date ?? '') <= r.start)) continue
        r.served.push(m.id); used.add(m.id)
        if (appeared(m, d.player_id, data)) d.violations.push(m.id)
      }
    }
    d.remaining = d.suspensions.reduce((a, r) => a + r.matches - r.served.length, 0)
  }
  return { players }
}

/** Joueurs suspendus pour un match donné (état à la veille du match). */
export function suspendedFor(match: Pick<Match, 'id' | 'date' | 'season_id' | 'home_team_id' | 'away_team_id'>, data: DisciplineData) {
  const { players } = computeDiscipline(match.season_id, data, { before: match })
  const out = new Map<string, PlayerDiscipline>()
  for (const d of players.values()) if (d.remaining > 0 && (d.team_id === match.home_team_id || d.team_id === match.away_team_id)) out.set(d.player_id, d)
  return out
}

// ---------------------------------------------------------------------------
//  Conseil de discipline (Art. 19)
// ---------------------------------------------------------------------------
export type Sanction = 'warning' | 'suspension'
export const COUNCIL = { voteHours: 8, art: '19', artVoters: '19.3', artSanctions: '19.4', artVote: '19.5', artDecision: '19.8', artCommunication: '19.9', artPv: '17.7' } as const
export const sanctionLabel = (s: Sanction, matches = 0) => (s === 'warning' ? 'Avertissement' : `Suspension de ${matches} match${matches > 1 ? 's' : ''}`)

export interface CouncilVoices {
  ardentia?: Sanction
  siffle_or?: Sanction
  /** décompte des votes des capitaines reçus dans le délai de 8 h (jamais publié) */
  captains_warning?: number
  captains_suspension?: number
}
/** Art. 19.7 : la voix des capitaines va à la sanction la plus votée ; égalité ou aucun vote → avertissement. */
export function captainsVoice(v: Pick<CouncilVoices, 'captains_warning' | 'captains_suspension'>): Sanction {
  return (v.captains_suspension ?? 0) > (v.captains_warning ?? 0) ? 'suspension' : 'warning'
}
/** Art. 19.8 : la sanction qui obtient le plus de voix (sur 3) est retenue ; égalité entre voix exprimées → avertissement. */
export function councilDecision(v: CouncilVoices): { decision: Sanction; voices: { warning: number; suspension: number } } {
  const all = [v.ardentia, v.siffle_or, captainsVoice(v)].filter(Boolean) as Sanction[]
  const voices = { warning: all.filter((x) => x === 'warning').length, suspension: all.filter((x) => x === 'suspension').length }
  return { decision: voices.suspension > voices.warning ? 'suspension' : 'warning', voices }
}
/** Fin du vote : 8 h après la publication du lien (Art. 19.5). */
export const voteClosesAt = (openedAt: string) => new Date(new Date(openedAt).getTime() + COUNCIL.voteHours * 3_600_000).toISOString()

/**
 * Art. 19.3 : votent les capitaines de la ligue non concernée (MASTER ↔ CHALLENGER).
 * `divisions` : équipes de chaque division de la saison (vide tant que la pré-saison n'est pas scindée).
 */
export function votingTeams(teamId: string, allTeams: string[], divisions: { master?: string[]; challenger?: string[] }): { teams: string[]; division?: 'master' | 'challenger'; voters?: 'master' | 'challenger' } {
  if (divisions.master?.includes(teamId)) return { teams: divisions.challenger ?? [], division: 'master', voters: 'challenger' }
  if (divisions.challenger?.includes(teamId)) return { teams: divisions.master ?? [], division: 'challenger', voters: 'master' }
  return { teams: allTeams.filter((t) => t !== teamId) }
}

// ---------------------------------------------------------------------------
//  Infériorité numérique (Art. 2.7, 2.5)
// ---------------------------------------------------------------------------
export interface Inferiority { side: 'home' | 'away'; players: number; remainingMs: number }

/** Temps de jeu effectif écoulé depuis le coup d'envoi (ms) pour un événement. */
export function effectiveMs(e: Pick<MatchEvent, 'period' | 'minute' | 'clock_ms'>, halfMin: number = REGLEMENT.duration.halfMin) {
  const off = e.period === '2H' ? halfMin * 60_000 : 0
  if (typeof e.clock_ms === 'number') return off + e.clock_ms
  const minute = e.minute ?? 0
  return Math.max(0, (minute - 1) * 60_000)
}

/**
 * Exclusions temporaires en cours : après un rouge (joueur, remplaçant ou officiel), l'équipe joue à un de moins
 * pendant 2 minutes de jeu effectif. Fin anticipée : si l'adversaire (plus nombreux) marque, l'équipe réduite récupère un joueur.
 */
export function inferiorityAt(m: Pick<Match, 'home_team_id' | 'away_team_id'>, events: MatchEvent[], nowMs: number, halfMin: number = REGLEMENT.duration.halfMin) {
  const t = (e: MatchEvent) => effectiveMs(e, halfMin)
  const pens: { side: 'home' | 'away'; start: number; end: number }[] = []
  const timeline = events.filter((e) => e.period !== 'PENS' && (e.type === 'red_card' || e.type === 'second_yellow' || e.type === 'goal' || e.type === 'own_goal')).sort((a, b) => t(a) - t(b))
  const side = (teamId: string) => (teamId === m.home_team_id ? 'home' : 'away') as 'home' | 'away'
  const active = (s: 'home' | 'away', at: number) => pens.filter((p) => p.side === s && p.start <= at && at < p.end)
  for (const e of timeline) {
    const at = t(e)
    if (at > nowMs) break
    if (e.type === 'red_card' || e.type === 'second_yellow') pens.push({ side: side(e.team_id), start: at, end: at + REGLEMENT.inferiority.ms })
    else {
      const scorer = e.type === 'goal' ? side(e.team_id) : side(e.team_id) === 'home' ? 'away' : 'home'
      const other = scorer === 'home' ? 'away' : 'home'
      const mine = active(scorer, at), theirs = active(other, at)
      if (theirs.length > mine.length) { const first = theirs.sort((a, b) => a.end - b.end)[0]; first.end = at }
    }
  }
  const out: Inferiority[] = []
  for (const s of ['home', 'away'] as const) {
    const a = active(s, nowMs)
    if (a.length) out.push({ side: s, players: REGLEMENT.format.playersOnPitch - a.length, remainingMs: Math.min(...a.map((p) => p.end - nowMs)) })
  }
  return out
}
export function fmtInferiority(inf: Inferiority, others: Inferiority[]) {
  const opp = others.find((x) => x.side !== inf.side)?.players ?? REGLEMENT.format.playersOnPitch
  const s = Math.ceil(inf.remainingMs / 1000)
  return `${inf.players} c. ${opp} — ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Minute affichée (1 à 40) et période pour le temps effectif. */
export function periodLabel(p?: Period) { return p === '2H' ? '2e' : p === 'PENS' ? 't.a.b.' : '1re' }

export type { Competition }

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
    /** 3 jaunes cumulés sur la compétition = 1 match de suspension */
    yellowsForSuspension: 3,
    accumulationSuspension: 1,
    /** tout rouge (direct ou 2e jaune) = au moins 1 match */
    redMinSuspension: 1,
    /** les 2 jaunes d'une expulsion ne comptent pas dans le cumul */
    expulsionYellowsCount: false,
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
  { text: 'Victoire 3 pts · Nul 1 pt · Défaite 0 pt', art: '17.2' },
  { text: 'Forfait = défaite 3-0', art: '14.1' },
  { text: 'Départage : points, confrontation directe, différence de buts, buts marqués, moins de jaunes, moins de rouges, tirage au sort', art: '17.3' },
  { text: '3 jaunes cumulés = 1 match de suspension · Rouge = au moins 1 match de suspension', art: '11.5' },
  { text: 'Réclamation sous 24 h après le coup de sifflet final', art: '17.4' },
]

// ---------------------------------------------------------------------------
//  Versions du règlement (une saison = une version)
// ---------------------------------------------------------------------------
export interface RulebookRules {
  /** cumul des jaunes d'un match à l'autre + suspensions automatiques (v4) */
  cumulativeCards: boolean
}
export const RULEBOOK_RULES: Record<string, RulebookRules> = {
  v3: { cumulativeCards: false },
  v4: { cumulativeCards: true },
}
export const CURRENT_RULEBOOK = 'v4'
/** Règles de cartons d'une saison : celles de sa version du règlement (les saisons sans version gardent l'ancien régime manuel). */
export function rulesForSeason(season?: Pick<Season, 'rulebook_version'> | null): RulebookRules {
  return RULEBOOK_RULES[season?.rulebook_version ?? ''] ?? { cumulativeCards: false }
}

/** Contrôle de cohérence texte ↔ constantes (avertissement dans l'admin). */
export function coherenceWarnings(text: string): string[] {
  const t = text.toLowerCase().replace(/\s+/g, ' ')
  const checks: [boolean, string][] = [
    [/deux \(2\) périodes de vingt \(20\) minutes/.test(t), `Durée : le texte ne mentionne plus « deux (2) périodes de vingt (20) minutes » (constante : ${REGLEMENT.duration.halves} × ${REGLEMENT.duration.halfMin} min).`],
    [/victoire : 3 points/.test(t) && /match nul : 1 point/.test(t), `Points : le texte ne mentionne plus « Victoire : 3 points » / « Match nul : 1 point » (constantes : ${REGLEMENT.points.win}/${REGLEMENT.points.draw}/${REGLEMENT.points.loss}).`],
    [/3-0/.test(t), 'Forfait : le score « 3-0 » n’apparaît plus dans le texte.'],
    [/trois \(3\) cartons jaunes cumulés/.test(t), `Cartons : le texte ne mentionne plus « Trois (3) cartons jaunes cumulés » (constante : ${REGLEMENT.cards.yellowsForSuspension}).`],
    [/au minimum un \(1\) match de suspension/.test(t), 'Cartons : la suspension minimale après un rouge n’apparaît plus dans le texte.'],
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
//  Discipline : cumul des jaunes et suspensions (Art. 11.5, 11.6, 2.5, 2.7)
// ---------------------------------------------------------------------------
export type SuspensionKind = 'accumulation' | 'red' | 'second_yellow' | 'extra'
export const SUSPENSION_LABEL: Record<SuspensionKind, string> = {
  accumulation: '3 cartons jaunes cumulés', red: 'Carton rouge', second_yellow: 'Expulsion (2e avertissement)', extra: 'Suspension supplémentaire (Ardentia)',
}
export interface SuspensionRecord {
  id: string
  kind: SuspensionKind
  matches: number
  origin_match_id?: string
  origin_event_id?: string
  reason?: string
  referee_report?: string
  notified_at?: string
  served: string[]
  art: string
}
export interface PlayerDiscipline {
  player_id: string
  team_id: string
  /** jaunes au compteur du cumul (0–2 avant suspension) */
  counter: number
  yellowsTotal: number
  redsTotal: number
  suspensions: SuspensionRecord[]
  /** matchs de suspension restant à purger */
  remaining: number
  /** matchs où le joueur a été aligné alors qu'il purgeait une suspension */
  violations: string[]
}
export interface OfficialSuspension { team_id: string; name: string; record: SuspensionRecord }

export interface DisciplineData {
  matches: Match[]
  events: MatchEvent[]
  lineups?: Lineup[]
  players: Pick<Player, 'id' | 'team_id'>[]
  /** suspensions supplémentaires saisies par Ardentia (entité Suspension) */
  extras?: Suspension[]
}

const isCard = (e: MatchEvent) => e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card'

/** A joué (titulaire, entré en jeu ou action enregistrée) — utile pour détecter un suspendu aligné. */
function appeared(m: Match, playerId: string, data: DisciplineData) {
  const lu = data.lineups?.find((l) => l.match_id === m.id && (l.starter_ids?.includes(playerId) || l.substitute_ids?.includes(playerId)))
  if (lu) return true
  return data.events.some((e) => e.match_id === m.id && (e.player_id === playerId || (e.type === 'goal' && e.related_player_id === playerId)) && e.card_target !== 'official')
}

/**
 * Discipline d'une compétition, recalculée intégralement depuis les événements (une réattribution de carton
 * met donc à jour les deux joueurs). `before` : n'utilise que les matchs disputés AVANT ce match (état à la veille).
 */
export function computeDiscipline(competitionId: string, data: DisciplineData, opts: { before?: Pick<Match, 'id' | 'date'> } = {}) {
  const ms = data.matches.filter((m) => m.competition_id === competitionId && isDisputed(m) && (!opts.before || (m.id !== opts.before.id && (m.date ?? '') < (opts.before.date ?? '￿')))).sort(byDate)
  const msIds = new Set(ms.map((m) => m.id))
  const evByMatch = new Map<string, MatchEvent[]>()
  for (const e of data.events) if (msIds.has(e.match_id) && isCard(e)) { if (!evByMatch.has(e.match_id)) evByMatch.set(e.match_id, []); evByMatch.get(e.match_id)!.push(e) }
  const extrasByMatch = new Map<string, Suspension[]>()
  for (const s of data.extras ?? []) if (s.origin_match_id && msIds.has(s.origin_match_id)) { if (!extrasByMatch.has(s.origin_match_id)) extrasByMatch.set(s.origin_match_id, []); extrasByMatch.get(s.origin_match_id)!.push(s) }

  // joueurs concernés : tous ceux qui ont un carton ou une suspension dans la compétition
  const teamOf = new Map(data.players.map((p) => [p.id, p.team_id]))
  const involved = new Map<string, string>()
  for (const evs of evByMatch.values()) for (const e of evs) if (e.player_id && e.card_target !== 'official') involved.set(e.player_id, teamOf.get(e.player_id) ?? e.team_id)
  for (const ss of extrasByMatch.values()) for (const s of ss) if (s.player_id) involved.set(s.player_id, teamOf.get(s.player_id) ?? s.team_id ?? '')

  const players = new Map<string, PlayerDiscipline>()
  for (const [pid, team] of involved) {
    const d: PlayerDiscipline = { player_id: pid, team_id: team, counter: 0, yellowsTotal: 0, redsTotal: 0, suspensions: [], remaining: 0, violations: [] }
    const pending = () => d.suspensions.filter((s) => s.served.length < s.matches)
    for (const m of ms.filter((x) => x.home_team_id === team || x.away_team_id === team)) {
      // 1. purge : ce match disputé par l'équipe sert la première suspension en cours
      const cur = pending()[0]
      if (cur) {
        cur.served.push(m.id)
        if (appeared(m, pid, data)) d.violations.push(m.id)
        if (cur.kind === 'accumulation' && cur.served.length === cur.matches) d.counter = Math.max(0, d.counter - REGLEMENT.cards.yellowsForSuspension)
      }
      // 2. cartons du match
      const evs = (evByMatch.get(m.id) ?? []).filter((e) => e.player_id === pid && e.card_target !== 'official')
      const yellows = evs.filter((e) => e.type === 'yellow_card')
      const second = evs.find((e) => e.type === 'second_yellow')
      const reds = evs.filter((e) => e.type === 'red_card')
      d.yellowsTotal += yellows.length + (second ? 1 : 0)
      d.redsTotal += reds.length + (second ? 1 : 0)
      if (second) {
        // les 2 jaunes de l'expulsion ne comptent pas dans le cumul (Art. 11.5) ; un 3e jaune distinct compterait
        const counted = Math.max(0, yellows.length - 1)
        d.counter += counted
        d.suspensions.push({ id: `${pid}:${second.id}`, kind: 'second_yellow', matches: REGLEMENT.cards.redMinSuspension, origin_match_id: m.id, origin_event_id: second.id, served: [], art: REGLEMENT.cards.artRed })
      } else d.counter += yellows.length
      for (const r of reds) d.suspensions.push({ id: `${pid}:${r.id}`, kind: 'red', matches: REGLEMENT.cards.redMinSuspension, origin_match_id: m.id, origin_event_id: r.id, served: [], art: REGLEMENT.cards.artRed })
      if (d.counter >= REGLEMENT.cards.yellowsForSuspension && !pending().some((s) => s.kind === 'accumulation'))
        d.suspensions.push({ id: `${pid}:acc:${m.id}`, kind: 'accumulation', matches: REGLEMENT.cards.accumulationSuspension, origin_match_id: m.id, served: [], art: REGLEMENT.cards.artYellow })
      // 3. suspension supplémentaire décidée par Ardentia (s'ajoute au match automatique)
      for (const s of extrasByMatch.get(m.id) ?? []) if (s.player_id === pid && s.matches > 0)
        d.suspensions.push({ id: s.id, kind: 'extra', matches: s.matches, origin_match_id: m.id, origin_event_id: s.origin_event_id, reason: s.reason, referee_report: s.referee_report, notified_at: s.notified_at, served: [], art: REGLEMENT.cards.artRed })
    }
    d.remaining = pending().reduce((a, s) => a + s.matches - s.served.length, 0)
    players.set(pid, d)
  }

  // officiels d'équipe : rouge = suspension aussi (Art. 2.5), sans cumul de jaunes
  const officials: OfficialSuspension[] = []
  for (const m of ms) for (const e of evByMatch.get(m.id) ?? []) {
    if (e.card_target !== 'official' || (e.type !== 'red_card' && e.type !== 'second_yellow')) continue
    const rec: SuspensionRecord = { id: `off:${e.id}`, kind: e.type === 'red_card' ? 'red' : 'second_yellow', matches: REGLEMENT.cards.redMinSuspension, origin_match_id: m.id, origin_event_id: e.id, served: [], art: REGLEMENT.cards.artBench }
    for (const n of ms.filter((x) => byDate(x, m) > 0 && (x.home_team_id === e.team_id || x.away_team_id === e.team_id)).slice(0, rec.matches)) rec.served.push(n.id)
    officials.push({ team_id: e.team_id, name: e.player_name_free || 'Officiel', record: rec })
  }
  return { players, officials }
}

/** Joueurs suspendus pour un match donné (état à la veille du match). */
export function suspendedFor(match: Pick<Match, 'id' | 'date' | 'competition_id' | 'home_team_id' | 'away_team_id'>, data: DisciplineData) {
  const { players } = computeDiscipline(match.competition_id, data, { before: match })
  const out = new Map<string, PlayerDiscipline>()
  for (const d of players.values()) if (d.remaining > 0 && (d.team_id === match.home_team_id || d.team_id === match.away_team_id)) out.set(d.player_id, d)
  return out
}

export const counterLabel = (d?: Pick<PlayerDiscipline, 'counter'>) => `${Math.min(d?.counter ?? 0, REGLEMENT.cards.yellowsForSuspension)}/${REGLEMENT.cards.yellowsForSuspension}`
export const isThreatened = (d?: Pick<PlayerDiscipline, 'counter' | 'remaining'>) => !!d && d.remaining === 0 && d.counter === REGLEMENT.cards.yellowsForSuspension - 1

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

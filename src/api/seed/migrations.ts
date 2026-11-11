// Migrations NON destructives des données déjà enregistrées dans le navigateur.
// Elles adaptent les anciennes données aux règles en vigueur sans effacer ce que l'admin a saisi.
import type { Award, Competition, Lineup, Match, Page, Position, MatchEvent, MatchTeamStats, Player, Rulebook, Season, Settings, Team, TeamOfWeek } from '@/types/entities'
import { CURRENT_RULEBOOK, REGLEMENT, isDisputed } from '@/lib/reglement'
import { buildRulebooks } from './rulebook'
import { DEFAULT_COMPETITION_NAMES, LEGACY_COMPETITION_NAMES } from '@/lib/competitionNames'
import { LEAGUE } from '@/config/league'
import { SEASON_2026_ID } from './season2026'
import { toRole } from '@/lib/format'
import { capStarters } from '@/lib/lineup'
import { store } from '../localStore'

/** copie sans la clé donnée */
function omit<T extends object>(o: T, key: string): T { const c = { ...o } as Record<string, unknown>; delete c[key]; return c as T }

const REMOVED_AWARDS = new Set(['best_defender', 'best_midfielder', 'best_forward'])

export interface Rules6Data {
  Player?: Player[]
  MatchEvent?: MatchEvent[]
  MatchTeamStats?: MatchTeamStats[]
  Award?: Award[]
  TeamOfWeek?: TeamOfWeek[]
  Lineup?: Lineup[]
  Page?: Page[]
  Team?: Team[]
  Settings?: Settings[]
  Rulebook?: Rulebook[]
  Season?: Season[]
  Competition?: Competition[]
  Match?: Match[]
}

/**
 * Règle 6 contre 6 (5 joueurs de champ + 1 gardien) :
 * - pas de postes : un joueur est soit gardien (GK) soit joueur de champ (FIELD) ;
 * - pas de hors-jeu : événements et statistiques de hors-jeu supprimés ;
 * - trophées par poste (défenseur, milieu, attaquant) retirés ;
 * - équipe type : 1 gardien + 5 joueurs de champ, sans formation.
 * Renvoie uniquement les entités modifiées.
 */
export function applyRules6v6(db: Rules6Data): Rules6Data {
  const out: Rules6Data = {}
  if (db.Player?.some((p) => p.position !== 'GK' && p.position !== 'FIELD'))
    out.Player = db.Player.map((p) => (p.position === 'GK' || p.position === 'FIELD' ? p : { ...p, position: toRole(p.position) }))
  if (db.MatchEvent?.some((e) => (e.type as string) === 'offside'))
    out.MatchEvent = db.MatchEvent.filter((e) => (e.type as string) !== 'offside')
  if (db.MatchTeamStats?.some((s) => 'offsides' in s))
    out.MatchTeamStats = db.MatchTeamStats.map((s) => omit(s, 'offsides'))
  if (db.Award?.some((a) => REMOVED_AWARDS.has(a.category)))
    out.Award = db.Award.filter((a) => !REMOVED_AWARDS.has(a.category))
  if (db.TeamOfWeek?.some((t) => 'formation' in t || t.slots.some((s, i) => s.position !== (i === 0 ? 'GK' : 'FIELD'))))
    out.TeamOfWeek = db.TeamOfWeek.map((t) => {
      return { ...omit(t, 'formation'), slots: t.slots.slice(0, 6).map((s, i) => ({ ...s, position: (i === 0 ? 'GK' : 'FIELD') as Position })) }
    })
  if (db.Lineup?.some((l) => 'formation' in l))
    out.Lineup = db.Lineup.map((l) => omit(l, 'formation'))
  // règlement : ajoute les deux règles si le texte ne les mentionne pas encore (le reste du texte saisi est conservé)
  const rules = db.Page?.find((p) => p.slug === 'reglement')
  if (rules && !/hors-jeu/i.test(rules.content ?? '')) {
    const add = '- **Pas de postes** : les seuls rôles sont **Gardien** et **Capitaine**.\n- **Pas de hors-jeu.**\n'
    const c = rules.content ?? ''
    const at = c.indexOf('\n', c.indexOf('## 1.') + 1)
    const content = c.includes('## 1.') ? c.slice(0, at + 1) + add + c.slice(at + 1) : `${c}\n\n## Règles de jeu\n- 6 contre 6 (5 joueurs de champ + 1 gardien).\n${add}`
    out.Page = db.Page!.map((p) => (p === rules ? { ...p, content } : p))
  }
  return out
}

/**
 * Lot 1 — nettoyage :
 * - trophée « Meilleur jeune » retiré (et son réglage d'âge) ;
 * - un seul capitaine par équipe, fiche joueur et fiche équipe alignées ;
 * - 6 titulaires au maximum par composition (les autres deviennent remplaçants).
 */
export function applyLot1(db: Rules6Data): Rules6Data {
  const out: Rules6Data = {}
  if (db.Award?.some((a) => (a.category as string) === 'best_young'))
    out.Award = db.Award.filter((a) => (a.category as string) !== 'best_young')
  if (db.Settings?.some((x) => 'young_max_age' in x))
    out.Settings = db.Settings.map((x) => omit(x, 'young_max_age'))
  if (db.Player && db.Team) {
    const captain = new Map<string, string | null>()
    for (const t of db.Team) {
      const squad = db.Player.filter((p) => p.team_id === t.id)
      const c = squad.find((p) => p.id === t.captain_player_id) ?? squad.find((p) => p.is_captain)
      captain.set(t.id, c?.id ?? null)
    }
    if (db.Player.some((p) => !!p.is_captain !== (captain.get(p.team_id) === p.id)))
      out.Player = db.Player.map((p) => (!!p.is_captain === (captain.get(p.team_id) === p.id) ? p : { ...p, is_captain: captain.get(p.team_id) === p.id }))
    if (db.Team.some((t) => (t.captain_player_id ?? null) !== captain.get(t.id)))
      out.Team = db.Team.map((t) => { const c = captain.get(t.id); return (t.captain_player_id ?? null) === c ? t : c ? { ...t, captain_player_id: c } : omit(t, 'captain_player_id') })
  }
  if (db.Lineup && db.MatchEvent) {
    const evs = db.MatchEvent
    const next = db.Lineup.map((l) => capStarters(l, evs))
    if (next.some((l, i) => l !== db.Lineup![i])) out.Lineup = next
  }
  const rules = db.Page?.find((p) => p.slug === 'reglement')
  if (rules && /,? ?Meilleur jeune/.test(rules.content ?? ''))
    out.Page = db.Page!.map((p) => (p === rules ? { ...p, content: (p.content ?? '').replace(/,? ?Meilleur jeune/, '') } : p))
  return out
}

/**
 * Règlement officiel Ardentia v4 :
 * - texte intégral v4 (saison 2026-2027) + v3 dans l'historique des versions ;
 * - saison 2026-2027 rattachée à la v4 ;
 * - matchs non encore disputés et compétitions 2026-2027 : mi-temps de 20 min (Art. 5.1) ;
 * - points et ordre de départage ne sont plus des réglages (Art. 17.2, 17.3 dans lib/reglement.ts).
 */
export function applyReglementV4(db: Rules6Data): Rules6Data {
  const out: Rules6Data = {}
  const books = buildRulebooks()
  const have = new Set((db.Rulebook ?? []).map((r) => r.version))
  if (db.Rulebook && books.some((b) => !have.has(b.version)))
    out.Rulebook = [...(db.Rulebook ?? []).map((r) => (r.status === 'current' ? { ...r, status: 'archived' as const } : r)), ...books.filter((b) => !have.has(b.version))]
  if (db.Season?.some((x) => x.id === SEASON_2026_ID && !x.rulebook_version))
    out.Season = db.Season.map((x) => (x.id === SEASON_2026_ID && !x.rulebook_version ? { ...x, rulebook_version: CURRENT_RULEBOOK } : x))
  const half = REGLEMENT.duration.halfMin
  if (db.Competition?.some((c) => c.season_id === SEASON_2026_ID && c.half_duration_min !== half))
    out.Competition = db.Competition.map((c) => (c.season_id === SEASON_2026_ID && c.half_duration_min !== half ? { ...c, half_duration_min: half } : c))
  if (db.Match?.some((m) => m.season_id === SEASON_2026_ID && !isDisputed(m) && m.status !== 'live' && m.half_duration_min !== half))
    out.Match = db.Match.map((m) => (m.season_id === SEASON_2026_ID && !isDisputed(m) && m.status !== 'live' && m.half_duration_min !== half ? { ...m, half_duration_min: half } : m))
  if (db.Settings?.some((x) => 'tiebreakers' in x || 'points_win' in x))
    out.Settings = db.Settings.map((x) => omit(omit(omit(omit(x, 'tiebreakers'), 'points_win'), 'points_draw'), 'points_loss'))
  return out
}

/**
 * Renommage des compétitions (Gold Cup → MASTER, Silver Cup → CHALLENGER) et nouvelle accroche :
 * seuls les anciens noms par défaut sont remplacés (un nom personnalisé par l'admin est conservé).
 */
export const OLD_TAGLINE = 'Le championnat de football inter-entreprises'
export function applyRenameCompetitions(db: Rules6Data & { Division?: { id: string; name: string }[] }): Rules6Data & { Division?: { id: string; name: string }[] } {
  const out: Rules6Data & { Division?: { id: string; name: string }[] } = {}
  const ren = (phase: 'gold' | 'silver', name?: string) => (name && LEGACY_COMPETITION_NAMES[phase].includes(name) ? DEFAULT_COMPETITION_NAMES[phase] : name)
  const fixComp = (c: Competition): Competition => {
    let x = c
    if ((c.phase === 'gold' || c.phase === 'silver') && ren(c.phase, c.name) !== c.name) x = { ...x, name: ren(c.phase, c.name)! }
    if (c.split && (ren('gold', c.split.gold_name) !== c.split.gold_name || ren('silver', c.split.silver_name) !== c.split.silver_name)) x = { ...x, split: { ...c.split, gold_name: ren('gold', c.split.gold_name), silver_name: ren('silver', c.split.silver_name) } }
    return x
  }
  if (db.Competition?.some((c) => fixComp(c) !== c)) out.Competition = db.Competition.map(fixComp)
  const fixDiv = (d: { id: string; name: string }) => (d.id === 'div_gold' && ren('gold', d.name) !== d.name ? { ...d, name: DEFAULT_COMPETITION_NAMES.gold } : d.id === 'div_silver' && ren('silver', d.name) !== d.name ? { ...d, name: DEFAULT_COMPETITION_NAMES.silver } : d)
  if (db.Division?.some((d) => fixDiv(d) !== d)) out.Division = db.Division.map(fixDiv)
  if (db.Settings?.some((x) => x.tagline === OLD_TAGLINE)) out.Settings = db.Settings.map((x) => (x.tagline === OLD_TAGLINE ? { ...x, tagline: LEAGUE.tagline } : x))
  return out
}

/** Étapes de migration, dans l'ordre. Le numéro atteint est mémorisé dans le navigateur. */
const STEPS = [applyRules6v6, applyLot1, applyReglementV4, applyRenameCompetitions]
const VERSION_FLAG = 'data-version'

/** Enchaîne les étapes de migration ; chacune lit le résultat de la précédente. */
export function migrate(db: Rules6Data, from = 0): Rules6Data {
  let cur = { ...db }
  const changed: Rules6Data = {}
  for (const step of STEPS.slice(from)) {
    const out = step(cur)
    Object.assign(changed, out); cur = { ...cur, ...out }
  }
  return changed
}

/** Applique les migrations manquantes sur les données du navigateur. */
export function migrateStoredData() {
  const legacy = store.getFlag('migrated-6v6') ? 1 : 0
  const from = Number(store.getFlag(VERSION_FLAG) ?? legacy) || legacy
  if (from >= STEPS.length) return
  const names = ['Player', 'MatchEvent', 'MatchTeamStats', 'Award', 'TeamOfWeek', 'Lineup', 'Page', 'Team', 'Settings', 'Rulebook', 'Season', 'Competition', 'Match', 'Division'] as const
  const db = Object.fromEntries(names.map((n) => [n, store.all(n)])) as Rules6Data
  const changed = migrate(db, from)
  store.batch(() => { for (const [name, rows] of Object.entries(changed)) store.replace(name as (typeof names)[number], rows as never) })
  store.setFlag(VERSION_FLAG, String(STEPS.length))
}

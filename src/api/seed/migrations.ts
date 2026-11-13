// Migrations NON destructives des données déjà enregistrées dans le navigateur.
// Elles adaptent les anciennes données aux règles en vigueur sans effacer ce que l'admin a saisi.
import { buildOfficialJ1 } from './preseasonJ1'
import type { Award, BaseEntity, CaptainTeam, Club, Draw, Suspension, Competition, Lineup, Match, Page, Position, MatchEvent, MatchTeamStats, Player, Rulebook, Season, Settings, Team, TeamOfWeek } from '@/types/entities'
import { CURRENT_RULEBOOK, REGLEMENT, isDisputed } from '@/lib/reglement'
import { buildRulebooks } from './rulebook'
import { DEFAULT_COMPETITION_NAMES, LEGACY_COMPETITION_NAMES } from '@/lib/competitionNames'
import { LEAGUE } from '@/config/league'
import { SEASON_2026_ID } from './season2026'
import { toRole } from '@/lib/format'
import { capStarters } from '@/lib/lineup'
import { defaultCaptainTeams } from '@/lib/captains'
import { applyOfficialPlan, planIsEmpty, planOfficialTeams } from '@/lib/officialTeams'
import { store } from '../localStore'

/** copie sans la clé donnée */
function omit<T extends object>(o: T, key: string): T { const c = { ...o } as Record<string, unknown>; delete c[key]; return c as T }

const REMOVED_AWARDS = new Set(['best_defender', 'best_midfielder', 'best_forward'])

export interface Rules6Data {
  CaptainTeam?: CaptainTeam[]
  Suspension?: Suspension[]
  Draw?: Draw[]
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
  AuditLog?: BaseEntity[]
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

/**
 * Lot 3 — une équipe = une saison. Une fiche utilisée par des compétitions de plusieurs saisons (anciennes données :
 * les équipes revenues en 2026-2027 réutilisaient leur fiche 2025-2026) est dupliquée : la fiche d'origine garde la
 * saison la plus ancienne et son historique ; la copie reprend tout ce qui concerne la saison suivante (compétitions,
 * matchs, événements, compositions, effectifs, suspensions, tirages). Aucun lien n'est créé : l'admin l'approuve.
 */
export function applySplitSharedTeams(db: Rules6Data): Rules6Data {
  if (!db.Team || !db.Competition) return {}
  const order = [...(db.Season ?? [])].sort((a, b) => (a.start_date ?? '').localeCompare(b.start_date ?? '')).map((s) => s.id)
  const seasonsOf = new Map<string, string[]>()
  for (const c of db.Competition) for (const t of c.team_ids ?? []) { const l = seasonsOf.get(t) ?? []; if (!l.includes(c.season_id)) l.push(c.season_id); seasonsOf.set(t, l) }
  const ids = new Set(db.Team.map((t) => t.id))
  const map = new Map<string, Map<string, string>>() // saison → (ancienne id → nouvelle id)
  const clones: Team[] = []
  for (const t of db.Team) {
    const ss = (seasonsOf.get(t.id) ?? []).sort((a, b) => order.indexOf(a) - order.indexOf(b))
    if (ss.length < 2) continue
    for (const sid of ss.slice(1)) {
      const suffix = (db.Season ?? []).find((s) => s.id === sid)?.start_date?.slice(0, 4) ?? sid
      let nid = `t${suffix.slice(2)}_${(t.short_name || t.id).toLowerCase()}`
      if (ids.has(nid)) nid = `${t.id}_${suffix}`
      ids.add(nid)
      clones.push({ ...t, id: nid, season_id: sid, club_id: undefined, link: undefined, link_dismissed: undefined, captain_player_id: undefined })
      if (!map.has(sid)) map.set(sid, new Map())
      map.get(sid)!.set(t.id, nid)
    }
  }
  if (!clones.length) return {}
  const out: Rules6Data = {}
  const re = (sid: string | undefined, id: string) => (sid && map.get(sid)?.get(id)) || id
  const matchSeason = new Map((db.Match ?? []).map((m) => [m.id, m.season_id]))
  out.Team = [...db.Team.map((t) => (seasonsOf.get(t.id)?.length ?? 0) > 1 ? { ...t, season_id: [...seasonsOf.get(t.id)!].sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] } : t), ...clones]
  out.Competition = db.Competition.map((c) => (map.has(c.season_id) ? { ...c, team_ids: c.team_ids?.map((x) => re(c.season_id, x)) } : c))
  if (db.Match) out.Match = db.Match.map((m) => (map.has(m.season_id) ? { ...m, home_team_id: re(m.season_id, m.home_team_id), away_team_id: re(m.season_id, m.away_team_id), forfeit_team_id: m.forfeit_team_id ? re(m.season_id, m.forfeit_team_id) : m.forfeit_team_id } : m))
  if (db.MatchEvent) out.MatchEvent = db.MatchEvent.map((e) => { const sid = matchSeason.get(e.match_id); return sid && map.has(sid) ? { ...e, team_id: re(sid, e.team_id) } : e })
  if (db.Lineup) out.Lineup = db.Lineup.map((l) => { const sid = matchSeason.get(l.match_id); return sid && map.has(sid) ? { ...l, team_id: re(sid, l.team_id) } : l })
  if (db.MatchTeamStats) out.MatchTeamStats = db.MatchTeamStats.map((x) => { const sid = matchSeason.get(x.match_id); return sid && map.has(sid) ? { ...x, team_id: re(sid, x.team_id) } : x })
  if (db.Suspension) out.Suspension = db.Suspension.map((x) => (x.team_id && map.has(x.season_id) ? { ...x, team_id: re(x.season_id, x.team_id) } : x))
  if (db.Draw) out.Draw = db.Draw.map((d) => { const sid = db.Competition!.find((c) => c.id === d.competition_id)?.season_id; return sid && map.has(sid) ? { ...d, pots: d.pots?.map((p) => ({ ...p, team_ids: p.team_ids.map((x) => re(sid, x)) })), groups: d.groups?.map((g) => ({ ...g, team_ids: g.team_ids.map((x) => re(sid, x)) })) } : d })
  // joueurs inscrits dans la saison suivante sous l'ancienne fiche → la fiche de cette saison
  if (db.Player) out.Player = db.Player.map((p) => { const sid = p.season_ids?.find((x) => map.get(x)?.has(p.team_id)); return sid && (p.season_ids?.length ?? 0) === 1 ? { ...p, team_id: re(sid, p.team_id) } : p })
  return out
}

/**
 * Lot 3 — saisons séparées : chaque équipe est rattachée à UNE saison (déduite des compétitions) et à son
 * propre club permanent. Aucun lien entre saisons n'est créé automatiquement : c'est l'admin qui les approuve.
 */
export function applyClubs(db: Rules6Data & { Club?: Club[] }): Rules6Data & { Club?: Club[] } {
  const out: Rules6Data & { Club?: Club[] } = {}
  if (!db.Team || !db.Club) return out // n'agit que sur une base complète (entité Club présente)
  const comps = db.Competition ?? []
  const clubs = new Map((db.Club ?? []).map((c) => [c.id, c]))
  let teamsChanged = false
  const teams = db.Team.map((t) => {
    const season_id = t.season_id ?? comps.find((c) => c.team_ids?.includes(t.id))?.season_id
    const club_id = t.club_id ?? `club_${t.id}`
    if (!clubs.has(club_id)) clubs.set(club_id, { id: club_id, name: t.name, logo_url: t.logo_url })
    if (season_id === t.season_id && club_id === t.club_id) return t
    teamsChanged = true
    return { ...t, season_id, club_id }
  })
  if (teamsChanged) out.Team = teams
  if (clubs.size !== (db.Club ?? []).length) out.Club = [...clubs.values()]
  return out
}

/** Étapes de migration, dans l'ordre. Le numéro atteint est mémorisé dans le navigateur. */
/** Match des capitaines : crée les équipes ORANGE et BLEUE (effectifs vides) si elles n'existent pas. */
export function applyCaptains(db: Rules6Data): Rules6Data {
  if (!db.CaptainTeam || db.CaptainTeam.length) return {}
  return { CaptainTeam: defaultCaptainTeams() }
}

/**
 * Liste officielle 2026-2027 (23 équipes) appliquée dans tous les navigateurs : création et renommage ;
 * une équipe hors liste n'est retirée automatiquement que si elle n'a NI joueur NI match joué (ex. « Simulation FC »).
 * Toute autre équipe hors liste reste en place : l'admin décide dans « Liste officielle » (sauvegarde + confirmation).
 */
export function applyOfficialTeams2026(db: Rules6Data & { Club?: Club[] }): Rules6Data & { Club?: Club[] } {
  if (!db.Team || !db.Club || !db.Competition || !db.Season?.some((s) => s.id === SEASON_2026_ID)) return {}
  const full = { Team: db.Team, Player: db.Player ?? [], Match: db.Match ?? [], MatchEvent: db.MatchEvent ?? [], Lineup: db.Lineup ?? [], MatchTeamStats: db.MatchTeamStats ?? [], Competition: db.Competition, Club: db.Club }
  const plan = planOfficialTeams(full, SEASON_2026_ID)
  plan.removed = plan.removed.filter((r) => !r.players.length && !r.matches.some((m) => m.status === 'finished'))
  // la phase de sélection 2026-2027 devient la « Pré-saison » (nom par défaut seulement)
  const renameComp = db.Competition.some((c) => c.id === 'comp_2026_selection' && c.name === 'Phase de sélection')
  if (planIsEmpty(plan) && !renameComp) return {}
  const out = (planIsEmpty(plan) ? {} : applyOfficialPlan(full, plan)) as Rules6Data & { Club?: Club[] }
  if (renameComp) out.Competition = (out.Competition ?? db.Competition).map((c) => (c.id === 'comp_2026_selection' && c.name === 'Phase de sélection' ? { ...c, name: 'Pré-saison' } : c))
  return out
}

/** Règlement v8 (2026-2027) : la saison passe au régime « conseil de discipline » (pas de cumul, pas de suspension automatique). */
export function applyDisciplineV8(db: Rules6Data): Rules6Data {
  const old = (v?: string) => !v || v === 'v4'
  if (!db.Season?.some((x) => x.id === SEASON_2026_ID && old(x.rulebook_version))) return {}
  return { Season: db.Season.map((x) => (x.id === SEASON_2026_ID && old(x.rulebook_version) ? { ...x, rulebook_version: 'v8' } : x)) }
}

/** Règlement v9 publié (v8 + fonctionnement de la plateforme) : ajouté à l'historique, rattaché à 2026-2027. */
export function applyReglementV9(db: Rules6Data): Rules6Data {
  const out: Rules6Data = {}
  const books = buildRulebooks()
  const have = new Set((db.Rulebook ?? []).map((r) => r.version))
  if (db.Rulebook && books.some((b) => !have.has(b.version)))
    out.Rulebook = [...books.filter((b) => !have.has(b.version)), ...db.Rulebook.map((r) => (r.status === 'current' ? { ...r, status: 'archived' as const, changes: books.find((b) => b.version === r.version)?.changes ?? r.changes } : r))]
  if (db.Season?.some((x) => x.id === SEASON_2026_ID && (!x.rulebook_version || ['v4', 'v8'].includes(x.rulebook_version))))
    out.Season = db.Season.map((x) => (x.id === SEASON_2026_ID && (!x.rulebook_version || ['v4', 'v8'].includes(x.rulebook_version)) ? { ...x, rulebook_version: CURRENT_RULEBOOK } : x))
  return out
}

/**
 * « Simulation FC » (équipe de test des anciennes données 2026-2027) : retirée même si elle a des joueurs ou des matchs,
 * et la pré-saison ne garde que les 23 équipes officielles (un tirage non publié qui l'incluait est annulé).
 */
export function applyRemoveSimulation2026(db: Rules6Data & { Club?: Club[] }): Rules6Data & { Club?: Club[] } {
  if (!db.Team || !db.Club || !db.Competition || !db.Season?.some((s) => s.id === SEASON_2026_ID)) return {}
  const full = { Team: db.Team, Player: db.Player ?? [], Match: db.Match ?? [], MatchEvent: db.MatchEvent ?? [], Lineup: db.Lineup ?? [], MatchTeamStats: db.MatchTeamStats ?? [], Competition: db.Competition, Club: db.Club }
  const plan = planOfficialTeams(full, SEASON_2026_ID)
  const isSim = (t: Team) => t.id === 't26_sim' || /^simulation fc$/i.test(t.name.trim())
  plan.removed = plan.removed.filter((r) => isSim(r.team))
  plan.created = []
  const official = new Set(plan.kept.map((k) => k.team.id))
  const extra = db.Competition.some((c) => c.season_id === SEASON_2026_ID && c.phase === 'league_phase' && (c.team_ids ?? []).some((id) => !official.has(id)))
  if (!plan.removed.length && !extra) return {}
  const out = applyOfficialPlan(full, { ...plan, kept: plan.kept.map((k) => ({ ...k, rename: undefined, logo: false })) }) as Rules6Data & { Club?: Club[] }
  out.Competition = out.Competition!.map((c) => {
    const ps = c.preseason
    if (c.season_id !== SEASON_2026_ID || c.phase !== 'league_phase' || !ps?.draw_order || ps.published_rounds?.length) return c
    if (ps.draw_order.every((id) => official.has(id)) && ps.draw_order.length === official.size) return c
    const rest = { ...ps }
    for (const k of ['seed', 'draw_order', 'drawn_at', 'drawn_by', 'revealed', 'pending', 'rests'] as const) delete rest[k]
    return { ...c, preseason: rest }
  })
  return out
}

/**
 * Tirage OFFICIEL de la journée 1 (2026-2027) : remplace le tirage enregistré auparavant (aucun match joué), avec
 * sauvegarde JSON de l'ancien tirage dans le journal de l'admin. « TAQEEF (MIDEA) » s'affiche « Taqeef (Midea) ».
 */
export function applyOfficialJ1(db: Rules6Data): Rules6Data {
  const comp = db.Competition?.find((c) => c.id === 'comp_2026_selection' || (c.season_id === SEASON_2026_ID && c.phase === 'league_phase' && c.format === 'swiss'))
  if (!comp || !db.Match || !db.Team) return {}
  const out: Rules6Data = {}
  const mid = db.Team.find((t) => t.season_id === SEASON_2026_ID && t.short_name === 'MID')
  if (mid && mid.name !== 'Taqeef (Midea)') out.Team = db.Team.map((t) => (t.id === mid.id ? { ...t, name: 'Taqeef (Midea)', company: t.company ?? 'Taqeef (Midea)' } : t))
  let j1: ReturnType<typeof buildOfficialJ1>
  try { j1 = buildOfficialJ1(comp.id, comp.season_id, comp.team_ids ?? [], undefined, db.Team) } catch (e) { void e; return out }
  const old = db.Match.filter((m) => m.competition_id === comp.id && m.round === 1)
  const alreadyOfficial = old.length === j1.matches.length && j1.matches.every((o) => old.some((m) => m.number === o.number && m.home_team_id === o.home_team_id && m.away_team_id === o.away_team_id))
  if (alreadyOfficial && comp.preseason?.draw_source === 'manual') return out
  const ids = new Set(old.map((m) => m.id))
  const played = old.some((m) => m.status === 'finished' || m.status === 'live' || m.validated) || (db.MatchEvent ?? []).some((e) => ids.has(e.match_id))
  const now = new Date().toISOString()
  const entry = (action: string, details: Record<string, unknown>) => ({ id: `log_${action}_${Date.now().toString(36)}`, created_date: now, action, entity: 'Competition', entity_id: comp.id, entity_label: comp.name, author_email: 'systeme', author_name: 'Mise à jour du site', details } as BaseEntity)
  if (played) {
    out.AuditLog = [entry('preseason_official_draw_blocked', { message: 'Tirage officiel NON appliqué : des matchs de la journée 1 ont déjà été joués. À corriger à la main.' }), ...(db.AuditLog ?? [])]
    return out
  }
  const backup = { competition: comp.id, preseason: comp.preseason ?? null, matches: old }
  out.Match = [...db.Match.filter((m) => !ids.has(m.id) && !j1.matches.some((o) => o.id === m.id)), ...j1.matches.map((m) => ({ ...m, created_date: now }))]
  if (db.Lineup?.some((l) => ids.has(l.match_id))) out.Lineup = db.Lineup.filter((l) => !ids.has(l.match_id))
  const { pending: _p, seed: _s, ...keep } = comp.preseason ?? {}
  void _p; void _s
  out.Competition = db.Competition!.map((c) => (c.id === comp.id ? { ...c, status: 'active' as const, rounds: [...new Set([...(c.rounds ?? []), 1])].sort((a, b) => a - b), preseason: { ...keep, ...j1.preseason } } : c))
  out.AuditLog = [entry('preseason_official_draw', { message: 'Tirage J1 remplacé par le tirage officiel', anciens_matchs: old.length, nouveaux_matchs: j1.matches.length, repos: 'Canpack 2', sauvegarde_json: JSON.stringify(backup) }), ...(db.AuditLog ?? [])]
  return out
}

/**
 * Joueurs importés pour une saison mais rattachés à l'équipe d'une AUTRE saison (l'import CSV prenait la première
 * équipe portant le nom court, p. ex. ARW 2025 au lieu de ARW 2026) : ils sont replacés dans l'équipe de leur saison
 * portant le même nom court. Seuls les joueurs d'une seule saison sont concernés (pas les anciens multi-saisons).
 */
export function applyPlayersSeasonTeams(db: Rules6Data): Rules6Data {
  if (!db.Player || !db.Team) return {}
  const comps = db.Competition ?? []
  const seasonOf = (t: Team) => t.season_id ?? comps.find((c) => c.team_ids?.includes(t.id))?.season_id
  const teams = new Map(db.Team.map((t) => [t.id, t]))
  let n = 0
  const Player = db.Player.map((p) => {
    const t = teams.get(p.team_id)
    if (!t || p.season_ids?.length !== 1) return p
    const ps = p.season_ids[0], ts = seasonOf(t)
    if (!ts || ts === ps) return p
    const target = db.Team!.find((x) => x.short_name === t.short_name && x.id !== t.id && seasonOf(x) === ps)
    if (!target) return p
    n++
    return { ...p, team_id: target.id }
  })
  return n ? { Player } : {}
}

/** Saison 2025-2026 masquée sur le site public (décision de la ligue) ; les stats restent dans l'historique des joueurs. */
export function applyHideSeason2025(db: Rules6Data): Rules6Data {
  if (!db.Season?.some((s) => s.id === 'season_2025' && !s.hidden)) return {}
  return { Season: db.Season.map((s) => (s.id === 'season_2025' ? { ...s, hidden: true, is_active: false } : s)) }
}

const STEPS = [applyRules6v6, applyLot1, applyReglementV4, applyRenameCompetitions, applySplitSharedTeams, applyClubs, applyCaptains, applyOfficialTeams2026, applyDisciplineV8, applyReglementV9, applyRemoveSimulation2026, applyOfficialJ1, applyPlayersSeasonTeams, applyHideSeason2025]
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

export const MIGRATION_COUNT = STEPS.length
const MIGRATED = ['Player', 'MatchEvent', 'MatchTeamStats', 'Award', 'TeamOfWeek', 'Lineup', 'Page', 'Team', 'Settings', 'Rulebook', 'Season', 'Competition', 'Match', 'Division', 'Club', 'Suspension', 'Draw', 'CaptainTeam', 'AuditLog'] as const

/** Applique au contenu du store les migrations à partir de l'étape `from` (données du navigateur ou de Supabase). */
export function migrateStoreFrom(from: number) {
  if (from >= STEPS.length) return
  const db = Object.fromEntries(MIGRATED.map((n) => [n, store.all(n)])) as Rules6Data
  const changed = migrate(db, from)
  store.batch(() => { for (const [name, rows] of Object.entries(changed)) store.replace(name as (typeof MIGRATED)[number], rows as never) })
}

/** Applique les migrations manquantes sur les données du navigateur. */
export function migrateStoredData() {
  const legacy = store.getFlag('migrated-6v6') ? 1 : 0
  const from = Number(store.getFlag(VERSION_FLAG) ?? legacy) || legacy
  if (from >= STEPS.length) return
  migrateStoreFrom(from)
  store.setFlag(VERSION_FLAG, String(STEPS.length))
}

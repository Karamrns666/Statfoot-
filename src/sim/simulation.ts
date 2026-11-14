// ============================================================================
//  SIMULATION d'une saison complète (fonction PURE, graine fixe → reproductible à l'identique).
//
//  Isolation : rien n'est lu ou écrit dans les vraies données. On reçoit une COPIE en lecture des vraies
//  données (équipes de la saison, moyennes de 2025/2026) et on fabrique un jeu de données séparé où CHAQUE
//  enregistrement porte `is_simulation: true` et `simulation_id: SIM_ID`, avec des identifiants préfixés `sim_`.
//  Ce jeu est rangé dans une table à part (sim_rows), visible uniquement par les admins connectés.
//
//  Tout passe par les moteurs de la plateforme : tirage et appariements suisses (preseason.ts), répartition
//  MASTER / CHALLENGER, calendrier (roundRobin), tableau final (buildBracket / resolveSource), événements
//  (buildAction : tirs cadrés automatiques, 2e jaune…), classements (computeStandings, Art. 17.3),
//  récompenses (computeAwards, periodRewards). Seuls les scores sont tirés au sort (loi de Poisson calée sur
//  la moyenne de buts et la répartition V/N/D observées en 2025/2026, avec des écarts de niveau entre équipes).
// ============================================================================
import type {
  Award, CaptainLine, CaptainMatch, CaptainTeam, Club, Competition, DisciplineCase, EntityMap, EntityName, Group, Lineup, Match,
  MatchEvent, MatchStage, MonthlyAward, Player, ProcesVerbal, Season, Settings, Suspension, Team, XPRule,
} from '@/types/entities'
import { seededRng } from '@/lib/draw'
import { PRESEASON_DEFAULTS, preseasonFormat, drawRound1, generateNextRound, preseasonState, resolvePreseasonConfig, type PMatch } from '@/lib/preseason'
import { buildBracket, resolveSource, roundRobin } from '@/lib/schedule'
import { buildAction, type NewEvent } from '@/lib/matchEngine'
import { computeStandings, isPlayed, type StandingRow } from '@/lib/standings'
import { wallToISO } from '@/lib/matchTime'
import { PITCHES } from '@/config/pitches'
import { seniorityMap } from '@/lib/seniority'
import { teamSeasonId } from '@/lib/clubs'
import { leagueFromDb } from '@/lib/leagueData'
import { computeAwards } from '@/lib/stats'
import { periodRewards, seasonMonths } from '@/lib/rewards'
import { councilPvText } from '@/lib/council'
import { teamLogoSvg } from '@/lib/logos'
import { DEFAULT_COMPETITION_NAMES } from '@/lib/competitionNames'
import { FICTIVE_COMPANIES, FIRST_NAMES, LAST_NAMES } from './names'

import { SIM_ID, SIM_SEED, SIM_SEASON_ID, SIM_SEASON_NAME } from './constants'
export { SIM_ID, SIM_SEED, SIM_SEASON_ID, SIM_SEASON_NAME }

export type SimRows = { [N in EntityName]?: EntityMap[N][] }
export type RealDb = { [N in EntityName]: EntityMap[N][] }
export interface SimFlags { is_simulation: true; simulation_id: string }

export interface SimReport {
  seed: number
  rows: Record<string, number>
  matches: number
  reference: { season: string; matches: number; avgGoals: number; home: number; draw: number; away: number }
  simulated: { avgGoals: number; home: number; draw: number; away: number }
  cases: string[]
}

// ---------------------------------------------------------------------------
//  Aléatoire reproductible
// ---------------------------------------------------------------------------
function makeRng(seed: number) {
  const r = seededRng(seed)
  const api = {
    f: r,
    int: (a: number, b: number) => a + Math.floor(r() * (b - a + 1)),
    pick: <T,>(a: T[]) => a[Math.floor(r() * a.length)],
    chance: (p: number) => r() < p,
    normal: () => { const u = Math.max(1e-9, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) },
    poisson: (l: number) => { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= r() } while (p > L); return k - 1 },
    weighted: <T,>(items: T[], w: (x: T) => number) => {
      const tot = items.reduce((s, x) => s + w(x), 0)
      let t = r() * tot
      for (const x of items) { t -= w(x); if (t <= 0) return x }
      return items[items.length - 1]
    },
    shuffle: <T,>(a: T[]) => { const o = [...a]; for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]] } return o },
  }
  return api
}
type Rng = ReturnType<typeof makeRng>

const addDays = (day: string, n: number) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '')

/** Créneaux réalistes en soirée sur les 2 terrains, jour par jour */
function slots(n: number, days: string[], times = ['19:00', '20:00', '21:00', '22:00']) {
  const out: { day: string; time: string; pitch: string }[] = []
  for (const day of days) for (const time of times) for (const pitch of PITCHES) if (out.length < n) out.push({ day, time, pitch })
  return out
}

// ---------------------------------------------------------------------------
//  Statistiques de référence (saison 2025/2026)
// ---------------------------------------------------------------------------
function referenceStats(real: RealDb, seasonId: string) {
  const ms = real.Match.filter((m) => m.season_id === seasonId && isPlayed(m) && !m.forfeit_team_id)
  if (!ms.length) return { matches: 0, avgGoals: 5.4, home: 0.43, draw: 0.16, away: 0.41 }
  const goals = ms.reduce((s, m) => s + m.home_score! + m.away_score!, 0)
  const h = ms.filter((m) => m.home_score! > m.away_score!).length, d = ms.filter((m) => m.home_score === m.away_score).length
  return { matches: ms.length, avgGoals: goals / ms.length, home: h / ms.length, draw: d / ms.length, away: (ms.length - h - d) / ms.length }
}

// ---------------------------------------------------------------------------
//  Générateur
// ---------------------------------------------------------------------------
export function buildSimulation(real: RealDb, opts: { seed?: number; generatedAt?: string } = {}): { rows: SimRows; report: SimReport } {
  const seed = opts.seed ?? SIM_SEED
  const now = opts.generatedAt ?? '2026-11-13T12:00:00.000Z'
  const rnd = makeRng(seed)
  const flags: SimFlags = { is_simulation: true, simulation_id: SIM_ID }
  const tag = <T extends object>(r: T): T => ({ ...r, ...flags, created_date: now, updated_date: now, created_by: 'simulation' })
  const cases: string[] = []

  // --- saison réelle de référence (équipes) et saison 2025/2026 (moyennes)
  const seasons = [...real.Season].sort((a, b) => b.start_date.localeCompare(a.start_date))
  const realSeason = seasons.find((s) => s.is_active && !s.hidden) ?? seasons[0]
  if (!realSeason) throw new Error('Aucune saison réelle : impossible de copier les équipes.')
  const refSeason = seasons.filter((s) => s.id !== realSeason.id).map((s) => ({ s, n: real.Match.filter((m) => m.season_id === s.id && isPlayed(m)).length })).sort((a, b) => b.n - a.n)[0]?.s
  const ref = refSeason ? referenceStats(real, refSeason.id) : referenceStats(real, '')
  const realComp = real.Competition.find((c) => c.season_id === realSeason.id && c.phase === 'league_phase' && c.format === 'swiss')
  const realTeams = (realComp?.team_ids?.length ? realComp.team_ids.map((id) => real.Team.find((t) => t.id === id)).filter(Boolean) as Team[] : real.Team.filter((t) => teamSeasonId(t, real.Competition) === realSeason.id))
    .sort((a, b) => a.name.localeCompare(b.name))
  if (realTeams.length < 8) throw new Error(`Seulement ${realTeams.length} équipes dans la saison ${realSeason.name}.`)
  const sen = seniorityMap(real.Team, real.Competition, real.Season, real.Club ?? [])
  const settings = real.Settings[0] ?? ({ id: 'settings' } as Settings)
  const names = { gold: settings.competition_names?.gold || DEFAULT_COMPETITION_NAMES.gold, silver: settings.competition_names?.silver || DEFAULT_COMPETITION_NAMES.silver, pre: settings.competition_names?.league_phase || DEFAULT_COMPETITION_NAMES.league_phase }

  // --- saison, réglages, règles XP, règlement (copies rattachées à la simulation)
  const season: Season = tag({ id: SIM_SEASON_ID, name: SIM_SEASON_NAME, start_date: '2026-11-16', end_date: '2027-06-30', status: 'closed', is_active: true, closed_at: '2027-06-30T20:00:00.000Z', league_phase_rounds: 4, gold_size: 12, rulebook_version: realSeason.rulebook_version } as Season)
  const xpRules: XPRule[] = real.XPRule.filter((r) => r.season_id === realSeason.id).map((r) => tag({ ...r, id: `sim_${r.id}`, season_id: SIM_SEASON_ID }))
  const rulebooks = real.Rulebook.filter((r) => r.status === 'current' || r.season_id === realSeason.id).map((r) => tag({ ...r, id: `sim_${r.id}`, season_id: SIM_SEASON_ID }))
  const settingsRows = real.Settings.map((s) => tag({ ...s }))
  const pages = real.Page.map((p) => tag({ ...p }))
  const venues = real.Venue.map((v) => tag({ ...v }))

  // --- clubs et équipes (vrais noms et logos), niveau d'ancienneté conservé
  const clubs: Club[] = [], teams: Team[] = [], players: Player[] = []
  const strength = new Map<string, number>()
  const teamById = new Map<string, Team>()
  const weight = new Map<string, number>()
  const realNames = new Set(real.Player.map((p) => norm(`${p.first_name}${p.last_name}`)))
  const usedNames = new Set<string>()
  const newName = () => {
    for (;;) {
      const f = rnd.pick(FIRST_NAMES), l = rnd.pick(LAST_NAMES), k = norm(`${f}${l}`)
      if (!realNames.has(k) && !usedNames.has(k)) { usedNames.add(k); return { first_name: f, last_name: l } }
    }
  }
  const addTeam = (t: Pick<Team, 'name' | 'short_name' | 'company' | 'logo_url' | 'company_logo_url' | 'primary_color' | 'secondary_color'>, seasonsCount: number, nPlayers?: number) => {
    const k = t.short_name.toLowerCase()
    const club: Club = tag({ id: `sim_club_${k}`, name: t.name, logo_url: t.logo_url, seasons_override: seasonsCount > 1 ? seasonsCount : undefined } as Club)
    const team: Team = tag({ id: `sim_t_${k}`, season_id: SIM_SEASON_ID, club_id: club.id, name: t.name, short_name: t.short_name, company: t.company ?? t.name, logo_url: t.logo_url, company_logo_url: t.company_logo_url, primary_color: t.primary_color, secondary_color: t.secondary_color, status: 'active' } as Team)
    clubs.push(club); teams.push(team); teamById.set(team.id, team)
    strength.set(team.id, rnd.normal() * 0.42)
    // 10 à 12 joueurs fictifs, 1 ou 2 gardiens, 1 capitaine
    const n = nPlayers ?? rnd.int(10, 12), gks = rnd.chance(0.45) ? 2 : 1
    const numbers = rnd.shuffle(Array.from({ length: 22 }, (_, i) => i + 2))
    const roster: Player[] = []
    for (let i = 0; i < n; i++) {
      const gk = i < gks
      const p: Player = tag({ id: `sim_p_${k}_${i + 1}`, ...newName(), position: gk ? 'GK' : 'FIELD', number: gk ? (i === 0 ? 1 : 12) : numbers[i], team_id: team.id, season_ids: [SIM_SEASON_ID], status: 'active', rookie: false, documents: {} } as Player)
      roster.push(p)
      weight.set(p.id, gk ? 0.05 : Math.exp(rnd.normal() * 0.6))
    }
    const cap = rnd.pick(roster.filter((p) => p.position !== 'GK'))
    cap.is_captain = true
    team.captain_player_id = cap.id
    players.push(...roster)
    return team
  }
  for (const t of realTeams) addTeam(t, sen.get(t.id)?.seasons ?? 1)
  const teamIds = teams.map((t) => t.id)
  const rosterOf = (tid: string) => players.filter((p) => p.team_id === tid)

  // --- matchs
  const matches: Match[] = [], events: MatchEvent[] = [], lineups: Lineup[] = []
  const bans = new Map<string, number>() // suspensions du conseil restant à purger (joueur → matchs)
  let mseq = 0, eseq = 0
  // calage : moyenne de buts par match identique à 2025/2026 malgré les écarts de niveau (loi log-normale des forces)
  const calib = (() => { const r = makeRng(seed + 42); let t = 0; for (let i = 0; i < 4000; i++) { const d = (r.normal() - r.normal()) * 0.42; t += Math.exp(d) + Math.exp(-d) } return t / 4000 })()
  // (+8 % : les matchs nuls imposés du tableau final et les forfaits tirent la moyenne vers le bas)
  const base = (ref.avgGoals / calib) * 1.08
  const homeAdv = Math.log(Math.max(0.6, Math.min(1.6, (ref.home + 0.01) / (ref.away + 0.01)))) / 2

  interface PlayOpts { ko?: boolean; forceDraw?: boolean; forfeit?: string; red?: boolean; doubleYellow?: boolean; ownGoal?: boolean; rng?: Rng; extra?: Partial<Match> }
  interface Ctx { matches: Match[]; events: MatchEvent[]; lineups: Lineup[]; bans: Map<string, number>; red?: { player: Player; event: MatchEvent; match: Match } }
  const globalCtx: Ctx = { matches, events, lineups, bans }

  function play(ctx: Ctx, comp: Competition, round: number, home: string, away: string, when: { day: string; time: string; pitch: string }, o: PlayOpts = {}, stage?: MatchStage): Match {
    const R = o.rng ?? rnd
    const id = `sim_m${++mseq}`
    const date = wallToISO(when.day, when.time)
    const m: Match = tag({ id, season_id: SIM_SEASON_ID, competition_id: comp.id, round, stage, date, pitch: when.pitch, home_team_id: home, away_team_id: away, status: 'finished', published: true, validated: true, validated_at: date, validated_by: 'simulation', source: 'match_center', half_duration_min: 20, ...o.extra } as Match)
    ctx.matches.push(m)
    if (o.forfeit) {
      m.forfeit_team_id = o.forfeit; m.forfeit_reason = '14.1'
      m.home_score = o.forfeit === home ? 0 : 3; m.away_score = o.forfeit === home ? 3 : 0
      return m
    }
    // feuilles de match : 6 titulaires (1 gardien + 5), remplaçants ; un joueur suspendu ne figure pas sur la feuille
    const sides = [home, away].map((tid) => {
      const all = rosterOf(tid)
      const avail = all.filter((p) => !(ctx.bans.get(p.id)! > 0))
      for (const p of all) if (ctx.bans.get(p.id)! > 0) ctx.bans.set(p.id, ctx.bans.get(p.id)! - 1)
      const gks = avail.filter((p) => p.position === 'GK')
      const gk = gks.length > 1 && R.chance(0.3) ? gks[1] : gks[0] ?? avail[0]
      const field = R.shuffle(avail.filter((p) => p.id !== gk.id)).sort((a, b) => weight.get(b.id)! - weight.get(a.id)! + (R.f() - 0.5) * 1.2)
      const starters = [gk, ...field.slice(0, 5)], subs = avail.filter((p) => !starters.includes(p))
      const team = teamById.get(tid)!
      const lu: Lineup = tag({ id: `sim_lu_${id}_${tid === home ? 'h' : 'a'}`, match_id: id, team_id: tid, present_ids: avail.map((p) => p.id), starter_ids: starters.map((p) => p.id), substitute_ids: subs.map((p) => p.id), goalkeeper_id: gk.id, captain_id: avail.some((p) => p.id === team.captain_player_id) ? team.captain_player_id : starters[1]?.id, numbers: Object.fromEntries(avail.map((p) => [p.id, p.number ?? 0])), validated: true, validated_by: 'simulation', validated_at: date } as Lineup)
      ctx.lineups.push(lu)
      // remplacements (1 à 3, entre la 14e et la 32e minute)
      const changes: { min: number; inn: Player; out: Player }[] = []
      const bench = R.shuffle(subs.filter((p) => p.position !== 'GK'))
      const outs = R.shuffle(starters.slice(1))
      for (let i = 0; i < Math.min(bench.length, R.int(1, 3)); i++) changes.push({ min: R.int(14, 32), inn: bench[i], out: outs[i] })
      const onField = (min: number) => {
        const s = new Set(starters.map((p) => p.id))
        for (const c of changes) if (c.min <= min) { s.delete(c.out.id); s.add(c.inn.id) }
        return avail.filter((p) => s.has(p.id))
      }
      return { tid, gk, starters, subs, changes, onField }
    })
    const [H, A] = sides
    const sh = strength.get(home) ?? 0, sa = strength.get(away) ?? 0
    const lh = base * Math.exp(sh - sa + homeAdv), la = base * Math.exp(sa - sh - homeAdv)
    let hg = Math.min(12, R.poisson(lh)), ag = Math.min(12, R.poisson(la))
    if (o.forceDraw) { const g = Math.max(1, Math.round((hg + ag) / 2)); hg = g; ag = g }

    // actions dans l'ordre chronologique, appliquées par le moteur (buildAction)
    type Act = { min: number; ev: Omit<NewEvent, 'match_id'> }
    const acts: Act[] = []
    const ev = (min: number, e: Omit<NewEvent, 'match_id' | 'minute' | 'period'>) => acts.push({ min, ev: { ...e, minute: min, period: min <= 20 ? '1H' : '2H', clock_ms: ((min - 1) % 20) * 60000 + R.int(0, 59) * 1000 } })
    for (const s of sides) for (const c of s.changes) ev(c.min, { team_id: s.tid, type: 'substitution', player_id: c.inn.id, related_player_id: c.out.id })
    const fieldAt = (s: (typeof sides)[number], min: number) => s.onField(min).filter((p) => p.id !== s.gk.id)
    const scorers: Record<string, number> = {}, assists: Record<string, number> = {}, saves: Record<string, number> = {}
    let ownGoalDone = !o.ownGoal
    for (const [s, n, opp] of [[H, hg, A], [A, ag, H]] as const) {
      for (let i = 0; i < n; i++) {
        const min = R.int(1, 40)
        if (!ownGoalDone && s === H) {
          const p = R.pick(fieldAt(opp, min)); ownGoalDone = true
          ev(min, { team_id: opp.tid, type: 'own_goal', player_id: p.id }); continue
        }
        const f = fieldAt(s, min)
        const scorer = R.weighted(f, (p) => weight.get(p.id)!)
        const helper = R.chance(0.68) ? R.weighted(f.filter((p) => p.id !== scorer.id), (p) => weight.get(p.id)! + 0.3) : undefined
        scorers[scorer.id] = (scorers[scorer.id] ?? 0) + 1
        if (helper) assists[helper.id] = (assists[helper.id] ?? 0) + 1
        ev(min, { team_id: s.tid, type: 'goal', goal_kind: R.chance(0.06) ? 'penalty' : 'normal', player_id: scorer.id, related_player_id: helper?.id })
      }
      // tirs non cadrés et arrêts du gardien adverse
      const lam = s === H ? lh : la
      for (let i = 0; i < R.poisson(1.3 + lam * 1.1); i++) { const min = R.int(1, 40); ev(min, { team_id: s.tid, type: 'shot_off_target', player_id: R.weighted(fieldAt(s, min), (p) => weight.get(p.id)!).id }) }
      for (let i = 0; i < R.poisson(1.6 + lam * 0.8); i++) { const min = R.int(1, 40); saves[opp.gk.id] = (saves[opp.gk.id] ?? 0) + 1; ev(min, { team_id: opp.tid, type: 'save', player_id: opp.gk.id }) }
    }
    // cartons
    for (const s of sides) for (let i = 0; i < R.poisson(0.55); i++) { const min = R.int(3, 40); ev(min, { team_id: s.tid, type: 'yellow_card', player_id: R.pick(fieldAt(s, min)).id }) }
    if (o.doubleYellow) { const p = R.pick(fieldAt(A, 30)); ev(R.int(5, 18), { team_id: A.tid, type: 'yellow_card', player_id: p.id }); ev(R.int(25, 38), { team_id: A.tid, type: 'yellow_card', player_id: p.id }) }
    let redEvent: NewEvent | undefined, redPlayer: Player | undefined
    if (o.red) { redPlayer = R.pick(fieldAt(H, 28)); acts.push({ min: 28, ev: { team_id: H.tid, type: 'red_card', player_id: redPlayer.id, card_target: 'player', minute: 28, period: '2H', clock_ms: 7 * 60000 } }) }
    // application par le moteur
    acts.sort((a, b) => a.min - b.min)
    const mine: MatchEvent[] = []
    for (const a of acts) {
      const out = buildAction(m, mine, { ...a.ev, match_id: m.id } as NewEvent, () => `sim_e${(++eseq).toString(36)}`)
      for (const e of out) { const row = tag({ ...e, operator: 'simulation' } as MatchEvent); mine.push(row); if (o.red && e.type === 'red_card') redEvent = row }
    }
    m.home_score = hg; m.away_score = ag
    m.home_ht_score = mine.filter((e) => e.minute! <= 20 && ((e.type === 'goal' && e.team_id === home) || (e.type === 'own_goal' && e.team_id === away))).length
    m.away_ht_score = mine.filter((e) => e.minute! <= 20 && ((e.type === 'goal' && e.team_id === away) || (e.type === 'own_goal' && e.team_id === home))).length
    // tirs au but (match à élimination directe à égalité)
    if (o.ko && hg === ag) {
      m.penalties = true
      let order = 0, ph = 0, pa = 0
      for (let k = 0; k < 20; k++) {
        for (const [s, opp] of [[H, A], [A, H]] as const) {
          const shooter = R.pick(fieldAt(s, 40)), x = R.f()
          const type = x < 0.74 ? 'shootout_scored' : x < 0.9 ? 'shootout_saved' : 'shootout_missed'
          if (type === 'shootout_scored') { if (s === H) ph++; else pa++ }
          mine.push(tag({ id: `sim_e${(++eseq).toString(36)}`, match_id: m.id, team_id: s.tid, type, player_id: shooter.id, related_player_id: type === 'shootout_saved' ? opp.gk.id : undefined, period: 'PENS', shootout_order: ++order, operator: 'simulation' } as MatchEvent))
        }
        if (k >= 4 && ph !== pa) break
      }
      if (ph === pa) { // mort subite tranchée
        const s = R.chance(0.5) ? H : A
        mine.push(tag({ id: `sim_e${(++eseq).toString(36)}`, match_id: m.id, team_id: s.tid, type: 'shootout_scored', player_id: R.pick(fieldAt(s, 40)).id, period: 'PENS', shootout_order: ++order, operator: 'simulation' } as MatchEvent))
        if (s === H) ph++; else pa++
      }
      m.home_pens = ph; m.away_pens = pa
    }
    ctx.events.push(...mine)
    // homme du match : meilleure contribution (buts, passes, arrêts), de préférence dans l'équipe gagnante
    const winner = hg > ag ? home : ag > hg ? away : m.home_pens != null ? (m.home_pens > m.away_pens! ? home : away) : null
    const cands = sides.flatMap((s) => s.onField(40).concat(s.changes.map((c) => c.out)).map((p) => ({ p, s })))
    const score = (x: { p: Player; s: (typeof sides)[number] }) => (scorers[x.p.id] ?? 0) * 3 + (assists[x.p.id] ?? 0) * 2 + (saves[x.p.id] ?? 0) * 0.7 + (x.s.tid === winner ? 1.5 : 0) + R.f() * 0.5
    m.motm_player_id = [...cands].sort((a, b) => score(b) - score(a))[0]?.p.id
    if (redEvent && redPlayer) {
      ctx.red = { player: redPlayer, event: redEvent as MatchEvent, match: m }
      // décision du conseil 2 jours plus tard : suspendu pour les 2 matchs suivants de son équipe (absent des feuilles)
      ctx.bans.set(redPlayer.id, 2)
    }
    return m
  }

  // =========================================================================
  //  1. Pré-saison en système suisse : 4 journées + rattrapage (42 matchs à 21 équipes)
  // =========================================================================
  const cfg = resolvePreseasonConfig({ ...PRESEASON_DEFAULTS, rounds: 4, masterSize: Math.min(PRESEASON_DEFAULTS.masterSize, teamIds.length - 2) })
  const pre: Competition = tag({ id: 'sim_comp_pre', season_id: SIM_SEASON_ID, name: names.pre, phase: 'league_phase', format: 'swiss', status: 'finished', team_ids: teamIds, half_duration_min: 20, foul_alert_threshold: 5, order: 1, color: '#F05A22', description: 'Pré-saison en système suisse (simulation)' } as Competition)
  const drawSeed = seed % 100000
  const r1 = drawRound1(teamIds, drawSeed)
  const drawOrder = r1.order
  const pm: PMatch[] = []
  const rests: Record<number, string | undefined> = { 1: r1.rest }
  const totalRounds = cfg.rounds + 1
  let number = 0
  for (let round = 1; round <= totalRounds; round++) {
    const plan = round === 1 ? { round: 1, rest: r1.rest, pairs: r1.pairs } : generateNextRound(teamIds, pm, rests, cfg, drawOrder)
    rests[round] = plan.rest
    const monday = addDays('2026-11-16', (round - 1) * 7)
    const sl = slots(plan.pairs.length, [monday, addDays(monday, 1)])
    plan.pairs.forEach((p, i) => {
      // cas particulier : un match de la J2 reporté pour intempéries, joué trois jours plus tard
      const postponed = round === 2 && i === plan.pairs.length - 1
      const when = postponed ? { day: addDays(monday, 3), time: '21:00', pitch: PITCHES[0] } : sl[i]
      const extra: Partial<Match> = { number: `PS-${String(++number).padStart(2, '0')}`, pairing_reason: p.reason }
      if (postponed) { extra.postponed_from = wallToISO(sl[i].day, sl[i].time); extra.postponed_reason = 'Intempéries (fortes pluies) : terrain impraticable' }
      const m = play(globalCtx, pre, round, p.home, p.away, when, { extra })
      if (postponed) cases.push(`Match reporté (météo) puis joué : ${m.number} · ${teamById.get(p.home)!.name} – ${teamById.get(p.away)!.name}`)
      pm.push({ id: m.id, round, home: p.home, away: p.away, hs: m.home_score, as: m.away_score, played: true, reason: p.reason })
    })
  }
  const preState = preseasonState(teamIds, pm, rests, cfg, drawOrder)
  if (!preState.finished || pm.length !== preseasonFormat(teamIds.length, cfg.rounds).total) throw new Error(`Pré-saison incomplète (${pm.length} matchs).`)
  const finalRanking = preState.ranking.map((r) => r.team_id)
  const masterIds = finalRanking.slice(0, cfg.masterSize), challengerIds = finalRanking.slice(cfg.masterSize)

  // =========================================================================
  //  2–3. MASTER (top 12) et CHALLENGER (13e à 23e), calendrier généré, 2 terrains, soirées
  // =========================================================================
  const master: Competition = tag({ id: 'sim_comp_master', season_id: SIM_SEASON_ID, name: names.gold, phase: 'gold', format: 'league', status: 'finished', team_ids: masterIds, color: '#E8B931', order: 2, logo_url: '/brand/logo-master.png', parent_id: pre.id, half_duration_min: 20, foul_alert_threshold: 5, description: `Places 1 à ${cfg.masterSize} de la pré-saison` } as Competition)
  const challenger: Competition = tag({ id: 'sim_comp_challenger', season_id: SIM_SEASON_ID, name: names.silver, phase: 'silver', format: 'league', status: 'finished', team_ids: challengerIds, color: '#7FB2E5', order: 3, logo_url: '/brand/logo-challenger.png', parent_id: pre.id, half_duration_min: 20, foul_alert_threshold: 5, description: `Places ${cfg.masterSize + 1} à ${teamIds.length} de la pré-saison` } as Competition)
  pre.status = 'finished'
  pre.rounds = Array.from({ length: totalRounds }, (_, i) => i + 1)
  pre.split = { gold_to: cfg.masterSize, silver_from: cfg.masterSize + 1, gold_name: names.gold, silver_name: names.silver }
  pre.preseason = {
    config: { rounds: cfg.rounds, masterSize: cfg.masterSize, points: cfg.points }, seed: drawSeed, draw_source: 'seed', draw_order: drawOrder, drawn_at: '2026-11-09T19:00:00.000Z', drawn_by: 'simulation',
    rests: Object.fromEntries(Object.entries(rests).filter(([, v]) => v).map(([k, v]) => [k, v!])), created_rounds: pre.rounds, published_rounds: pre.rounds, number_counter: number,
    closed_at: '2026-12-15T20:00:00.000Z', final_ranking: finalRanking, split: { master_size: cfg.masterSize, master_id: master.id, challenger_id: challenger.id, at: '2026-12-16T10:00:00.000Z' },
  }

  const divisionDays = (round: number, weekday: number) => addDays('2027-01-04', (round - 1) * 7 + weekday)
  const playLeague = (ctx: Ctx, comp: Competition, ids: string[], weekday: number, rng: Rng, special: (round: number, i: number) => PlayOpts) => {
    const fixtures = roundRobin(ids, false)
    const rounds = [...new Set(fixtures.map((f) => f.round))]
    for (const r of rounds) {
      const fx = fixtures.filter((f) => f.round === r)
      const sl = slots(fx.length, [divisionDays(r, weekday)])
      fx.forEach((f, i) => play(ctx, comp, r, f.home, f.away, sl[i], { rng, ...special(r, i) }))
    }
    comp.rounds = rounds
  }
  const standingsOf = (ctx: Ctx, comp: Competition) => computeStandings(ctx.matches.filter((m) => m.competition_id === comp.id), comp.team_ids ?? [], null, ctx.events, (a, b) => teamById.get(a)!.name.localeCompare(teamById.get(b)!.name))
  const h2hTie = (rows: StandingRow[]) => rows.find((r) => r.tiebreak?.key === 'h2h')

  // MASTER : on rejoue les résultats (graines dérivées) jusqu'à obtenir une égalité de points départagée par la confrontation directe
  let masterCtx: Ctx | null = null, masterSeed = 0
  const snapshot = { m: mseq, e: eseq }
  for (let k = 0; k < 400; k++) {
    mseq = snapshot.m; eseq = snapshot.e
    const ctx: Ctx = { matches: [], events: [], lineups: [], bans: new Map(bans) }
    playLeague(ctx, master, masterIds, 0, makeRng(seed + 1000 + k), (r, i) => ({ red: r === 4 && i === 0, doubleYellow: r === 6 && i === 1 }))
    if (h2hTie(standingsOf(ctx, master))) { masterCtx = ctx; masterSeed = seed + 1000 + k; break }
  }
  if (!masterCtx) throw new Error('Impossible d’obtenir une égalité départagée par la confrontation directe.')
  matches.push(...masterCtx.matches); events.push(...masterCtx.events); lineups.push(...masterCtx.lineups)
  const tie = h2hTie(standingsOf(masterCtx, master))!
  cases.push(`Égalité de points départagée par la confrontation directe (${names.gold}) : ${teamById.get(tie.team_id)!.name} — ${tie.tiebreak!.detail} (graine ${masterSeed})`)
  cases.push(`Double jaune (${names.gold}, J6)`)

  // conseil de discipline : carton rouge direct en MASTER (J4) → affaire, vote, suspension de 2 matchs, PV
  const red = masterCtx.red!
  const decided = new Date(new Date(red.match.date!).getTime() + 2 * 86400000).toISOString()
  const caseRow: DisciplineCase = tag({ id: 'sim_case_1', season_id: SIM_SEASON_ID, player_id: red.player.id, team_id: red.player.team_id, match_id: red.match.id, event_id: red.event.id, incident: 'Coup porté à un adversaire après une action, signalé dans le rapport de l’arbitre (carton rouge direct).', proposed_matches: 2, vote_opened_at: new Date(new Date(red.match.date!).getTime() + 86400000).toISOString(), status: 'decided', decision: 'suspension', decision_matches: 2, decided_at: decided, suspension_id: 'sim_susp_1', pv_id: 'sim_pv_1' } as DisciplineCase)
  const suspension: Suspension = tag({ id: 'sim_susp_1', season_id: SIM_SEASON_ID, player_id: red.player.id, team_id: red.player.team_id, origin_match_id: red.match.id, origin_event_id: red.event.id, date: decided, matches: 2, kind: 'council', case_id: caseRow.id, reason: 'Décision du conseil de discipline', notified_at: decided } as Suspension)
  const teamOfRed = teamById.get(red.player.team_id)!
  const opp = teamById.get(red.match.home_team_id === teamOfRed.id ? red.match.away_team_id : red.match.home_team_id)!
  const pvs: ProcesVerbal[] = [tag({ id: 'sim_pv_1', season_id: SIM_SEASON_ID, kind: 'discipline', title: `Conseil de discipline — ${red.player.first_name} ${red.player.last_name}`, date: decided.slice(0, 10), case_id: caseRow.id, match_id: red.match.id, text: councilPvText(caseRow, { season: SIM_SEASON_NAME, player: red.player, team: teamOfRed, match: { date: red.match.date, label: `${teamOfRed.name} – ${opp.name}` } }) } as ProcesVerbal)]
  cases.push(`Conseil de discipline : ${red.player.first_name} ${red.player.last_name} (${teamOfRed.name}), suspension de 2 matchs, PV`)
  // CHALLENGER : un forfait (3-0) et un but contre son camp
  playLeague(globalCtx, challenger, challengerIds, 2, makeRng(seed + 5000), (r, i) => ({ forfeit: r === 7 && i === 0 ? '__away' : undefined, ownGoal: r === 3 && i === 1 }))
  {
    // forfait : l'équipe à l'extérieur ne s'est pas présentée → 3-0 sur tapis vert (PV)
    const m = matches.find((x) => x.forfeit_team_id === '__away')!
    m.forfeit_team_id = m.away_team_id
    pvs.push(tag({ id: 'sim_pv_2', season_id: SIM_SEASON_ID, kind: 'forfait', title: `Forfait — ${teamById.get(m.away_team_id)!.name}`, date: m.date!.slice(0, 10), match_id: m.id, text: `*PROCÈS-VERBAL — FORFAIT*\nArdentia Football · ${SIM_SEASON_NAME}\n\n*Objet* : ${teamById.get(m.home_team_id)!.name} – ${teamById.get(m.away_team_id)!.name}\n\n*Faits* : l’équipe ${teamById.get(m.away_team_id)!.name} ne s’est pas présentée à l’heure du coup d’envoi.\n\n*Décision* : match perdu par forfait, score officiel 3-0 (Art. 14).` } as ProcesVerbal))
    cases.push(`Forfait 3-0 (${names.silver}, J7) : ${teamById.get(m.away_team_id)!.name}`)
    cases.push(`But contre son camp (${names.silver}, J3)`)
  }

  // =========================================================================
  //  4. Tournoi : 4 équipes de la ligue + 4 nouvelles équipes fictives, groupes puis élimination directe
  // =========================================================================
  const masterRows = standingsOf(globalCtx, master), challRows = standingsOf(globalCtx, challenger)
  const fictive = FICTIVE_COMPANIES.map((c) => addTeam({ name: c.name, short_name: c.short, company: c.name, logo_url: teamLogoSvg(c.short, c.c1, c.c2), primary_color: c.c1, secondary_color: c.c2 }, 1, 10))
  for (const t of fictive) strength.set(t.id, rnd.normal() * 0.3 - 0.15)
  const tour: Competition = tag({ id: 'sim_comp_tournoi', season_id: SIM_SEASON_ID, name: 'Tournoi MBL', phase: 'knockout', format: 'groups_knockout', status: 'finished', color: '#22C55E', order: 4, half_duration_min: 20, foul_alert_threshold: 5, description: 'Phase de groupes puis élimination directe (4 nouvelles équipes inscrites)' } as Competition)
  const gA = [masterRows[0].team_id, challRows[1].team_id, fictive[0].id, fictive[1].id], gB = [masterRows[1].team_id, challRows[0].team_id, fictive[2].id, fictive[3].id]
  tour.team_ids = [...gA, ...gB]
  const groups: Group[] = [tag({ id: 'sim_grp_a', competition_id: tour.id, name: 'Groupe A', team_ids: gA, order: 1 } as Group), tag({ id: 'sim_grp_b', competition_id: tour.id, name: 'Groupe B', team_ids: gB, order: 2 } as Group)]
  const tourRng = makeRng(seed + 7000)
  for (const g of groups) {
    const fx = roundRobin(g.team_ids!, false)
    for (const r of [1, 2, 3]) {
      const sl = slots(4, [addDays('2027-04-03', (r - 1) * 7)], ['15:00', '16:00', '17:00', '18:00'])
      fx.filter((f) => f.round === r).forEach((f, i) => play(globalCtx, tour, r, f.home, f.away, sl[i + (g.order === 2 ? 2 : 0)], { rng: tourRng }, 'group'))
    }
  }
  const tables = new Map(groups.map((g) => [g.id, computeStandings(matches.filter((m) => m.competition_id === tour.id && g.team_ids!.includes(m.home_team_id) && g.team_ids!.includes(m.away_team_id)), g.team_ids!, null, events)]))
  const complete = new Map(groups.map((g) => [g.id, true]))
  const bracket = buildBracket({ groupIds: groups.map((g) => g.id), qualifiers: 4, thirdPlace: true })
  for (const stage of ['semi', 'third_place', 'final'] as const) {
    bracket.filter((b) => b.stage === stage).forEach((b, i) => {
      const ctxR = { tables, tablesComplete: complete, matches, competitionId: tour.id }
      const home = resolveSource(b.home_source, ctxR)!, away = resolveSource(b.away_source, ctxR)!
      const round = stage === 'semi' ? 4 : 5
      const day = stage === 'semi' ? '2027-04-24' : '2027-05-01'
      const when = { day, time: stage === 'final' ? '20:00' : stage === 'third_place' ? '18:30' : i === 0 ? '18:00' : '19:30', pitch: PITCHES[0] }
      // au moins 2 matchs décidés aux tirs au but : 2e demi-finale et finale
      const forceDraw = (stage === 'semi' && i === 1) || stage === 'final'
      play(globalCtx, tour, round, home, away, when, { rng: tourRng, ko: true, forceDraw, extra: { bracket_slot: b.bracket_slot, home_source: b.home_source, away_source: b.away_source } }, stage)
    })
  }
  tour.rounds = [1, 2, 3, 4, 5]
  cases.push('Tournoi : 2 matchs décidés aux tirs au but (demi-finale 2 et finale)')

  // =========================================================================
  //  5. Matchs des capitaines (Orange vs Bleu), hors classement
  // =========================================================================
  const caps = teams.filter((t) => !fictive.includes(t)).map((t) => players.find((p) => p.id === t.captain_player_id)!)
  const orangeIds = caps.filter((p) => masterIds.includes(p.team_id)).map((p) => p.id), bleueIds = caps.filter((p) => challengerIds.includes(p.team_id)).map((p) => p.id)
  const captainTeams: CaptainTeam[] = [
    tag({ id: 'sim_cap_orange', side: 'orange', name: 'Équipe Orange', color: '#F05A22', player_ids: orangeIds, captain_id: orangeIds[0] } as CaptainTeam),
    tag({ id: 'sim_cap_bleue', side: 'bleue', name: 'Équipe Bleue', color: '#1F6FE0', player_ids: bleueIds, captain_id: bleueIds[0] } as CaptainTeam),
  ]
  const capRng = makeRng(seed + 9000)
  const captainMatches: CaptainMatch[] = ['2027-02-20', '2027-04-10', '2027-06-05'].map((day, k) => {
    const lines: CaptainLine[] = []
    for (const [side, ids] of [['orange', orangeIds], ['bleue', bleueIds]] as const) {
      const sel = capRng.shuffle(ids).slice(0, 8)
      sel.forEach((pid, i) => lines.push({ side, player_id: pid, played: true, goals: 0, og: 0, assists: 0, yc: capRng.chance(0.06) ? 1 : 0, rc: 0, saves: i === 0 ? capRng.int(2, 7) : 0, gk: i === 0 }))
      const goals = k === 1 ? 3 : capRng.poisson(2.6)
      for (let g = 0; g < goals; g++) {
        const field = lines.filter((l) => l.side === side && !l.gk)
        capRng.pick(field).goals++
        if (capRng.chance(0.6)) capRng.pick(field).assists++
      }
    }
    const draw = k === 1
    return tag({ id: `sim_capm_${k + 1}`, date: wallToISO(day, '18:00'), pitch: PITCHES[0], status: 'finished', lines, orange_pens: draw ? 4 : null, bleue_pens: draw ? 3 : null, motm_player_id: [...lines].sort((a, b) => b.goals * 3 + b.assists * 2 + b.saves * 0.5 - (a.goals * 3 + a.assists * 2 + a.saves * 0.5))[0].player_id, notes: 'Match des capitaines (simulation), hors classement' } as CaptainMatch)
  })

  // =========================================================================
  //  Récompenses : joueur / équipe / but du mois, trophées de fin de saison (MASTER, CHALLENGER, saison)
  // =========================================================================
  const competitions = [pre, master, challenger, tour]
  const dbForStats = { Season: [season], Competition: competitions, Division: [], Group: groups, Team: teams, Player: players, Match: matches, MatchEvent: events, Lineup: lineups, XPRule: xpRules, Suspension: [suspension], MonthlyAward: [] as MonthlyAward[], MatchTeamStats: [] }
  const league0 = leagueFromDb(dbForStats as never, settings)
  const monthly: MonthlyAward[] = []
  for (const month of seasonMonths(league0, SIM_SEASON_ID)) {
    const rw = periodRewards(league0, SIM_SEASON_ID, { type: 'month', month })
    const bp = rw.find((r) => r.key === 'best_player'), bt = rw.find((r) => r.key === 'best_team')
    if (bp?.player_id) monthly.push(tag({ id: `sim_mon_${month}_p`, season_id: SIM_SEASON_ID, month, type: 'player', player_id: bp.player_id, designated_by: 'simulation' } as MonthlyAward))
    if (bt?.team_id) monthly.push(tag({ id: `sim_mon_${month}_t`, season_id: SIM_SEASON_ID, month, type: 'team', team_id: bt.team_id, designated_by: 'simulation' } as MonthlyAward))
    const goals = events.filter((e) => e.type === 'goal' && matches.find((m) => m.id === e.match_id)?.date?.startsWith(month))
    if (goals.length) { const g = makeRng(seed + month.length + Number(month.slice(5))).pick(goals); monthly.push(tag({ id: `sim_mon_${month}_g`, season_id: SIM_SEASON_ID, month, type: 'goal', event_id: g.id, player_id: g.player_id, team_id: g.team_id, designated_by: 'simulation' } as MonthlyAward)) }
  }
  const league = leagueFromDb({ ...dbForStats, MonthlyAward: monthly } as never, settings)
  const awards: Award[] = []
  for (const [scope, phase] of [['season', 'all'], ['gold', 'gold'], ['silver', 'silver']] as const) {
    for (const a of computeAwards(league, { seasonId: SIM_SEASON_ID, phase })) {
      awards.push(tag({ id: `sim_award_${scope}_${a.category}`, season_id: SIM_SEASON_ID, scope, category: a.category, player_id: a.player_id, team_id: a.team_id, value: a.value, snapshot: a.snapshot, not_awarded: a.not_awarded, status: 'published', locked: true } as Award))
    }
  }

  // =========================================================================
  //  Bilan
  // =========================================================================
  const rows: SimRows = {
    Season: [season], Settings: settingsRows, Page: pages, Venue: venues, Rulebook: rulebooks, XPRule: xpRules,
    Club: clubs, Team: teams, Player: players, Competition: competitions, Group: groups,
    Match: matches, MatchEvent: events, Lineup: lineups,
    DisciplineCase: [caseRow], Suspension: [suspension], ProcesVerbal: pvs,
    MonthlyAward: monthly, Award: awards, CaptainTeam: captainTeams, CaptainMatch: captainMatches,
  }
  const played = matches.filter((m) => isPlayed(m) && !m.forfeit_team_id)
  const g = played.reduce((s, m) => s + m.home_score! + m.away_score!, 0)
  const report: SimReport = {
    seed,
    rows: Object.fromEntries(Object.entries(rows).map(([k, v]) => [k, v!.length])),
    matches: matches.length,
    reference: { season: refSeason?.name ?? '—', ...ref },
    simulated: { avgGoals: g / played.length, home: played.filter((m) => m.home_score! > m.away_score!).length / played.length, draw: played.filter((m) => m.home_score === m.away_score).length / played.length, away: played.filter((m) => m.home_score! < m.away_score!).length / played.length },
    cases,
  }
  return { rows, report }
}

/** Toutes les lignes de la simulation (pour l'envoi) avec leurs drapeaux d'isolation */
export function simRowsList(rows: SimRows) {
  return Object.entries(rows).flatMap(([entity, list]) => (list ?? []).map((data) => ({ entity, id: (data as { id: string }).id, data })))
}

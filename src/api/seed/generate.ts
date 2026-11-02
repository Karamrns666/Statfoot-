// Jeu de données de démonstration (fictif) au format MBL :
// 20 équipes · 240 joueurs · 5 chapeaux · phase de ligue suisse J1–J5 · Gold Cup / Silver Cup J6–J10.
// Pur : renvoie { Entité: lignes[] }.
import type {
  AdminUser, Award, Competition, Draw, EntityMap, EntityName, Lineup, LiveState, Match, MatchEvent, MatchTeamStats, Media,
  MonthlyAward, MotmVote, Page, Player, PlayerDoc, Position, Season, Settings, Suspension, Team, Venue, XPRule,
} from '@/types/entities'
import { seededRng, swissPotsFixtures, potsFromRanking, type Rng } from '@/lib/draw'
import { addDays } from '@/lib/schedule'
import { competitionStandings, computeAwards, computePlayerXP, teamRankBefore, XP_DEFAULTS, XP_KEYS, type LeagueData } from '@/lib/stats'
import { buildAction, newLiveState, type NewEvent } from '@/lib/matchEngine'
import { companyLogoSvg, photoPlaceholderSvg, teamLogoSvg } from '@/lib/logos'
import { RULES_MARKDOWN } from './rules'

type DB = { [N in EntityName]: EntityMap[N][] }

const TEAMS: [string, string, string, string, string][] = [
  ['Atlas Digital FC', 'ATD', 'Atlas Digital', '#F26B1D', '#1b1208'], ['Casa Finance', 'CAF', 'Casa Finance Group', '#facc15', '#1e293b'],
  ['Rabat Telecom', 'RBT', 'Rabat Télécom', '#3b82f6', '#0b1739'], ['Souss Énergie', 'SOU', 'Souss Énergie', '#22c55e', '#06210f'],
  ['Marrakech Tech', 'MKT', 'Marrakech Tech', '#ef4444', '#2b0b0b'], ['Tanger Logistique', 'TNG', 'Tanger Logistique', '#06b6d4', '#062a30'],
  ['Fès Assurances', 'FES', 'Fès Assurances', '#a855f7', '#1e0b3a'], ['Agadir Ports', 'AGP', 'Agadir Ports', '#0ea5e9', '#082235'],
  ['Oasis Pharma', 'OAS', 'Oasis Pharma', '#10b981', '#05261c'], ['Sahara Mining', 'SAH', 'Sahara Mining', '#eab308', '#2a2205'],
  ['Médina Conseil', 'MED', 'Médina Conseil', '#f472b6', '#2a0b1d'], ['Rif Industries', 'RIF', 'Rif Industries', '#94a3b8', '#1f2937'],
  ['Kénitra Auto', 'KEN', 'Kénitra Automotive', '#dc2626', '#1f0606'], ['Ifrane Hôtels', 'IFR', 'Ifrane Hôtels', '#38bdf8', '#0b1d2b'],
  ['Essaouira Média', 'ESS', 'Essaouira Média', '#fb923c', '#33140a'], ['Oujda Agro', 'OUJ', 'Oujda Agro', '#84cc16', '#16240a'],
  ['Dakhla Aéro', 'DAK', 'Dakhla Aéro', '#60a5fa', '#0a1a33'], ['Meknès BTP', 'MEK', 'Meknès BTP', '#f97316', '#2a1206'],
  ['Tétouan Textile', 'TET', 'Tétouan Textile', '#e879f9', '#2a0b2d'], ['Salé Software', 'SAL', 'Salé Software', '#2dd4bf', '#06261f'],
]
const FIRST = ['Yassine', 'Karim', 'Mehdi', 'Omar', 'Ilyas', 'Adam', 'Hamza', 'Rayan', 'Anas', 'Bilal', 'Ayoub', 'Younes', 'Nassim', 'Amine', 'Soufiane', 'Idriss', 'Zakaria', 'Driss', 'Othmane', 'Hicham', 'Nabil', 'Reda', 'Walid', 'Saad', 'Taha', 'Ismail', 'Achraf', 'Hakim', 'Marouane', 'Badr', 'Lucas', 'Hugo', 'Théo', 'Nathan', 'Louis', 'Jules', 'Samir', 'Fouad', 'Jalil', 'Khalid', 'Mounir', 'Tarik', 'Aziz', 'Ali', 'Ghali', 'Salim', 'Kamal', 'Rachid']
const LAST = ['Benali', 'El Idrissi', 'Haddad', 'Amrani', 'Tazi', 'Bennani', 'Chraibi', 'Alaoui', 'Berrada', 'Kettani', 'Sefrioui', 'Lahlou', 'Fassi', 'Ouazzani', 'Bakkali', 'Naciri', 'Zerouali', 'Mansouri', 'Squalli', 'Tahiri', 'Bouzid', 'Saidi', 'Raji', 'Belkadi', 'El Amrani', 'Benjelloun', 'Lazrak', 'Guessous', 'Skalli', 'Jettou', 'Kabbaj', 'Sqalli', 'Filali', 'Hajji', 'Ziani', 'Moussaoui', 'Rami', 'Benkirane', 'Alami', 'Boukhari', 'Martin', 'Durand', 'Moreau', 'Garnier', 'Lefèvre', 'Mercier', 'Dupont', 'Morel']
const REFS = ['M. Arbitre A', 'M. Arbitre B', 'Mme Arbitre C', 'M. Arbitre D', 'Mme Arbitre E', 'M. Arbitre F']
const SLOTS = ['18:00', '18:45', '19:30', '20:15', '21:00']

function poisson(rng: Rng, l: number) { const L = Math.exp(-l); let k = 0, p = 1; do { k++; p *= rng() } while (p > L); return k - 1 }
const pick = <T,>(rng: Rng, a: T[]) => a[Math.floor(rng() * a.length)]
function weighted<T>(rng: Rng, items: T[], w: (x: T) => number): T { const t = items.reduce((a, x) => a + w(x), 0); let r = rng() * t; for (const x of items) { r -= w(x); if (r <= 0) return x } return items[items.length - 1] }
function shuffle<T>(rng: Rng, a: T[]) { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [x[i], x[j]] = [x[j], x[i]] } return x }

let c = 0
const id = (p: string) => `${p}_${(++c).toString(36)}`

export function generateDemoData(now = new Date()): DB {
  c = 0
  const rng = seededRng(2026)
  const db = Object.fromEntries((['Season', 'Competition', 'Division', 'Group', 'Venue', 'Team', 'Player', 'Match', 'MatchEvent', 'Lineup', 'LiveState', 'MatchTeamStats', 'XPRule', 'Suspension', 'MonthlyAward', 'Award', 'Draw', 'Media', 'MotmVote', 'Settings', 'Page', 'AuditLog', 'AdminUser'] as EntityName[]).map((n) => [n, []])) as unknown as DB

  const settings: Settings = {
    id: 'settings', league_name: 'Morocco Business League', short_name: 'MBL', tagline: 'Le championnat de football des entreprises',
    organizer: 'Ardentia', contact_email: 'contact@mbl.ma', contact_phone: '+212 5 00 00 00 00', address: 'Complexe sportif — Casablanca',
    socials: { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/', linkedin: 'https://linkedin.com/', youtube: 'https://youtube.com/' },
    points_win: 3, points_draw: 1, points_loss: 0, tiebreakers: ['points', 'goal_diff', 'goals_for', 'head_to_head', 'fair_play'],
    starters_count: 6, motm_vote_minutes_after: 15, young_max_age: 23,
  }
  db.Settings.push(settings)
  db.Page.push({ id: 'page_rules', slug: 'reglement', title: 'Règlement de la ligue', content: RULES_MARKDOWN, published: true } as Page)
  const venue: Venue = { id: 'venue_main', name: 'Complexe sportif MBL', address: 'Casablanca', pitches: ['Terrain 1', 'Terrain 2'] }
  db.Venue.push(venue)
  db.Division.push({ id: 'div_gold', name: 'Gold', level: 1, color: '#facc15' }, { id: 'div_silver', name: 'Silver', level: 2, color: '#cbd5e1' })

  // ---- équipes & joueurs -------------------------------------------------------
  const strength = new Map<string, number>()
  const teams: Team[] = TEAMS.map(([name, short, company, c1, c2], i) => {
    const t: Team = { id: `team_${short.toLowerCase()}`, name, short_name: short, company, logo_url: teamLogoSvg(short, c1, c2, i), company_logo_url: companyLogoSvg(company, c1), primary_color: c1, secondary_color: c2, contact_name: `Responsable ${short}`, contact_email: `foot@${short.toLowerCase()}.ma`, status: 'active' }
    strength.set(t.id, 0.7 + rng() * 0.8)
    return t
  })
  db.Team.push(...teams)

  const today = new Date(now); today.setHours(12, 0, 0, 0)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  // J8 = aujourd'hui ; journées hebdomadaires
  const curJ1 = addDays(iso(today), -7 * 7)
  const pastJ1 = addDays(curJ1, -364)
  const past: Season = { id: 'season_past', name: `Saison ${pastJ1.slice(0, 4)}-${+pastJ1.slice(0, 4) + 1}`, start_date: addDays(pastJ1, -7), end_date: addDays(pastJ1, 63), status: 'closed', is_active: false, league_phase_rounds: 5, cup_rounds: 5, gold_size: 10, closed_at: addDays(pastJ1, 64) + 'T20:00:00' }
  const cur: Season = { id: 'season_current', name: `Saison ${curJ1.slice(0, 4)}-${+curJ1.slice(0, 4) + 1}`, start_date: addDays(curJ1, -7), end_date: addDays(curJ1, 63), status: 'active', is_active: true, league_phase_rounds: 5, cup_rounds: 5, gold_size: 10 }
  db.Season.push(past, cur)

  const plan: Position[] = ['GK', 'GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD']
  const used = new Set<string>()
  const name = () => { for (;;) { const n = `${pick(rng, FIRST)}|${pick(rng, LAST)}`; if (!used.has(n)) { used.add(n); return n.split('|') } } }
  const players: Player[] = []
  for (const t of teams) {
    const nums = shuffle(rng, Array.from({ length: 28 }, (_, i) => i + 2).filter((n) => n !== 16))
    plan.forEach((pos, i) => {
      const [first, last] = name()
      const young = rng() < 0.15
      const year = young ? 2004 + Math.floor(rng() * 3) : 1983 + Math.floor(rng() * 19)
      const rookie = i === 4 || i === 10
      const doc = (): PlayerDoc => { const r = rng(); return r < 0.9 ? { status: 'valid', validated_by: 'admin@mbl.ma' } : r < 0.95 ? { status: 'pending' } : r < 0.985 ? { status: 'missing' } : { status: 'refused', reason: 'Document illisible' } }
      players.push({
        id: id('pl'), first_name: first, last_name: last, position: pos, team_id: t.id, number: pos === 'GK' ? (i === 0 ? 1 : 16) : nums[i],
        birth_date: `${year}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rng() * 28)).padStart(2, '0')}`,
        status: 'active', is_captain: i === 6, season_ids: rookie ? [cur.id] : [past.id, cur.id],
        email: i === 6 ? `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + '@exemple.ma' : undefined,
        documents: { id_card: doc(), medical: doc(), license: doc() },
      })
    })
    t.captain_player_id = players.find((p) => p.team_id === t.id && p.is_captain)!.id
  }
  db.Player.push(...players)
  const squad = (teamId: string, seasonId: string) => players.filter((p) => p.team_id === teamId && p.season_ids?.includes(seasonId))

  const league = (): LeagueData => ({ seasons: db.Season, competitions: db.Competition, teams: db.Team, players: db.Player, matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, suspensions: db.Suspension, monthlyAwards: db.MonthlyAward, settings, divisions: db.Division, groups: db.Group })

  // ---- barème XP par saison ---------------------------------------------------
  for (const s of [past, cur]) for (const key of XP_KEYS) db.XPRule.push({ id: id('xp'), season_id: s.id, key, value: XP_DEFAULTS[key] } as XPRule)

  // ---- simulation --------------------------------------------------------------
  function lineupFor(m: Match, teamId: string): Lineup {
    const sq = squad(teamId, m.season_id)
    const gk = rng() < 0.85 ? sq.filter((p) => p.position === 'GK')[0] : sq.filter((p) => p.position === 'GK')[1]
    const pickPos = (pos: Position, n: number) => shuffle(rng, sq.filter((p) => p.position === pos)).slice(0, n)
    const starters = [gk, ...pickPos('DEF', 2), ...pickPos('MID', 2), ...pickPos('FWD', 1)]
    const subs = sq.filter((p) => !starters.includes(p))
    const cap = starters.find((p) => p.is_captain) ?? starters[3]
    return { id: id('lu'), match_id: m.id, team_id: teamId, present_ids: sq.map((p) => p.id), starter_ids: starters.map((p) => p.id), substitute_ids: subs.map((p) => p.id), goalkeeper_id: gk.id, captain_id: cap.id, validated: true, validated_by: 'Opérateur Démo', validated_at: m.date }
  }

  /** Simule un match ; `rich` = événements complets du Match Center (tirs, corners, fautes…) ; `upTo` = minute courante pour un match en direct */
  function simulate(m: Match, opts: { rich?: boolean; upTo?: number } = {}) {
    const half = 15, total = opts.upTo ?? 30
    const lus = [lineupFor(m, m.home_team_id), lineupFor(m, m.away_team_id)]
    db.Lineup.push(...lus)
    const evs: MatchEvent[] = []
    const ts = (min: number) => new Date(new Date(m.date!).getTime() + min * 60000).toISOString()
    const add = (e: Omit<NewEvent, 'match_id'>) => {
      const minute = e.minute ?? 1
      const period = minute <= half ? '1H' : '2H'
      const created = buildAction(m, evs, { ...e, match_id: m.id, period, client_ts: ts(minute), operator: 'Opérateur Démo' } as NewEvent, () => id('ev'))
      evs.push(...(created as MatchEvent[]))
      return created[0] as MatchEvent
    }
    const side = (lu: Lineup) => {
      const onPitch = lu.starter_ids!.map((x) => players.find((p) => p.id === x)!)
      const bench = lu.substitute_ids!.map((x) => players.find((p) => p.id === x)!).filter((p) => p.position !== 'GK')
      const entering = shuffle(rng, bench).slice(0, 2 + Math.floor(rng() * 2))
      return { teamId: lu.team_id, gk: players.find((p) => p.id === lu.goalkeeper_id)!, onPitch, entering }
    }
    const H = side(lus[0]), A = side(lus[1])
    // remplacements
    for (const s of [H, A]) s.entering.forEach((p, i) => {
      const minute = 12 + i * 6 + Math.floor(rng() * 4)
      if (minute > total) return
      const out = s.onPitch.filter((x) => x.position !== 'GK')[1 + (i % 4)]
      add({ team_id: s.teamId, type: 'substitution', player_id: p.id, related_player_id: out?.id, minute })
    })
    const field = (s: typeof H) => [...s.onPitch, ...s.entering].filter((p) => p.position !== 'GK')
    const sH = strength.get(m.home_team_id)!, sA = strength.get(m.away_team_id)!
    const lam = (a: number, b: number) => Math.max(0.4, 2.0 * a / Math.sqrt(b)) * (total / 30)
    for (const [s, o, st, so] of [[H, A, sH, sA], [A, H, sA, sH]] as const) {
      const n = Math.min(7, poisson(rng, lam(st, so)))
      for (let g = 0; g < n; g++) {
        const minute = 1 + Math.floor(rng() * total)
        const r = rng()
        if (r < 0.05) { add({ team_id: o.teamId, type: 'own_goal', player_id: weighted(rng, field(o), (p) => (p.position === 'DEF' ? 4 : 1)).id, minute }); continue }
        const scorer = weighted(rng, field(s), (p) => (p.position === 'FWD' ? 5 : p.position === 'MID' ? 3 : 1.2))
        const kind = r < 0.12 ? 'penalty' : r < 0.2 ? 'header' : r < 0.24 ? 'direct_free_kick' : 'normal'
        const assist = kind !== 'penalty' && kind !== 'direct_free_kick' && rng() < 0.7 ? weighted(rng, field(s).filter((p) => p !== scorer), (p) => (p.position === 'MID' ? 4 : p.position === 'FWD' ? 3 : 1.5)) : undefined
        add({ team_id: s.teamId, type: 'goal', goal_kind: kind as never, player_id: scorer.id, related_player_id: assist?.id, minute })
      }
      const saves = poisson(rng, 3.4 * (total / 30))
      for (let i = 0; i < saves; i++) add({ team_id: s.teamId, type: 'save', player_id: s.gk.id, minute: 1 + Math.floor(rng() * total) })
      if (rng() < 0.06) add({ team_id: s.teamId, type: 'penalty_saved', player_id: s.gk.id, minute: 1 + Math.floor(rng() * total) })
      const yc = poisson(rng, 0.8 * (total / 30))
      for (let i = 0; i < yc; i++) {
        const p = rng() < 0.15 && evs.some((e) => e.type === 'yellow_card' && e.team_id === s.teamId) ? evs.find((e) => e.type === 'yellow_card' && e.team_id === s.teamId)!.player_id! : pick(rng, field(s)).id
        add({ team_id: s.teamId, type: 'yellow_card', player_id: p, minute: 1 + Math.floor(rng() * total) })
      }
      if (rng() < 0.03) add({ team_id: s.teamId, type: 'red_card', player_id: pick(rng, field(s)).id, minute: 10 + Math.floor(rng() * Math.max(1, total - 10)) })
      if (opts.rich) {
        const k = total / 30
        const n2 = (l: number) => poisson(rng, l * k)
        for (let i = 0; i < n2(3); i++) add({ team_id: s.teamId, type: 'shot_on_target', player_id: pick(rng, field(s)).id, minute: 1 + Math.floor(rng() * total) })
        for (let i = 0; i < n2(5); i++) add({ team_id: s.teamId, type: 'shot_off_target', player_id: pick(rng, field(s)).id, minute: 1 + Math.floor(rng() * total) })
        for (const [t, l] of [['corner', 4], ['throw_in', 9], ['free_kick', 4], ['foul', 5], ['offside', 1.5]] as const) for (let i = 0; i < n2(l); i++) add({ team_id: s.teamId, type: t, minute: 1 + Math.floor(rng() * total) })
      }
    }
    // tri chronologique des horodatages
    evs.sort((a, b) => (a.client_ts ?? '').localeCompare(b.client_ts ?? ''))
    db.MatchEvent.push(...evs)
    const sc = (team: string, upto = 99) => evs.filter((e) => (e.minute ?? 0) <= upto && ((e.type === 'goal' && e.team_id === team) || (e.type === 'own_goal' && e.team_id !== team))).length
    m.home_score = sc(m.home_team_id); m.away_score = sc(m.away_team_id)
    m.home_ht_score = sc(m.home_team_id, half); m.away_ht_score = sc(m.away_team_id, half)
    return evs
  }

  function close(m: Match, evs: MatchEvent[], rich: boolean) {
    m.status = 'finished'; m.validated = true; m.validated_at = new Date(new Date(m.date!).getTime() + 45 * 60000).toISOString(); m.validated_by = 'Opérateur Démo'
    m.source = rich ? 'match_center' : 'quick_entry'
    m.opponent_rank_snapshot = { home_rank: teamRankBefore(league(), m, m.home_team_id), away_rank: teamRankBefore(league(), m, m.away_team_id) }
    // homme du match : meilleur XP du match
    const x = computePlayerXP({ ...league(), matches: [m], events: evs, suspensions: [], monthlyAwards: [] }, { seasonId: m.season_id })
    m.motm_player_id = [...x.values()].filter((p) => p.matches > 0).sort((a, b) => b.xp - a.xp)[0]?.player_id
    // stats collectives (feuille de match)
    const pos = 38 + Math.floor(rng() * 25)
    for (const [team, poss] of [[m.home_team_id, pos], [m.away_team_id, 100 - pos]] as const) {
      const mine = evs.filter((e) => e.team_id === team)
      const cnt = (...t: MatchEvent['type'][]) => mine.filter((e) => t.includes(e.type)).length
      const on = rich ? cnt('shot_on_target') : cnt('shot_on_target') + Math.floor(rng() * 3)
      db.MatchTeamStats.push({ id: id('mts'), match_id: m.id, team_id: team, period: 'full', possession: poss, shots: on + (rich ? cnt('shot_off_target', 'penalty_missed') : 2 + Math.floor(rng() * 6)), shots_on_target: on, corners: rich ? cnt('corner') : Math.floor(rng() * 7), fouls: rich ? cnt('foul') : 2 + Math.floor(rng() * 6), offsides: rich ? cnt('offside') : Math.floor(rng() * 3), yellow_cards: cnt('yellow_card', 'second_yellow'), red_cards: cnt('red_card', 'second_yellow'), saves: cnt('save', 'penalty_saved'), source: rich ? 'match_center' : 'manual' } as MatchTeamStats)
    }
    m.sheet = { status: rich ? 'filled' : 'draft', filled_at: rich ? m.validated_at : undefined, filled_by: rich ? 'Opérateur Démo' : undefined, actions_count: evs.filter((e) => !e.auto).length }
    // suspensions automatiques (rouge / 2e jaune) : 1 match
    for (const e of evs.filter((x) => x.type === 'red_card' || x.type === 'second_yellow')) {
      db.Suspension.push({ id: id('susp'), season_id: m.season_id, player_id: e.player_id!, origin_match_id: m.id, origin_event_id: e.id, date: m.date!.slice(0, 10), matches: 1, created_by: 'admin@mbl.ma' } as Suspension)
    }
    if (rich) db.LiveState.push({ ...newLiveState(m.id), id: id('ls'), period: 'FT', running: false, period_elapsed_ms: 15 * 60000, possession: { current: 'dead', since: null, by_period: { '1H': { home_ms: pos * 8400, away_ms: (100 - pos) * 8400, dead_ms: 60000 }, '2H': { home_ms: pos * 8100, away_ms: (100 - pos) * 8100, dead_ms: 70000 } } } } as LiveState)
  }

  // ---- saisons ----------------------------------------------------------------
  function buildSeason(season: Season, j1: string, opts: { playUntil: number; liveRound?: number }) {
    // chapeaux : 4 équipes chacun, par "force" décroissante (têtes de série)
    const ranked = [...teams].sort((a, b) => strength.get(b.id)! - strength.get(a.id)! + (rng() - 0.5) * 0.3)
    const potList = potsFromRanking(ranked.map((t) => t.id), 4)
    const lp: Competition = { id: id('comp'), season_id: season.id, name: 'Phase de ligue', phase: 'league_phase', format: 'swiss', status: 'active', team_ids: teams.map((t) => t.id), rounds: [1, 2, 3, 4, 5], half_duration_min: 15, foul_alert_threshold: 5, color: '#F26B1D', order: 1, description: 'Système suisse par chapeaux : 5 journées, 50 matchs.' }
    db.Competition.push(lp)
    const seed = Math.floor(rng() * 1e6)
    const fixtures = swissPotsFixtures(potList, seededRng(seed))
    db.Draw.push({ id: id('draw'), season_id: season.id, competition_id: lp.id, type: 'swiss_pots', pots: potList.map((t, i) => ({ pot: i + 1, team_ids: t })), fixtures: fixtures.map((f) => ({ ...f, revealed: true })), revealed_count: 50, status: 'published', performed_by: 'superadmin@mbl.ma', seed, created_date: addDays(j1, -10) + 'T19:00:00' } as Draw)
    const mkMatch = (comp: Competition, f: { round: number; home_team_id: string; away_team_id: string }, i: number, pitch: string): Match => ({
      id: id('match'), season_id: season.id, competition_id: comp.id, round: f.round, stage: comp.phase === 'league_phase' ? 'league_phase' : 'cup',
      date: `${addDays(j1, (f.round - 1) * 7)}T${SLOTS[Math.floor(i / 2) % SLOTS.length]}:00`, venue_id: venue.id, pitch,
      home_team_id: f.home_team_id, away_team_id: f.away_team_id, status: 'scheduled', published: true, referee: pick(rng, REFS), half_duration_min: 15,
    })
    for (let r = 1; r <= 5; r++) fixtures.filter((f) => f.round === r).forEach((f, i) => db.Match.push(mkMatch(lp, f, i, i % 2 === 0 ? 'Terrain 1' : 'Terrain 2')))
    const play = (round: number) => {
      const ms = db.Match.filter((m) => m.season_id === season.id && m.round === round)
      for (const m of ms) {
        if (round > opts.playUntil) continue
        const rich = round >= opts.playUntil - 1
        const evs = simulate(m, { rich })
        close(m, evs, rich)
      }
    }
    for (let r = 1; r <= 5; r++) play(r)
    if (opts.playUntil < 5) return { lp }
    lp.status = 'finished'
    const table = competitionStandings(league(), lp.id)
    const goldIds = table.slice(0, 10).map((r) => r.team_id), silverIds = table.slice(10).map((r) => r.team_id)
    const gold: Competition = { id: id('comp'), season_id: season.id, name: 'Gold Cup', phase: 'gold', format: 'swiss', status: 'active', team_ids: goldIds, rounds: [6, 7, 8, 9, 10], default_pitch: 'Terrain 1', half_duration_min: 15, foul_alert_threshold: 5, color: '#facc15', order: 2, description: 'Top 10 de la phase de ligue · Terrain 1' }
    const silver: Competition = { id: id('comp'), season_id: season.id, name: 'Silver Cup', phase: 'silver', format: 'swiss', status: 'active', team_ids: silverIds, rounds: [6, 7, 8, 9, 10], default_pitch: 'Terrain 2', half_duration_min: 15, foul_alert_threshold: 5, color: '#cbd5e1', order: 3, description: 'Équipes classées 11 à 20 · Terrain 2' }
    db.Competition.push(gold, silver)
    for (const t of goldIds) teams.find((x) => x.id === t)!.division_id = 'div_gold'
    for (const t of silverIds) teams.find((x) => x.id === t)!.division_id = 'div_silver'
    for (const comp of [gold, silver]) {
      const s2 = Math.floor(rng() * 1e6)
      const fx = swissPotsFixtures(potsFromRanking(comp.team_ids!, 2), seededRng(s2)).map((f) => ({ ...f, round: f.round + 5 }))
      db.Draw.push({ id: id('draw'), season_id: season.id, competition_id: comp.id, type: 'swiss_pots', pots: potsFromRanking(comp.team_ids!, 2).map((t, i) => ({ pot: i + 1, team_ids: t })), fixtures: fx.map((f) => ({ ...f, revealed: true })), revealed_count: fx.length, status: 'published', performed_by: 'superadmin@mbl.ma', seed: s2, created_date: addDays(j1, 30) + 'T19:00:00' } as Draw)
      fx.forEach((f) => {
        const idx = fx.filter((x) => x.round === f.round).indexOf(f)
        const m = mkMatch(comp, f, idx * 2, comp.default_pitch!)
        m.date = `${addDays(j1, (f.round - 1) * 7)}T${SLOTS[idx % SLOTS.length]}:00`
        db.Match.push(m)
      })
    }
    for (let r = 6; r <= 10; r++) play(r)
    if (opts.playUntil >= 10) { gold.status = 'finished'; silver.status = 'finished' }
    return { lp, gold, silver }
  }

  // Saison passée : complète + palmarès publié
  buildSeason(past, pastJ1, { playUntil: 10 })
  for (const scope of ['season', 'league_phase', 'gold', 'silver'] as const) {
    const res = computeAwards(league(), { seasonId: past.id, phase: scope === 'season' ? 'all' : scope })
    for (const a of res) {
      if (scope !== 'season' && !['ballon_or', 'golden_glove', 'top_scorer', 'top_assist', 'best_team'].includes(a.category)) continue
      db.Award.push({ id: id('aw'), season_id: past.id, scope, category: a.category, player_id: a.player_id, team_id: a.team_id, value: a.value, snapshot: a.snapshot, not_awarded: a.not_awarded, status: 'published', locked: true } as Award)
    }
  }

  // Saison en cours : J1–J7 jouées, J8 aujourd'hui (1 match en direct)
  const { gold } = buildSeason(cur, curJ1, { playUntil: 7 })
  const j8 = db.Match.filter((m) => m.season_id === cur.id && m.round === 8).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const nowMs = now.getTime()
  j8.forEach((m, i) => { const d = new Date(nowMs + (i - 1) * 45 * 60000); d.setSeconds(0, 0); m.date = d.toISOString() })
  const live = j8.find((m) => m.competition_id === gold!.id)!
  live.date = new Date(nowMs - 22 * 60000).toISOString()
  simulate(live, { rich: true, upTo: 19 })
  live.status = 'live'; live.source = 'match_center'; live.operator_user_id = 'user_operator'
  db.LiveState.push({
    ...newLiveState(live.id), id: id('ls'), period: '2H', running: true, period_started_at: nowMs - 4 * 60000, period_elapsed_ms: 0,
    possession: { current: 'home', since: nowMs - 20000, by_period: { '1H': { home_ms: 470000, away_ms: 380000, dead_ms: 50000 }, '2H': { home_ms: 110000, away_ms: 90000, dead_ms: 20000 } } },
    lock_user_id: 'user_operator', lock_user_name: 'Opérateur Démo', lock_heartbeat_at: nowMs, version: 1,
  } as LiveState)
  // reporter un match de J7 Silver (démo du statut « reporté »)
  const postponed = db.Match.find((m) => m.season_id === cur.id && m.round === 7 && m.pitch === 'Terrain 2')!
  for (const name of ['MatchEvent', 'Lineup', 'MatchTeamStats', 'LiveState', 'Suspension'] as const) (db as Record<string, { match_id?: string; origin_match_id?: string }[]>)[name] = (db[name] as { match_id?: string; origin_match_id?: string }[]).filter((x) => x.match_id !== postponed.id && x.origin_match_id !== postponed.id)
  Object.assign(postponed, { status: 'postponed', home_score: null, away_score: null, home_ht_score: null, away_ht_score: null, validated: false, motm_player_id: undefined, opponent_rank_snapshot: undefined, sheet: undefined })

  // vote du public sur un match de J7
  const vm = db.Match.find((m) => m.season_id === cur.id && m.round === 7 && m.status === 'finished')!
  vm.motm_vote_closes_at = new Date(nowMs + 3 * 86400000).toISOString()
  const voters = db.Lineup.filter((l) => l.match_id === vm.id).flatMap((l) => l.starter_ids ?? [])
  for (let i = 0; i < 41; i++) db.MotmVote.push({ id: id('vote'), match_id: vm.id, player_id: i % 3 === 0 ? vm.motm_player_id! : pick(rng, voters), voter_key: `demo-${i}` } as MotmVote)

  // récompenses mensuelles (mois écoulés de la saison en cours)
  const months = [...new Set(db.Match.filter((m) => m.season_id === cur.id && m.status === 'finished').map((m) => m.date!.slice(0, 7)))].filter((mo) => mo < iso(today).slice(0, 7))
  for (const mo of months) {
    const L = league()
    const inMonth = L.matches.filter((m) => m.season_id === cur.id && m.date?.startsWith(mo))
    const x = [...computePlayerXP({ ...L, matches: inMonth, suspensions: [], monthlyAwards: [] }, { seasonId: cur.id }).values()].sort((a, b) => b.xp - a.xp)
    const goals = L.events.filter((e) => e.type === 'goal' && inMonth.some((m) => m.id === e.match_id))
    db.MonthlyAward.push(
      { id: id('mo'), season_id: cur.id, month: mo, type: 'player', player_id: x[0].player_id, designated_by: 'superadmin@mbl.ma' } as MonthlyAward,
      { id: id('mo'), season_id: cur.id, month: mo, type: 'team', team_id: x[0].team_id, designated_by: 'superadmin@mbl.ma' } as MonthlyAward,
      { id: id('mo'), season_id: cur.id, month: mo, type: 'goal', event_id: pick(rng, goals).id, designated_by: 'superadmin@mbl.ma' } as MonthlyAward,
    )
  }

  // médias
  db.Match.filter((m) => m.season_id === cur.id && m.status === 'finished').sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 16).forEach((m, i) => {
    const h = teams.find((t) => t.id === m.home_team_id)!, a = teams.find((t) => t.id === m.away_team_id)!
    db.Media.push({ id: id('media'), title: `${h.name} – ${a.name}`, type: 'photo', url: photoPlaceholderSvg(`${h.short_name} ${m.home_score}-${m.away_score} ${a.short_name}`, (i * 47) % 360, i), match_id: m.id, season_id: cur.id, team_ids: [h.id, a.id], round: m.round, date: m.date!.slice(0, 10), source: 'upload', published: true } as Media)
  })
  db.Media.push(
    { id: id('media'), title: 'Résumé vidéo de la J7', type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', thumbnail_url: photoPlaceholderSvg('Résumé J7', 25, 3), season_id: cur.id, round: 7, source: 'url', published: true } as Media,
    { id: id('media'), title: 'Galerie J8 (brouillon)', type: 'photo', url: photoPlaceholderSvg('Galerie J8', 140, 2), season_id: cur.id, round: 8, source: 'google_drive', published: false } as Media,
  )

  // administrateurs
  const ts = new Date(nowMs - 30 * 86400000).toISOString()
  db.AdminUser.push(
    { id: 'user_super', email: 'superadmin@mbl.ma', full_name: 'Super Admin', role: 'super_admin', status: 'active', activated_at: ts, password: 'mbl2026' } as AdminUser,
    { id: 'user_admin', email: 'admin@mbl.ma', full_name: 'Admin Ligue', role: 'admin', status: 'active', activated_at: ts, password: 'mbl2026' } as AdminUser,
    { id: 'user_operator', email: 'operateur@mbl.ma', full_name: 'Opérateur Démo', role: 'operator', status: 'active', activated_at: ts, password: 'mbl2026' } as AdminUser,
    { id: id('adm'), email: 'nouvel.operateur@exemple.ma', role: 'operator', status: 'invited', invited_by: 'superadmin@mbl.ma', created_date: ts } as AdminUser,
  )

  const stamp = new Date(nowMs - 60 * 86400000).toISOString()
  for (const rows of Object.values(db) as { created_date?: string; updated_date?: string }[][]) for (const r of rows) { r.created_date ??= stamp; r.updated_date ??= stamp }
  return db
}

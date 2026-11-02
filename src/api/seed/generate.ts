// Génère un jeu de données de démonstration 100 % fictif.
// Pur (pas d'accès au store) : renvoie un objet { Entité: lignes[] } — testable et réutilisable.
import type {
  Award, Competition, Division, EntityMap, EntityName, Invitation, Lineup, Match, MatchEvent, MatchTeamStats,
  Media, MotmVote, Page, Player, PlayerDocument, Position, Season, Settings, Team, User, Venue, XPRule,
} from '@/types/entities'
import { seededRng, type Rng } from '@/lib/draw'
import { roundRobin, addDays } from '@/lib/schedule'
import { computeAwards, competitionStandings, computePromotions, DEFAULT_XP_RULES, playerMatchLines, type LeagueData } from '@/lib/stats'
import { companyLogoSvg, photoPlaceholderSvg, teamLogoSvg } from '@/lib/logos'
import { RULES_MARKDOWN } from './rules'

type DB = { [N in EntityName]: EntityMap[N][] }

const TEAMS = [
  { name: 'Nébula FC', short: 'NEB', company: 'Nébula Tech', c1: '#22d3ee', c2: '#0e2a47' },
  { name: 'Atlas United', short: 'ATL', company: 'Atlas Assurances', c1: '#facc15', c2: '#1e293b' },
  { name: 'Cobalt Athletic', short: 'COB', company: 'Cobalt Énergie', c1: '#3b82f6', c2: '#0b1739' },
  { name: 'Horizon SC', short: 'HOR', company: 'Banque Horizon', c1: '#f97316', c2: '#2a1408' },
  { name: 'Orion Sport', short: 'ORI', company: 'Orion Télécom', c1: '#a855f7', c2: '#1e0b3a' },
  { name: 'Vertex FC', short: 'VTX', company: 'Vertex Conseil', c1: '#10b981', c2: '#05261c' },
  { name: 'Saphir AC', short: 'SAP', company: 'Saphir Logistique', c1: '#60a5fa', c2: '#0a1a33' },
  { name: 'Titan FC', short: 'TIT', company: 'Titan BTP', c1: '#ef4444', c2: '#2b0b0b' },
  { name: 'Lynx Club', short: 'LYN', company: 'Lynx Digital', c1: '#f472b6', c2: '#2a0b1d' },
  { name: 'Phénix FC', short: 'PHX', company: 'Phénix Santé', c1: '#fb923c', c2: '#33140a' },
  { name: 'Quartz United', short: 'QTZ', company: 'Quartz Immobilier', c1: '#e2e8f0', c2: '#1f2937' },
  { name: 'Zénith SC', short: 'ZEN', company: 'Zénith Aéro', c1: '#84cc16', c2: '#16240a' },
]

const FIRST = ['Yanis', 'Karim', 'Lucas', 'Mehdi', 'Hugo', 'Omar', 'Théo', 'Ilyes', 'Adam', 'Nathan', 'Sami', 'Rayan', 'Louis', 'Anas', 'Jules', 'Bilal', 'Enzo', 'Hamza', 'Noah', 'Ismaël', 'Tom', 'Walid', 'Maxime', 'Reda', 'Arthur', 'Younes', 'Gabriel', 'Nassim', 'Paul', 'Amine', 'Léo', 'Soufiane', 'Romain', 'Idriss', 'Victor', 'Malik', 'Antoine', 'Zakaria', 'Kevin', 'Ayoub', 'Samuel', 'Driss', 'Mathis', 'Othmane', 'Baptiste', 'Hicham', 'Quentin', 'Nabil']
const LAST = ['Benali', 'Martin', 'El Idrissi', 'Durand', 'Haddad', 'Lefèvre', 'Amrani', 'Moreau', 'Tazi', 'Garnier', 'Bennani', 'Roux', 'Chraibi', 'Fournier', 'Alaoui', 'Girard', 'Berrada', 'Lambert', 'Kettani', 'Bonnet', 'Sefrioui', 'Dupont', 'Lahlou', 'Mercier', 'Fassi', 'Blanc', 'Ouazzani', 'Guerin', 'Bakkali', 'Faure', 'Naciri', 'Rousseau', 'Zerouali', 'Chevalier', 'Mansouri', 'Perrin', 'Squalli', 'Robin', 'Tahiri', 'Clément', 'Bouzid', 'Morel', 'Saidi', 'Gauthier', 'Raji', 'Henry', 'Belkadi', 'Masson']

const REFS = ['M. Arbitre Alpha', 'M. Arbitre Bravo', 'Mme Arbitre Charlie', 'M. Arbitre Delta', 'Mme Arbitre Echo']

function poisson(rng: Rng, lambda: number) {
  const L = Math.exp(-lambda); let k = 0, p = 1
  do { k++; p *= rng() } while (p > L)
  return k - 1
}
function pick<T>(rng: Rng, arr: T[]): T { return arr[Math.floor(rng() * arr.length)] }
function weighted<T>(rng: Rng, items: T[], w: (x: T) => number): T {
  const total = items.reduce((a, x) => a + w(x), 0)
  let r = rng() * total
  for (const x of items) { r -= w(x); if (r <= 0) return x }
  return items[items.length - 1]
}
function shuffle<T>(rng: Rng, arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
  return a
}

let counter = 0
const id = (p: string) => `${p}_${(++counter).toString(36)}`

export function generateDemoData(now = new Date()): DB {
  counter = 0
  const rng = seededRng(2026)
  const db = {} as DB
  for (const n of ['Season', 'Competition', 'Division', 'Group', 'Draw', 'Team', 'Player', 'PlayerDocument', 'Venue', 'Match', 'MatchEvent', 'MatchTeamStats', 'Lineup', 'Media', 'Award', 'TeamOfRound', 'MotmVote', 'XPRule', 'Settings', 'Page', 'ActivityLog', 'Invitation', 'User'] as EntityName[]) (db as Record<string, unknown[]>)[n] = []

  // --- Paramètres ------------------------------------------------------------
  const settings: Settings = {
    id: 'settings', league_name: 'StatFoot League', short_name: 'SFL', tagline: 'La ligue de football inter-entreprises',
    organizer: 'Association Sport & Entreprise (fictive)', contact_email: 'contact@statfoot.app', contact_phone: '+33 1 00 00 00 00',
    address: 'Complexe Sportif des Lumières, 1 allée des Projecteurs',
    socials: { instagram: 'https://instagram.com/', facebook: 'https://facebook.com/', linkedin: 'https://linkedin.com/', youtube: 'https://youtube.com/' },
    points_win: 3, points_draw: 1, points_loss: 0, tiebreakers: ['points', 'goal_diff', 'goals_for', 'head_to_head', 'fair_play'],
    starters_count: 6, match_duration_minutes: 40, awards_min_matches: 3, young_max_age: 23, motm_vote_enabled: true, motm_vote_weight: 0,
  }
  db.Settings.push(settings)
  db.XPRule.push(...DEFAULT_XP_RULES.map((r) => ({ ...r, id: id('xp') }) as XPRule))
  db.Page.push({ id: 'page_rules', slug: 'reglement', title: 'Règlement de la ligue', content: RULES_MARKDOWN, published: true } as Page)

  const venues: Venue[] = [
    { id: 'venue_lum', name: 'Complexe Sportif des Lumières', address: '1 allée des Projecteurs', pitches: ['Terrain 1', 'Terrain 2', 'Terrain 3'] },
    { id: 'venue_arena', name: 'Arena Five Nord', address: '12 rue du Coup-Franc', pitches: ['Terrain A', 'Terrain B'] },
  ]
  db.Venue.push(...venues)
  const slots = [
    { venue_id: 'venue_lum', pitch: 'Terrain 1' }, { venue_id: 'venue_lum', pitch: 'Terrain 2' }, { venue_id: 'venue_lum', pitch: 'Terrain 3' },
  ]

  // --- Divisions ---------------------------------------------------------------
  const divA: Division = { id: 'div_a', name: 'Série A', level: 1, promotion_count: 0, relegation_count: 1, playoff_format: 'top4_semis', color: '#facc15' }
  const divB: Division = { id: 'div_b', name: 'Série B', level: 2, promotion_count: 1, relegation_count: 0, playoff_format: 'none', color: '#cbd5e1' }
  db.Division.push(divA, divB)

  // --- Équipes -----------------------------------------------------------------
  const strength = new Map<string, number>()
  const teams: Team[] = TEAMS.map((t, i) => {
    const team: Team = {
      id: `team_${t.short.toLowerCase()}`, name: t.name, short_name: t.short, company: t.company,
      logo_url: teamLogoSvg(t.short, t.c1, t.c2, i), company_logo_url: companyLogoSvg(t.company, t.c1),
      primary_color: t.c1, secondary_color: t.c2, division_id: i < 6 ? divA.id : divB.id,
      contact_name: `Responsable ${t.short}`, contact_email: `sport@${t.short.toLowerCase()}.exemple`, contact_phone: '+33 6 00 00 00 ' + String(10 + i),
      status: 'active',
    }
    strength.set(team.id, (i < 6 ? 1.15 : 0.9) + rng() * 0.45)
    return team
  })
  db.Team.push(...teams)

  // --- Saisons -----------------------------------------------------------------
  // Les journées de la saison en cours ont lieu le samedi : J8 = samedi dernier.
  const today = new Date(now); today.setHours(12, 0, 0, 0)
  const lastSat = new Date(today); lastSat.setDate(today.getDate() - ((today.getDay() + 1) % 7))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const curR1 = addDays(iso(lastSat), -7 * 7)
  const pastR1 = addDays(curR1, -364)
  const pastSeason: Season = { id: 'season_past', name: `Saison ${pastR1.slice(0, 4)}-${Number(pastR1.slice(0, 4)) + 1}`, start_date: addDays(pastR1, -7), end_date: addDays(pastR1, 7 * 13), is_active: false, status: 'closed', closed_at: addDays(pastR1, 7 * 13) + 'T20:00:00' }
  const curSeason: Season = { id: 'season_current', name: `Saison ${curR1.slice(0, 4)}-${Number(curR1.slice(0, 4)) + 1}`, start_date: addDays(curR1, -7), end_date: addDays(curR1, 7 * 13), is_active: true, status: 'active' }
  db.Season.push(pastSeason, curSeason)

  // --- Joueurs -----------------------------------------------------------------
  const squadPlan: Position[] = ['GK', 'GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD']
  const usedNames = new Set<string>()
  const newName = () => {
    for (;;) {
      const n = `${pick(rng, FIRST)}|${pick(rng, LAST)}`
      if (!usedNames.has(n)) { usedNames.add(n); return n.split('|') }
    }
  }
  const players: Player[] = []
  for (const t of teams) {
    const nums = shuffle(rng, Array.from({ length: 28 }, (_, i) => i + 2).filter((n) => n !== 16))
    squadPlan.forEach((pos, i) => {
      const [first, last] = newName()
      const young = rng() < 0.18
      const year = young ? 2004 + Math.floor(rng() * 3) : 1984 + Math.floor(rng() * 18)
      // ~2 recrues par équipe (1re saison) et 1 joueur parti après la saison passée
      const rookie = i === 4 || i === 9
      const left = i === 7
      players.push({
        id: id('pl'), first_name: first, last_name: last, position: pos, team_id: t.id,
        number: pos === 'GK' ? (i === 0 ? 1 : 16) : nums[i],
        birth_date: `${year}-${String(1 + Math.floor(rng() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rng() * 28)).padStart(2, '0')}`,
        status: left ? 'inactive' : rng() < 0.04 ? 'injured' : 'active',
        is_captain: i === 5, season_ids: rookie ? [curSeason.id] : left ? [pastSeason.id] : [pastSeason.id, curSeason.id],
        email: i === 5 ? `${first}.${last}`.toLowerCase().normalize('NFD').replace(/[^a-z.]/g, '') + '@exemple.com' : undefined,
      })
    })
    t.captain_player_id = players.find((p) => p.team_id === t.id && p.is_captain)?.id
  }
  db.Player.push(...players)

  // documents (saison en cours)
  const REFUSALS = ['Photo illisible', 'Document expiré', "Nom différent de l'inscription"]
  for (const p of players.filter((x) => x.season_ids?.includes(curSeason.id))) {
    for (const type of ['id_card', 'medical_certificate', 'company_license'] as const) {
      const r = rng()
      const status = r < 0.82 ? 'valid' : r < 0.9 ? 'pending' : r < 0.97 ? 'missing' : 'refused'
      db.PlayerDocument.push({
        id: id('doc'), player_id: p.id, type, status,
        file_url: status === 'missing' ? undefined : photoPlaceholderSvg(type === 'id_card' ? "Pièce d'identité" : type === 'medical_certificate' ? 'Certificat médical' : 'Licence entreprise', 220),
        refusal_reason: status === 'refused' ? pick(rng, REFUSALS) : undefined,
        validated_by: status === 'valid' ? 'admin@statfoot.app' : undefined,
      } as PlayerDocument)
    }
  }

  // --- Simulation d'un match ----------------------------------------------------
  const squad = (teamId: string, seasonId: string) => players.filter((p) => p.team_id === teamId && p.season_ids?.includes(seasonId) && p.status !== 'injured')

  function simulate(m: Match, opts: { partialMinute?: number } = {}) {
    const evs: MatchEvent[] = []
    const lus: Lineup[] = []
    const side = (teamId: string) => {
      const sq = squad(teamId, m.season_id)
      const gks = sq.filter((p) => p.position === 'GK')
      const gk = rng() < 0.85 ? gks[0] : gks[1] ?? gks[0]
      const out = (pos: Position, n: number) => shuffle(rng, sq.filter((p) => p.position === pos)).slice(0, n)
      const starters = [gk, ...out('DEF', 2), ...out('MID', 2), ...out('FWD', 1)].filter(Boolean)
      const bench = sq.filter((p) => !starters.includes(p) && p.position !== 'GK')
      const entered = shuffle(rng, bench).slice(0, 2 + Math.floor(rng() * 2))
      const lu: Lineup = {
        id: id('lu'), match_id: m.id, team_id: teamId, formation: '2-2-1',
        starter_ids: starters.map((p) => p.id), substitute_ids: bench.map((p) => p.id), subs_entered_ids: entered.map((p) => p.id),
        goalkeeper_id: gk.id, captain_id: (starters.find((p) => p.is_captain) ?? starters[1]).id,
      }
      lus.push(lu)
      return { teamId, starters, entered, onPitch: [...starters, ...entered], gk }
    }
    const H = side(m.home_team_id), A = side(m.away_team_id)
    const maxMin = opts.partialMinute ?? 40
    const sH = strength.get(m.home_team_id)!, sA = strength.get(m.away_team_id)!
    const lam = (a: number, b: number, home: boolean) => Math.max(0.3, 1.55 * a / Math.sqrt(b) + (home ? 0.15 : 0)) * (maxMin / 40)
    const goalsFor = (s: typeof H, opp: typeof A, n: number) => {
      for (let g = 0; g < n; g++) {
        const minute = 1 + Math.floor(rng() * maxMin)
        const period = minute <= 20 ? '1H' : '2H'
        const r = rng()
        if (r < 0.04) {
          const og = weighted(rng, opp.onPitch.filter((p) => p.position !== 'GK'), (p) => (p.position === 'DEF' ? 4 : 1))
          evs.push({ id: id('ev'), match_id: m.id, team_id: opp.teamId, type: 'own_goal', player_id: og.id, minute, period })
          continue
        }
        const field = s.onPitch.filter((p) => p.position !== 'GK')
        const scorer = weighted(rng, field, (p) => (p.position === 'FWD' ? 5 : p.position === 'MID' ? 3 : 1.2))
        if (r < 0.11) { evs.push({ id: id('ev'), match_id: m.id, team_id: s.teamId, type: 'penalty_goal', player_id: scorer.id, minute, period }); continue }
        const assister = rng() < 0.68 ? weighted(rng, field.filter((p) => p !== scorer), (p) => (p.position === 'MID' ? 4 : p.position === 'FWD' ? 3 : 1.5)) : undefined
        evs.push({ id: id('ev'), match_id: m.id, team_id: s.teamId, type: 'goal', player_id: scorer.id, related_player_id: assister?.id, minute, period })
      }
    }
    goalsFor(H, A, Math.min(7, poisson(rng, lam(sH, sA, true))))
    goalsFor(A, H, Math.min(7, poisson(rng, lam(sA, sH, false))))
    for (const s of [H, A]) {
      const nSaves = poisson(rng, 3.2 * (maxMin / 40))
      for (let i = 0; i < nSaves; i++) evs.push({ id: id('ev'), match_id: m.id, team_id: s.teamId, type: 'save', player_id: s.gk.id, minute: 1 + Math.floor(rng() * maxMin), period: undefined })
      if (rng() < 0.05) evs.push({ id: id('ev'), match_id: m.id, team_id: s.teamId, type: 'penalty_saved', player_id: s.gk.id, minute: 1 + Math.floor(rng() * maxMin) })
      if (rng() < 0.04) evs.push({ id: id('ev'), match_id: m.id, team_id: s.teamId, type: 'penalty_missed', player_id: pick(rng, s.starters.filter((p) => p.position !== 'GK')).id, minute: 1 + Math.floor(rng() * maxMin) })
      const ny = poisson(rng, 0.7 * (maxMin / 40))
      for (let i = 0; i < ny; i++) evs.push({ id: id('ev'), match_id: m.id, team_id: s.teamId, type: 'yellow_card', player_id: pick(rng, s.onPitch).id, minute: 1 + Math.floor(rng() * maxMin) })
      if (rng() < 0.03) evs.push({ id: id('ev'), match_id: m.id, team_id: s.teamId, type: 'red_card', player_id: pick(rng, s.onPitch.filter((p) => p.position !== 'GK')).id, minute: 25 + Math.floor(rng() * 15) })
      s.entered.forEach((p, i) => {
        const minute = Math.min(maxMin, 15 + i * 7 + Math.floor(rng() * 5))
        evs.push({ id: id('ev'), match_id: m.id, team_id: s.teamId, type: 'substitution', player_id: p.id, related_player_id: s.starters[1 + ((i + 2) % 5)]?.id, minute })
      })
    }
    for (const e of evs) e.period = e.period ?? ((e.minute ?? 0) <= 20 ? '1H' : '2H')
    evs.sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0))
    const isGoalFor = (e: MatchEvent, team: string) => ((e.type === 'goal' || e.type === 'penalty_goal') && e.team_id === team) || (e.type === 'own_goal' && e.team_id !== team)
    m.home_score = evs.filter((e) => isGoalFor(e, m.home_team_id)).length
    m.away_score = evs.filter((e) => isGoalFor(e, m.away_team_id)).length
    m.home_ht_score = evs.filter((e) => isGoalFor(e, m.home_team_id) && (e.minute ?? 0) <= 20).length
    m.away_ht_score = evs.filter((e) => isGoalFor(e, m.away_team_id) && (e.minute ?? 0) <= 20).length
    return { evs, lus, H, A }
  }

  function addTeamStats(m: Match, evs: MatchEvent[]) {
    const posH = 38 + Math.floor(rng() * 25)
    for (const [teamId, poss] of [[m.home_team_id, posH], [m.away_team_id, 100 - posH]] as const) {
      const opp = teamId === m.home_team_id ? m.away_team_id : m.home_team_id
      const goals = teamId === m.home_team_id ? m.home_score! : m.away_score!
      const oppSaves = evs.filter((e) => e.team_id === opp && (e.type === 'save' || e.type === 'penalty_saved')).length
      const on = goals + oppSaves
      const passes = 90 + Math.floor(rng() * 120) + poss
      db.MatchTeamStats.push({
        id: id('mts'), match_id: m.id, team_id: teamId, period: 'full', possession: poss,
        shots: on + Math.floor(rng() * 7), shots_on_target: on, corners: Math.floor(rng() * 7), fouls: 2 + Math.floor(rng() * 7),
        offsides: Math.floor(rng() * 4), passes, passes_completed: Math.round(passes * (0.66 + rng() * 0.2)),
        yellow_cards: evs.filter((e) => e.team_id === teamId && e.type === 'yellow_card').length,
        red_cards: evs.filter((e) => e.team_id === teamId && e.type === 'red_card').length,
        saves: evs.filter((e) => e.team_id === teamId && (e.type === 'save' || e.type === 'penalty_saved')).length,
        source: 'match_center',
      } as MatchTeamStats)
    }
  }

  const league = (): LeagueData => ({
    seasons: db.Season, competitions: db.Competition, divisions: db.Division, groups: db.Group, teams: db.Team, players: db.Player,
    matches: db.Match, events: db.MatchEvent, lineups: db.Lineup, xpRules: db.XPRule, settings,
  })

  function setMotm(m: Match) {
    const lines = playerMatchLines({ ...league(), events: db.MatchEvent.filter((e) => e.match_id === m.id), lineups: db.Lineup.filter((l) => l.match_id === m.id) }, [m])
    let best: { id: string; r: number } | null = null
    for (const [pid, ls] of lines) for (const l of ls) if (!best || l.rating > best.r) best = { id: pid, r: l.rating }
    m.motm_player_id = best?.id
  }

  function playMatch(m: Match, partialMinute?: number) {
    const { evs, lus } = simulate(m, { partialMinute })
    db.MatchEvent.push(...evs); db.Lineup.push(...lus)
    if (!partialMinute) { m.status = 'finished'; addTeamStats(m, evs); setMotm(m) }
  }

  // --- Compétitions & calendrier ---------------------------------------------
  function createLeague(season: Season, name: string, division: Division, teamIds: string[], r1: string, color: string, order: number, knockout: boolean) {
    const comp: Competition = {
      id: id('comp'), name, short_name: name.split(' ')[0].toUpperCase(), season_id: season.id, division_id: division.id, format: 'league', legs: 'double',
      color, description: `${name} — ${division.name}, championnat aller/retour${knockout ? ' puis demi-finales et finale' : ''}.`,
      start_date: r1, end_date: addDays(r1, 7 * 12), location: venues[0].name, team_count: teamIds.length, team_ids: teamIds,
      knockout_rounds: knockout ? ['semi', 'final'] : [], status: 'active', order,
    }
    db.Competition.push(comp)
    const pairings = roundRobin(shuffle(rng, teamIds), true)
    const times = ['18:30', '19:30', '20:30']
    const byRound = new Map<number, typeof pairings>()
    pairings.forEach((p) => { if (!byRound.has(p.round)) byRound.set(p.round, []); byRound.get(p.round)!.push(p) })
    for (const [round, ps] of byRound) {
      ps.forEach((p, i) => {
        const day = addDays(r1, (round - 1) * 7)
        const slot = slots[(i + order) % slots.length]
        db.Match.push({
          id: id('match'), season_id: season.id, competition_id: comp.id, round, stage: 'league',
          date: `${day}T${times[(i + order) % times.length]}:00`, venue_id: slot.venue_id, pitch: slot.pitch,
          home_team_id: p.home, away_team_id: p.away, status: 'scheduled', published: true,
          referee: pick(rng, REFS), home_score: null, away_score: null,
        })
      })
    }
    return comp
  }

  // Saison passée : intégralement jouée + demi-finales + finale en Gold Cup
  const goldPastTeams = teams.slice(0, 6).map((t) => t.id), silverPastTeams = teams.slice(6).map((t) => t.id)
  const goldPast = createLeague(pastSeason, 'Gold Cup', divA, goldPastTeams, pastR1, '#facc15', 1, true)
  const silverPast = createLeague(pastSeason, 'Silver Cup', divB, silverPastTeams, pastR1, '#cbd5e1', 2, false)
  for (const m of db.Match.filter((x) => x.season_id === pastSeason.id)) playMatch(m)
  {
    const table = competitionStandings(league(), goldPast.id)
    const sfDate = addDays(pastR1, 7 * 10)
    const mk = (slot: string, stage: Match['stage'], home: string, away: string, date: string): Match => ({
      id: id('match'), season_id: pastSeason.id, competition_id: goldPast.id, round: stage === 'final' ? 12 : 11, stage, bracket_slot: slot,
      date: `${date}T19:30:00`, venue_id: 'venue_lum', pitch: 'Terrain 1', home_team_id: home, away_team_id: away, status: 'scheduled', published: true, referee: pick(rng, REFS),
      home_source: { type: 'league_rank', ref: goldPast.id, rank: slot === 'SF1' ? 1 : 2 }, away_source: { type: 'league_rank', ref: goldPast.id, rank: slot === 'SF1' ? 4 : 3 },
    })
    const sf1 = mk('SF1', 'semi', table[0].team_id, table[3].team_id, sfDate)
    const sf2 = mk('SF2', 'semi', table[1].team_id, table[2].team_id, sfDate)
    for (const sf of [sf1, sf2]) {
      db.Match.push(sf); playMatch(sf)
      if (sf.home_score === sf.away_score) { sf.penalties = true; sf.home_pens = 4; sf.away_pens = 2 + Math.floor(rng() * 3) }
    }
    const w = (m: Match) => (m.home_score! > m.away_score! || (m.penalties && m.home_pens! > m.away_pens!) ? m.home_team_id : m.away_team_id)
    const final = mk('F', 'final', w(sf1), w(sf2), addDays(sfDate, 7))
    final.home_source = { type: 'winner', ref: 'SF1' }; final.away_source = { type: 'winner', ref: 'SF2' }
    db.Match.push(final); playMatch(final)
    if (final.home_score === final.away_score) { final.penalties = true; final.home_pens = 5; final.away_pens = 4 }
    goldPast.status = 'finished'; silverPast.status = 'finished'
    pastSeason.champion_team_id = w(final)
  }

  // Palmarès de la saison passée (publié, verrouillé)
  {
    const L = league()
    const pushAwards = (competition_id?: string) => {
      for (const a of computeAwards(L, { seasonId: pastSeason.id, competitionId: competition_id })) {
        if (competition_id && a.category !== 'best_team') continue
        db.Award.push({
          id: id('aw'), season_id: pastSeason.id, competition_id, period: competition_id ? 'competition' : 'season', category: a.category,
          player_id: a.player_id, team_id: a.team_id, value: a.value, snapshot: a.snapshot, not_awarded: a.not_awarded,
          status: 'published', locked: true, verified_by: 'superadmin@statfoot.app', published_at: pastSeason.closed_at,
        } as Award)
      }
    }
    pushAwards(); pushAwards(goldPast.id); pushAwards(silverPast.id)
  }

  // Promotions / relégations calculées par le moteur
  const { moves } = computePromotions(league(), pastSeason.id)
  const goldCur = new Set(goldPastTeams), silverCur = new Set(silverPastTeams)
  for (const mv of moves) {
    if (mv.type === 'promotion') { silverCur.delete(mv.team_id); goldCur.add(mv.team_id) }
    else { goldCur.delete(mv.team_id); silverCur.add(mv.team_id) }
    const t = teams.find((x) => x.id === mv.team_id)!; t.division_id = mv.to_division_id
  }

  // Saison en cours : J1→J8 jouées, 1 match en direct, le reste programmé
  const goldNow = createLeague(curSeason, 'Gold Cup', divA, [...goldCur], curR1, '#facc15', 1, true)
  createLeague(curSeason, 'Silver Cup', divB, [...silverCur], curR1, '#cbd5e1', 2, false)
  const cur = db.Match.filter((m) => m.season_id === curSeason.id)
  for (const m of cur.filter((x) => (x.round ?? 0) <= 8)) playMatch(m)
  // un match reporté (J8 Silver Cup)
  const postponed = cur.find((m) => m.round === 8 && m.competition_id !== goldNow.id)!
  db.MatchEvent = db.MatchEvent.filter((e) => e.match_id !== postponed.id)
  db.Lineup = db.Lineup.filter((l) => l.match_id !== postponed.id)
  db.MatchTeamStats = db.MatchTeamStats.filter((s) => s.match_id !== postponed.id)
  Object.assign(postponed, { status: 'postponed', home_score: null, away_score: null, home_ht_score: null, away_ht_score: null, motm_player_id: undefined })
  // match en direct aujourd'hui (avancé de la J9)
  const live = cur.find((m) => m.round === 9 && m.competition_id === goldNow.id)!
  const kick = new Date(now.getTime() - 31 * 60000)
  live.date = kick.toISOString().slice(0, 16) + ':00'
  playMatch(live, 26)
  live.status = 'live'
  live.live = { period: '2H', running: true, started_at: now.getTime() - 6 * 60000, elapsed_ms: 20 * 60000, possession: { home_ms: 14 * 60000, away_ms: 11 * 60000, dead_ms: 60000, current: 'home', since: now.getTime() }, operator_name: 'Marqueur Démo' }
  live.scorer_user_ids = ['user_scorer']

  // vote du public ouvert sur un match de la dernière journée
  const voteMatch = cur.find((m) => m.round === 8 && m.status === 'finished')!
  voteMatch.motm_vote_open = true
  voteMatch.motm_vote_closes_at = addDays(iso(today), 3) + 'T23:59:00'
  const voteLus = db.Lineup.filter((l) => l.match_id === voteMatch.id).flatMap((l) => [...(l.starter_ids ?? [])])
  for (let i = 0; i < 37; i++) db.MotmVote.push({ id: id('vote'), match_id: voteMatch.id, player_id: i % 3 === 0 ? voteMatch.motm_player_id! : pick(rng, voteLus), voter_key: `demo-${i}` } as MotmVote)

  // --- Médias ---------------------------------------------------------------
  const finished = db.Match.filter((m) => m.status === 'finished' && m.season_id === curSeason.id).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
  finished.slice(0, 14).forEach((m, i) => {
    const h = teams.find((t) => t.id === m.home_team_id)!, a = teams.find((t) => t.id === m.away_team_id)!
    db.Media.push({ id: id('media'), title: `${h.name} – ${a.name}`, type: 'photo', url: photoPlaceholderSvg(`${h.short_name} ${m.home_score}-${m.away_score} ${a.short_name}`, (i * 47) % 360, i), match_id: m.id, season_id: m.season_id, team_ids: [h.id, a.id], round: m.round, date: m.date?.slice(0, 10), source: 'upload', published: true } as Media)
  })
  db.Media.push(
    { id: id('media'), title: 'Résumé vidéo de la J8', type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', thumbnail_url: photoPlaceholderSvg('Résumé J8', 200, 3), season_id: curSeason.id, round: 8, date: iso(lastSat), source: 'url', published: true } as Media,
    { id: id('media'), title: 'Les plus beaux buts du mois', type: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', thumbnail_url: photoPlaceholderSvg('Top buts', 320, 5), season_id: curSeason.id, round: 7, date: addDays(iso(lastSat), -7), source: 'url', published: true } as Media,
    { id: id('media'), title: 'Coup d’envoi de la nouvelle saison', type: 'article', url: '#', thumbnail_url: photoPlaceholderSvg('Nouvelle saison', 40, 1), body: "La nouvelle saison est lancée avec 12 entreprises engagées en **Gold Cup** et **Silver Cup**. Montées, descentes, recrues : retour sur l'intersaison.", season_id: curSeason.id, round: 1, date: curR1, source: 'url', published: true } as Media,
    { id: id('media'), title: 'Brouillon : galerie J9', type: 'photo', url: photoPlaceholderSvg('Galerie J9', 140, 2), season_id: curSeason.id, round: 9, date: iso(today), source: 'google_drive', published: false } as Media,
  )

  // --- Utilisateurs ---------------------------------------------------------
  const ts = new Date(now.getTime() - 86400000 * 30).toISOString()
  db.User.push(
    { id: 'user_super', email: 'superadmin@statfoot.app', full_name: 'Super Admin', app_role: 'super_admin', active: true, activated_at: ts, password: 'statfoot' } as User,
    { id: 'user_admin', email: 'admin@statfoot.app', full_name: 'Admin Ligue', app_role: 'league_admin', active: true, activated_at: ts, password: 'statfoot' } as User,
    { id: 'user_scorer', email: 'marqueur@statfoot.app', full_name: 'Marqueur Démo', app_role: 'scorer', active: true, activated_at: ts, password: 'statfoot' } as User,
  )
  const cap = players.find((p) => p.email)!
  db.User.push({ id: 'user_player', email: cap.email!, full_name: `${cap.first_name} ${cap.last_name}`, app_role: 'player', player_id: cap.id, active: true, activated_at: ts, password: 'statfoot' } as User)
  db.Invitation.push({ id: id('inv'), email: 'nouveau.marqueur@exemple.com', app_role: 'scorer', status: 'pending', invited_by: 'superadmin@statfoot.app', created_date: ts } as Invitation)

  // dates de création
  const stamp = new Date(now.getTime() - 86400000 * 60).toISOString()
  for (const rows of Object.values(db) as { created_date?: string; updated_date?: string }[][]) for (const r of rows) { r.created_date ??= stamp; r.updated_date ??= stamp }
  return db
}

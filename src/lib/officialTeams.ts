// Liste officielle des équipes d'une saison (fonctions PURES, testées) — saison 2026-2027 : 23 équipes.
// Rapprochement sans tenir compte des majuscules, accents, tirets, apostrophes ni espaces, avec alias.
//  • équipe trouvée → GARDÉE (id, joueurs, logo personnalisé conservés), nom affiché mis à jour ;
//  • équipe manquante → CRÉÉE ;
//  • équipe de la saison absente de la liste → RETIRÉE de la saison, avec ses joueurs et ses matchs de cette
//    saison ; son club n'est supprimé que s'il n'a aucune autre saison (historique 2025-2026 conservé).
// Idempotent : relancé, le plan est vide (rien à créer, renommer ni retirer).
import type { Club, Competition, Lineup, Match, MatchEvent, MatchTeamStats, Player, Team } from '@/types/entities'
import { clubKey, teamSeasonId } from './clubs'

export interface OfficialTeam { name: string; short: string; aliases: string[]; c1: string; c2: string }

/** Saison 2026-2027 — nom affiché, code, alias (fichier de pré-saison, anciennes données). Logos : /logos/<code>.png */
export const OFFICIAL_TEAMS_2026: OfficialTeam[] = [
  { name: 'Arrow ECS', short: 'ARW', aliases: ['ARROW ECS', 'Arrow'], c1: '#D9DDE2', c2: '#1A1D21' },
  { name: 'Atelier Vert Rabat', short: 'AVR', aliases: ['ATELIER VERT-R'], c1: '#4A7729', c2: '#0E1A08' },
  { name: 'Atelier Vert Casa', short: 'AVC', aliases: ['ATELIER VERT-C'], c1: '#4A7729', c2: '#0E1A08' },
  { name: 'Cobco', short: 'COB', aliases: ['COBCO'], c1: '#005A83', c2: '#06183A' },
  { name: 'ALD Automotive', short: 'ALD', aliases: ['ALD AUTOMOTIVE', 'ALD'], c1: '#1B2A4A', c2: '#0A1124' },
  { name: 'Pharmaprom', short: 'PHP', aliases: ['PHARMAPROM'], c1: '#3A74C2', c2: '#0A1E3D' },
  { name: 'TAQEEF (MIDEA)', short: 'MID', aliases: ['MIDEA', 'TAQEEF', 'Taqeef Midea'], c1: '#1C6FA8', c2: '#04223A' },
  { name: 'Wafasalaf', short: 'WAF', aliases: ['WAFASALAF'], c1: '#009CB3', c2: '#04262A' },
  { name: 'JTI', short: 'JTI', aliases: ['JTI'], c1: '#22B24C', c2: '#081B10' },
  { name: 'Crédit Agricole', short: 'CAM', aliases: ['CREDIT AGRICOLE', 'Crédit Agricole du Maroc'], c1: '#29756E', c2: '#04241B' },
  { name: 'G3C', short: 'G3C', aliases: ['G3C', 'G3C.ma'], c1: '#78BF43', c2: '#16171A' },
  { name: 'Parebrise Express', short: 'PBE', aliases: ['Parebrise Express', 'Pare-Brise Express', 'PBE'], c1: '#FFC20E', c2: '#231F20' },
  { name: 'Marjane Market', short: 'MJM', aliases: ['MARJANE MARKET', 'Marjane'], c1: '#CF5014', c2: '#2A1003' },
  { name: 'Attijariwafa bank', short: 'ATW', aliases: ['ATTIJARIWAFA BANK', 'Attijariwafa'], c1: '#F39200', c2: '#2A1503' },
  { name: 'Canpack 1', short: 'CP1', aliases: ['CANPACK 1'], c1: '#032A5A', c2: '#01112A' },
  { name: 'Canpack 2', short: 'CP2', aliases: ['CANPACK 2'], c1: '#1E4F8F', c2: '#01112A' },
  { name: 'Distra', short: 'DST', aliases: ['DISTRA'], c1: '#8CC63F', c2: '#13240A' },
  { name: 'Michoc', short: 'MIC', aliases: ['MICHOC'], c1: '#E30613', c2: '#2A0406' },
  { name: 'BMCI', short: 'BMC', aliases: ['BMCI'], c1: '#00915A', c2: '#05241A' },
  { name: 'CTR', short: 'CTR', aliases: ['CTR', 'Construction & Travaux Routiers', 'Construction et Travaux Routiers'], c1: '#2E44B0', c2: '#0A1236' },
  { name: 'Mega Post Tension', short: 'MPT', aliases: ['MEGA PT', 'Mega PT', 'Mega Post-Tension', 'Mega Post Tension'], c1: '#1E90FF', c2: '#0A1E33' },
  { name: "L'Heure Joyeuse", short: 'LHJ', aliases: ['HEURE JOYEUSE', "L'Heure Joyeuse"], c1: '#E2007A', c2: '#2A0418' },
  { name: 'CAC', short: 'CAC', aliases: ['CAC', 'Centrale Automobile Chérifienne'], c1: '#285370', c2: '#0A1724' },
]

/** Clé de rapprochement : sans majuscules, accents, tirets, apostrophes ni espaces. */
export const teamKey = (s?: string) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '')
export const officialLogo = (o: OfficialTeam) => ({ logo_url: `/logos/${o.short.toLowerCase()}.png`, company_logo_url: `/logos/${o.short.toLowerCase()}-full.png` })

/** Équipe officielle correspondant à un nom (nom affiché, alias ou code) — undefined si aucune. */
export function matchOfficial(names: (string | undefined)[], list: OfficialTeam[] = OFFICIAL_TEAMS_2026): OfficialTeam | undefined {
  const keys = new Set(names.map(teamKey).filter(Boolean))
  return list.find((o) => [o.name, ...o.aliases].some((a) => keys.has(teamKey(a))))
    ?? list.find((o) => keys.has(teamKey(o.short)) && [...keys].some((k) => k.length <= 4))
}

export interface OfficialDb {
  Team: Team[]; Player: Player[]; Match: Match[]; MatchEvent: MatchEvent[]; Lineup: Lineup[]; MatchTeamStats: MatchTeamStats[]
  Competition: Competition[]; Club: Club[]
}
export interface OfficialPlan {
  seasonId: string
  kept: { team: Team; official: OfficialTeam; rename?: string; logo?: boolean }[]
  created: OfficialTeam[]
  removed: { team: Team; players: Player[]; matches: Match[]; keepClub: boolean }[]
  duplicates: { team: Team; official: OfficialTeam }[]
}

/** Logo généré (initiales) ou logo officiel du dépôt : remplacé par le logo HD officiel ; logo importé par l'admin : conservé. */
const replaceableLogo = (u?: string) => !u || u.startsWith('data:image/svg') || u.startsWith('/logos/')

export function planOfficialTeams(db: OfficialDb, seasonId: string, list: OfficialTeam[] = OFFICIAL_TEAMS_2026): OfficialPlan {
  const season = db.Team.filter((t) => teamSeasonId(t, db.Competition) === seasonId)
  const kept: OfficialPlan['kept'] = [], removed: OfficialPlan['removed'] = [], duplicates: OfficialPlan['duplicates'] = []
  const used = new Set<string>()
  for (const t of season) {
    const o = matchOfficial([t.name, t.company, t.short_name], list)
    if (o && !used.has(o.short)) {
      used.add(o.short)
      const logo = replaceableLogo(t.logo_url) && t.logo_url !== officialLogo(o).logo_url
      kept.push({ team: t, official: o, rename: t.name !== o.name ? t.name : undefined, logo })
    } else if (o) duplicates.push({ team: t, official: o })
    else {
      const matches = db.Match.filter((m) => m.season_id === seasonId && (m.home_team_id === t.id || m.away_team_id === t.id))
      const players = db.Player.filter((p) => p.team_id === t.id)
      const club = clubKey(t)
      removed.push({ team: t, players, matches, keepClub: db.Team.some((x) => x.id !== t.id && clubKey(x) === club) })
    }
  }
  // un doublon d'une équipe officielle (même nom deux fois) est retiré comme les autres
  for (const d of duplicates) {
    const matches = db.Match.filter((m) => m.season_id === seasonId && (m.home_team_id === d.team.id || m.away_team_id === d.team.id))
    removed.push({ team: d.team, players: db.Player.filter((p) => p.team_id === d.team.id), matches, keepClub: db.Team.some((x) => x.id !== d.team.id && clubKey(x) === clubKey(d.team)) })
  }
  const created = list.filter((o) => !used.has(o.short))
  return { seasonId, kept, created, removed, duplicates }
}

export const planIsEmpty = (p: OfficialPlan) => !p.created.length && !p.removed.length && !p.kept.some((k) => k.rename || k.logo)

/** Applique le plan : renvoie les tables modifiées (pures, sans effet de bord). */
export function applyOfficialPlan(db: OfficialDb, plan: OfficialPlan, opts: { idFor?: (o: OfficialTeam) => string } = {}): Partial<OfficialDb> {
  const idFor = opts.idFor ?? ((o: OfficialTeam) => `t${plan.seasonId.replace(/\D/g, '').slice(2, 4) || '26'}_${o.short.toLowerCase()}`)
  const removedIds = new Set(plan.removed.map((r) => r.team.id))
  const removedMatches = new Set(plan.removed.flatMap((r) => r.matches.map((m) => m.id)))
  const keptById = new Map(plan.kept.map((k) => [k.team.id, k]))
  const Team: Team[] = db.Team.filter((t) => !removedIds.has(t.id)).map((t) => {
    const k = keptById.get(t.id); if (!k) return t
    return { ...t, name: k.official.name, ...(k.logo ? officialLogo(k.official) : {}), season_id: t.season_id ?? plan.seasonId }
  })
  const Club: Club[] = db.Club.filter((c) => !plan.removed.some((r) => !r.keepClub && clubKey(r.team) === c.id))
  const existingIds = new Set(db.Team.map((t) => t.id))
  for (const o of plan.created) {
    let id = idFor(o); let n = 2
    while (existingIds.has(id)) id = `${idFor(o)}_${n++}`
    existingIds.add(id)
    Team.push({ id, name: o.name, short_name: o.short, company: o.name, ...officialLogo(o), primary_color: o.c1, secondary_color: o.c2, status: 'active', season_id: plan.seasonId, club_id: `club_${id}` })
    if (!Club.some((c) => c.id === `club_${id}`)) Club.push({ id: `club_${id}`, name: o.name, logo_url: officialLogo(o).logo_url })
  }
  const newIds = Team.filter((t) => !db.Team.some((x) => x.id === t.id)).map((t) => t.id)
  const official = new Set([...plan.kept.map((k) => k.team.id), ...newIds])
  // compétitions de la saison : retire les équipes retirées ; la pré-saison contient toutes les équipes officielles
  const Competition = db.Competition.map((c) => {
    if (c.season_id !== plan.seasonId) return c
    const ids = (c.team_ids ?? []).filter((id) => !removedIds.has(id))
    return c.phase === 'league_phase' ? { ...c, team_ids: [...new Set([...ids, ...official])].sort() } : { ...c, team_ids: ids }
  })
  const removedPlayers = new Set(plan.removed.flatMap((r) => r.players.map((p) => p.id)))
  return {
    Team, Club, Competition,
    Player: db.Player.filter((p) => !removedPlayers.has(p.id)),
    Match: db.Match.filter((m) => !removedMatches.has(m.id)),
    MatchEvent: db.MatchEvent.filter((e) => !removedMatches.has(e.match_id)),
    Lineup: db.Lineup.filter((l) => !removedMatches.has(l.match_id)),
    MatchTeamStats: db.MatchTeamStats.filter((s) => !removedMatches.has(s.match_id)),
  }
}

/** Rapport lisible (admin + journal). */
export function planReport(p: OfficialPlan) {
  return {
    gardees: p.kept.filter((k) => !k.rename).map((k) => k.official.name),
    renommees: p.kept.filter((k) => k.rename).map((k) => `${k.rename} → ${k.official.name}`),
    creees: p.created.map((o) => o.name),
    retirees: p.removed.map((r) => `${r.team.name} (${r.players.length} joueur(s), ${r.matches.length} match(s)${r.keepClub ? ', club et historique conservés' : ''})`),
  }
}

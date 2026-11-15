// Feuille de match complète : construite à partir des données du match, figée à la fin du match dans une fiche
// privée (ProcesVerbal « feuille »), et imprimable / enregistrable en PDF depuis l'admin.
// Version publique = la même SANS l'évaluation de l'arbitre ni les notes internes.
import { store } from '@/api/localStore'
import { base44 } from '@/api/base44Client'
import { forfeitText } from './forfeit'
import { RESERVE_OUTCOMES } from './forfeit'
import { CRITERIA } from './referee'
import type { BaseEntity, EntityName, Lineup, Match, MatchEvent, Player, RefereeEvaluation, Team } from '@/types/entities'

const all = <T extends BaseEntity>(n: EntityName) => store.all<T>(n)

export interface SheetTeam {
  id: string; name: string; score: number | null
  starters: string[]; substitutes: string[]; goalkeeper?: string; captain?: string
  players: { name: string; number?: number; goals: number; assists: number; shots: number; on_target: number; saves: number; yellow: number; red: number }[]
}
export interface MatchSheet {
  match_id: string; number?: string; date?: string; pitch?: string; competition?: string; round?: number
  status: string; referee?: string
  home: SheetTeam; away: SheetTeam
  penalties?: string
  goals: { minute: string; team: string; scorer: string; assist?: string; kind?: string }[]
  cards: { minute: string; team: string; player: string; type: string }[]
  forfeit?: string
  motm?: string
  reserve?: string
  notes?: string
  evaluation?: { overall: number; scores: { label: string; value: number }[]; comment?: string; by?: string; at: string }
  generated_at: string
}

const minute = (e: MatchEvent) => (e.minute == null ? '' : e.added_minute ? `${e.minute}+${e.added_minute}'` : `${e.minute}'`)

export function buildMatchSheet(matchId: string, opts: { private?: boolean } = {}): MatchSheet | null {
  const m = all<Match>('Match').find((x) => x.id === matchId)
  if (!m) return null
  const teams = new Map(all<Team>('Team').map((t) => [t.id, t]))
  const players = new Map(all<Player>('Player').map((p) => [p.id, p]))
  const events = all<MatchEvent>('MatchEvent').filter((e) => e.match_id === matchId).sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || (a.added_minute ?? 0) - (b.added_minute ?? 0))
  const lineups = all<Lineup>('Lineup').filter((l) => l.match_id === matchId)
  const pname = (id?: string) => { const p = id ? players.get(id) : undefined; return p ? `${p.first_name} ${p.last_name}` : '' }
  const side = (tid: string, score: number | null): SheetTeam => {
    const l = lineups.find((x) => x.team_id === tid)
    const ids = [...new Set([...(l?.present_ids ?? []), ...events.filter((e) => e.team_id === tid && e.player_id).map((e) => e.player_id!)])]
    const ev = (pid: string, ...types: string[]) => events.filter((e) => e.player_id === pid && types.includes(e.type)).length
    return {
      id: tid, name: teams.get(tid)?.name ?? '', score,
      starters: (l?.starter_ids ?? []).map(pname), substitutes: (l?.substitute_ids ?? []).map(pname),
      goalkeeper: pname(l?.goalkeeper_id), captain: pname(l?.captain_id),
      players: ids.map((pid) => ({
        name: pname(pid), number: l?.numbers?.[pid] ?? players.get(pid)?.number,
        goals: ev(pid, 'goal'), assists: events.filter((e) => e.type === 'goal' && e.related_player_id === pid).length,
        shots: ev(pid, 'goal', 'shot_on_target', 'shot_off_target'), on_target: ev(pid, 'goal', 'shot_on_target'),
        saves: ev(pid, 'save', 'penalty_saved'), yellow: ev(pid, 'yellow_card'), red: ev(pid, 'red_card', 'second_yellow'),
      })).sort((a, b) => (a.number ?? 99) - (b.number ?? 99)),
    }
  }
  const tname = (tid: string) => teams.get(tid)?.short_name ?? teams.get(tid)?.name ?? ''
  const ev = opts.private ? all<RefereeEvaluation>('RefereeEvaluation').find((e) => e.match_id === matchId) : undefined
  const reserve = RESERVE_OUTCOMES.find((r) => r.key === m.reserve_outcome)
  return {
    match_id: m.id, number: m.number, date: m.date, pitch: m.pitch, round: m.round,
    competition: all<{ id: string; name: string } & BaseEntity>('Competition').find((c) => c.id === m.competition_id)?.name,
    status: m.status, referee: m.referee_name,
    home: side(m.home_team_id, m.home_score ?? null), away: side(m.away_team_id, m.away_score ?? null),
    penalties: m.penalties ? `${m.home_pens ?? 0} - ${m.away_pens ?? 0}` : undefined,
    goals: events.filter((e) => e.type === 'goal' || e.type === 'own_goal').map((e) => ({ minute: minute(e), team: tname(e.type === 'own_goal' ? (e.team_id === m.home_team_id ? m.away_team_id : m.home_team_id) : e.team_id), scorer: e.type === 'own_goal' ? `${pname(e.player_id) || 'Contre son camp'} (csc)` : pname(e.player_id) || e.player_name_free || '—', assist: pname(e.related_player_id) || undefined, kind: e.goal_kind === 'penalty' ? 'penalty' : undefined })),
    cards: events.filter((e) => ['yellow_card', 'red_card', 'second_yellow'].includes(e.type)).map((e) => ({ minute: minute(e), team: tname(e.team_id), player: pname(e.player_id), type: e.type === 'yellow_card' ? 'Jaune' : e.type === 'second_yellow' ? '2e jaune' : 'Rouge' })),
    forfeit: forfeitText(m) || undefined,
    motm: pname(m.motm_player_id) || undefined,
    reserve: opts.private && reserve ? `${reserve.label}${m.reserve_note ? ` — ${m.reserve_note}` : ''}` : undefined,
    notes: opts.private ? m.notes : undefined,
    evaluation: ev ? { overall: ev.overall, scores: CRITERIA.map((c) => ({ label: c.label, value: ev.scores[c.key] })), comment: ev.comment, by: ev.author_email, at: ev.submitted_at } : undefined,
    generated_at: new Date().toISOString(),
  }
}

/** Fige la feuille de match (fiche privée) — appelé automatiquement à la fin du match */
export async function saveMatchSheet(matchId: string) {
  const sheet = buildMatchSheet(matchId, { private: true })
  if (!sheet) return
  const m = all<Match>('Match').find((x) => x.id === matchId)!
  const id = `sheet_${matchId}`
  const data = { season_id: m.season_id, kind: 'feuille' as const, title: `Feuille de match ${m.number ?? ''} — ${sheet.home.name} ${sheet.home.score ?? ''}-${sheet.away.score ?? ''} ${sheet.away.name}`.trim(), date: (m.date ?? sheet.generated_at).slice(0, 10), match_id: matchId, sheet: sheet as unknown as Record<string, unknown> }
  if (store.all('ProcesVerbal').some((x) => x.id === id)) await base44.entities.ProcesVerbal.update(id, data)
  else await base44.entities.ProcesVerbal.create({ id, ...data } as never)
}

// Opérations métier sur un match (couche data) : utilisées par la saisie rapide, le Match Center et la feuille de match.
// Dans Base44, ces fonctions deviennent des appels base44.entities.* (ou une fonction backend).
import { base44, store } from './base44Client'
import { newId } from './localStore'
import type { AdminUser, LiveState, Match, MatchEvent } from '@/types/entities'
import type { LeagueData } from '@/lib/stats'
import { competitionStandings, isKnockout, teamRankBefore, winnerOf, loserOf } from '@/lib/stats'
import { buildAction, idsToRemove, newLiveState, scoreFromEvents, shootout, type NewEvent } from '@/lib/matchEngine'

const now = () => new Date().toISOString()
const audit = (action: string, m: Match, by?: AdminUser | null, details?: Record<string, unknown>) =>
  base44.logActivity(action, 'Match', m as never, { ...details, operateur: by?.full_name ?? by?.email })

// ---------------------------------------------------------------------------
//  File d'écriture hors ligne : chaque action est horodatée, mise en file, puis rejouée.
//  En local, l'écriture localStorage réussit toujours ; la file sert si l'API distante (Base44) échoue.
// ---------------------------------------------------------------------------
type Pending = { kind: 'create'; rows: NewEvent[] } | { kind: 'delete'; ids: string[] } | { kind: 'update'; id: string; patch: Partial<MatchEvent> }
const QKEY = 'outbox'
function readQueue(): Pending[] { try { return JSON.parse(store.getFlag(QKEY) ?? '[]') } catch { return [] } }
function writeQueue(q: Pending[]) { store.setFlag(QKEY, JSON.stringify(q)); listeners.forEach((l) => l(q.length)) }
const listeners = new Set<(n: number) => void>()
export const outbox = {
  size: () => readQueue().length,
  subscribe(l: (n: number) => void) { listeners.add(l); return () => { listeners.delete(l) } },
  async flush() {
    const q = readQueue()
    const rest: Pending[] = []
    for (const p of q) {
      try { await apply(p) } catch { rest.push(p) }
    }
    writeQueue(rest)
    return rest.length
  },
}
async function apply(p: Pending) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false && (globalThis as { __simulateRemote?: boolean }).__simulateRemote) throw new Error('offline')
  if (p.kind === 'create') {
    const existing = new Set(store.all<MatchEvent>('MatchEvent').map((e) => e.client_id).filter(Boolean))
    const rows = p.rows.filter((r) => !r.client_id || !existing.has(r.client_id)) // idempotence
    if (rows.length) await base44.entities.MatchEvent.bulkCreate(rows as never)
  } else if (p.kind === 'delete') { for (const id of p.ids) await base44.entities.MatchEvent.delete(id).catch(() => undefined) }
  else await base44.entities.MatchEvent.update(p.id, p.patch)
}
async function enqueue(p: Pending) {
  try { await apply(p) } catch { writeQueue([...readQueue(), p]) }
}
if (typeof window !== 'undefined') window.addEventListener('online', () => { outbox.flush() })

// ---------------------------------------------------------------------------
export async function addAction(match: Match, existing: MatchEvent[], action: Omit<NewEvent, 'match_id'>) {
  const rows = buildAction(match, existing, { ...action, match_id: match.id, client_id: action.client_id ?? newId(), client_ts: action.client_ts ?? now() } as NewEvent, newId)
  await enqueue({ kind: 'create', rows })
  await syncLiveScore(match.id)
  return rows
}
export async function removeEvent(match: Match, events: MatchEvent[], eventId: string) {
  await enqueue({ kind: 'delete', ids: idsToRemove(events, eventId) })
  await syncLiveScore(match.id)
}
export async function updateEvent(match: Match, id: string, patch: Partial<MatchEvent>) {
  await enqueue({ kind: 'update', id, patch })
  await syncLiveScore(match.id)
}

/** Le score officiel = somme des buts du Match Center. */
export async function syncLiveScore(matchId: string) {
  const m = store.all<Match>('Match').find((x) => x.id === matchId)
  if (!m) return
  const evs = store.all<MatchEvent>('MatchEvent').filter((e) => e.match_id === matchId)
  const s = scoreFromEvents(m, evs)
  const ht = scoreFromEvents(m, evs, ['1H'])
  const so = shootout(m, evs)
  const patch: Partial<Match> = { home_score: s.home, away_score: s.away, home_ht_score: ht.home, away_ht_score: ht.away }
  if (so.home.length || so.away.length) Object.assign(patch, { penalties: true, home_pens: so.home_score, away_pens: so.away_score })
  if (m.home_score !== s.home || m.away_score !== s.away || m.home_ht_score !== ht.home || m.away_ht_score !== ht.away || patch.penalties) await base44.entities.Match.update(matchId, patch)
}

// ---------------------------------------------------------------------------
//  Live state & verrou opérateur
// ---------------------------------------------------------------------------
export async function getOrCreateLive(matchId: string): Promise<LiveState> {
  const ls = store.all<LiveState>('LiveState').find((l) => l.match_id === matchId)
  if (ls) return ls
  return base44.entities.LiveState.create(newLiveState(matchId))
}
export async function saveLive(ls: LiveState) {
  const { id, ...rest } = ls
  return base44.entities.LiveState.update(id, { ...rest, version: (ls.version ?? 0) + 1 })
}
export const LOCK_TTL_MS = 60_000
export function lockHolder(ls: LiveState | undefined, nowMs = Date.now()) {
  if (!ls?.lock_user_id || !ls.lock_heartbeat_at || nowMs - ls.lock_heartbeat_at > LOCK_TTL_MS) return null
  return { id: ls.lock_user_id, name: ls.lock_user_name ?? '' }
}
export async function takeLock(ls: LiveState, user: AdminUser, force = false) {
  const h = lockHolder(ls)
  if (h && h.id !== user.id && !force) return false
  await base44.entities.LiveState.update(ls.id, { lock_user_id: user.id, lock_user_name: user.full_name ?? user.email, lock_heartbeat_at: Date.now() })
  if (force && h && h.id !== user.id) base44.logActivity('take_over', 'LiveState', ls as never, { ancien: h.name, nouveau: user.email })
  return true
}
export async function heartbeat(ls: LiveState, user: AdminUser) {
  if (ls.lock_user_id === user.id) await base44.entities.LiveState.update(ls.id, { lock_heartbeat_at: Date.now() })
}

// ---------------------------------------------------------------------------
//  Clôture / réouverture → tout est recalculé (XP, classements, forme, trophées, stats sont dérivés des événements)
// ---------------------------------------------------------------------------
export async function closeMatch(data: LeagueData, match: Match, by: AdminUser | null, opts: { voteMinutes?: number } = {}) {
  const evs = data.events.filter((e) => e.match_id === match.id)
  const s = scoreFromEvents(match, evs), ht = scoreFromEvents(match, evs, ['1H']), so = shootout(match, evs)
  const unfrozen = { ...data, matches: data.matches.map((m) => (m.id === match.id ? { ...m, validated: false } : m)) }
  const patch: Partial<Match> = {
    status: 'finished', validated: true, validated_at: now(), validated_by: by?.email, home_score: s.home, away_score: s.away, home_ht_score: ht.home, away_ht_score: ht.away,
    opponent_rank_snapshot: { home_rank: teamRankBefore(unfrozen, match, match.home_team_id), away_rank: teamRankBefore(unfrozen, match, match.away_team_id) },
    motm_vote_closes_at: new Date(Date.now() + (opts.voteMinutes ?? 15) * 60000).toISOString(),
    penalties: so.home.length + so.away.length > 0 || undefined, home_pens: so.home.length ? so.home_score : null, away_pens: so.away.length ? so.away_score : null,
    extra_time: evs.some((e) => e.period === 'ET1' || e.period === 'ET2') || match.extra_time,
  }
  await base44.entities.Match.update(match.id, patch)
  const ls = store.all<LiveState>('LiveState').find((l) => l.match_id === match.id)
  if (ls) await base44.entities.LiveState.update(ls.id, { period: 'FT', running: false, period_started_at: null })
  audit('close_match', match, by, { score: `${s.home}-${s.away}`, actions: evs.filter((e) => !e.auto).length })
  await resolveBracket(match.competition_id)
}

export async function reopenMatch(match: Match, by: AdminUser | null) {
  await base44.entities.Match.update(match.id, { status: 'live', validated: false, validated_at: undefined })
  audit('reopen_match', match, by)
}

/** Remplit automatiquement les équipes des matchs de phase finale dont la source est déterminée. */
export async function resolveBracket(competitionId: string) {
  const matches = store.all<Match>('Match')
  const comp = store.all<{ id: string; team_ids?: string[] }>('Competition').find((c) => c.id === competitionId)
  if (!comp) return
  for (const m of matches.filter((x) => x.competition_id === competitionId && isKnockout(x) && x.status === 'scheduled')) {
    const patch: Partial<Match> = {}
    for (const side of ['home', 'away'] as const) {
      const src = side === 'home' ? m.home_source : m.away_source
      if (!src || (src.type !== 'winner' && src.type !== 'loser')) continue
      const ref = matches.find((x) => x.competition_id === competitionId && x.bracket_slot === src.ref)
      const t = ref ? (src.type === 'winner' ? winnerOf(ref) : loserOf(ref)) : null
      const key = side === 'home' ? 'home_team_id' : 'away_team_id'
      if (t && m[key] !== t) patch[key] = t
    }
    if (Object.keys(patch).length) await base44.entities.Match.update(m.id, patch)
  }
}

export function rankingFor(data: LeagueData, competitionId: string) { return competitionStandings(data, competitionId) }

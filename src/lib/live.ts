import type { Match } from '@/types/entities'

/** Temps de jeu écoulé (ms) d'un match en direct, chrono arrêté pris en compte. */
export function liveElapsedMs(m: Pick<Match, 'live'>, now = Date.now()) {
  const l = m.live
  if (!l) return 0
  return l.elapsed_ms + (l.running && l.started_at ? now - l.started_at : 0)
}
export function liveMinute(m: Pick<Match, 'live' | 'status'>, now = Date.now()) {
  if (m.status !== 'live') return 0
  if (m.live?.period === 'HT') return 'MT' as unknown as number
  return Math.max(1, Math.ceil(liveElapsedMs(m, now) / 60000))
}
export function fmtClock(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
/** Possession en % (le temps « ballon mort » est exclu) */
export function possessionPct(m: Pick<Match, 'live'>, now = Date.now()) {
  const p = m.live?.possession
  if (!p) return { home: 50, away: 50 }
  let h = p.home_ms, a = p.away_ms
  if (m.live?.running && p.since) { if (p.current === 'home') h += now - p.since; else if (p.current === 'away') a += now - p.since }
  const t = h + a
  if (!t) return { home: 50, away: 50 }
  const home = Math.round((h / t) * 100)
  return { home, away: 100 - home }
}

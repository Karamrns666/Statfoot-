// Horaires et terrains des matchs (fonctions pures, testées dans matchTime.test.ts).
// · les dates sont stockées en ISO UTC et affichées à l'heure du Maroc (Africa/Casablanca) partout ;
// · 2 terrains fixes, 2 matchs maximum par créneau, jamais 2 matchs sur le même terrain au même créneau ;
// · alerte non bloquante si une équipe joue deux fois le même jour ;
// · numéros officiels PS-01, PS-02… jamais réutilisés.
import { MATCH_TZ, MAX_PER_SLOT, PITCHES } from '@/config/pitches'
import type { Match } from '@/types/entities'

const parts = new Intl.DateTimeFormat('en-GB', { timeZone: MATCH_TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
/** Heure murale au Maroc d'un instant ISO : « 2026-11-16T21:00 ». */
export function toWall(iso: string): string {
  const p = Object.fromEntries(parts.formatToParts(new Date(iso)).map((x) => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}
export const wallDay = (iso?: string) => (iso ? toWall(iso).slice(0, 10) : '')
export const wallTime = (iso?: string) => (iso ? toWall(iso).slice(11, 16) : '')
/** Instant ISO (UTC) d'une heure murale au Maroc : (« 2026-11-16 », « 21:00 ») → « 2026-11-16T20:00:00.000Z ». */
export function wallToISO(day: string, time: string): string {
  const guess = new Date(`${day}T${time}:00Z`)
  // décalage du Maroc à cet instant (UTC+1, UTC+0 pendant le ramadan) : on corrige jusqu'à tomber juste
  let t = guess.getTime()
  for (let i = 0; i < 3; i++) {
    const w = toWall(new Date(t).toISOString())
    const diff = new Date(`${w}:00Z`).getTime() - guess.getTime()
    if (!diff) break
    t -= diff
  }
  return new Date(t).toISOString()
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const dayFmt = new Intl.DateTimeFormat('fr-FR', { timeZone: MATCH_TZ, weekday: 'long', day: 'numeric', month: 'long' })
/** « Lundi 16 novembre » */
export const fmtDay = (iso?: string) => (iso ? cap(dayFmt.format(new Date(iso))) : '')
/** « 21h00 » */
export const fmtHour = (iso?: string) => (iso ? wallTime(iso).replace(':', 'h') : '')
export const TBD = 'Horaire à définir'
export const isScheduled = (m: Pick<Match, 'date' | 'pitch'>) => !!m.date && !!m.pitch
/** « Lundi 16 novembre · 21h00 · Terrain 1 » — ou « Horaire à définir ». */
export function fmtWhen(m: Pick<Match, 'date' | 'pitch'>, opts: { pitch?: boolean } = {}): string {
  if (!m.date) return TBD
  return [fmtDay(m.date), fmtHour(m.date), opts.pitch === false ? '' : m.pitch ?? 'Terrain à définir'].filter(Boolean).join(' · ')
}

export const isPitch = (p?: string): boolean => !!p && (PITCHES as readonly string[]).includes(p)
export interface ScheduleCheck { errors: string[]; warnings: string[] }
type M = Pick<Match, 'id' | 'date' | 'pitch' | 'home_team_id' | 'away_team_id' | 'status'> & { number?: string }
const label = (m: M, name: (id: string) => string) => `${m.number ? `${m.number} ` : ''}${name(m.home_team_id)} – ${name(m.away_team_id)}`

/** Contrôle d'un match placé à (date, terrain) parmi les autres matchs. */
export function checkPlacement(candidate: M, others: M[], name: (id: string) => string = (x) => x): ScheduleCheck {
  const errors: string[] = [], warnings: string[] = []
  if (!candidate.date || !candidate.pitch) return { errors, warnings }
  if (!isPitch(candidate.pitch)) errors.push(`Terrain inconnu : « ${candidate.pitch} » (terrains : ${PITCHES.join(', ')}).`)
  const slot = toWall(candidate.date), day = slot.slice(0, 10)
  const active = others.filter((o) => o.id !== candidate.id && o.date && o.status !== 'cancelled' && o.status !== 'postponed')
  const same = active.filter((o) => toWall(o.date!) === slot)
  const clash = same.find((o) => o.pitch === candidate.pitch)
  if (clash) errors.push(`${candidate.pitch} est déjà pris à ${fmtHour(candidate.date)} le ${fmtDay(candidate.date)} par ${label(clash, name)}.`)
  else if (same.length >= MAX_PER_SLOT) errors.push(`Déjà ${same.length} matchs à ${fmtHour(candidate.date)} le ${fmtDay(candidate.date)} : ${MAX_PER_SLOT} maximum par créneau.`)
  for (const t of [candidate.home_team_id, candidate.away_team_id]) {
    const dup = active.find((o) => wallDay(o.date) === day && (o.home_team_id === t || o.away_team_id === t))
    if (dup) warnings.push(`${name(t)} joue déjà ce jour-là (${label(dup, name)} à ${fmtHour(dup.date)}).`)
  }
  return { errors, warnings }
}

/** Contrôle d'une journée entière (avant publication) : chaque match doit avoir date, heure et terrain, sans conflit. */
export function checkRound(round: M[], all: M[], name: (id: string) => string = (x) => x): ScheduleCheck & { missing: number } {
  const errors = new Set<string>(), warnings = new Set<string>()
  const missing = round.filter((m) => !isScheduled(m)).length
  if (missing) errors.add(`${missing} match${missing > 1 ? 's' : ''} sans date, heure ou terrain (${TBD}).`)
  for (const m of round) {
    const r = checkPlacement(m, all, name)
    r.errors.forEach((e) => errors.add(e)); r.warnings.forEach((w) => warnings.add(w))
  }
  return { errors: [...errors], warnings: [...warnings], missing }
}

/** Numéros officiels : « PS-08 » → 8. */
export const numberValue = (n?: string) => { const x = /^PS-(\d+)$/.exec(n ?? ''); return x ? Number(x[1]) : 0 }
export const fmtNumber = (n: number) => `PS-${String(n).padStart(2, '0')}`
/** Prochains numéros, sans jamais réutiliser un numéro déjà attribué (compteur conservé même si un match est supprimé). */
export function nextNumbers(existing: (string | undefined)[], counter: number | undefined, count: number): string[] {
  const start = Math.max(counter ?? 0, ...existing.map(numberValue), 0)
  return Array.from({ length: count }, (_, i) => fmtNumber(start + i + 1))
}

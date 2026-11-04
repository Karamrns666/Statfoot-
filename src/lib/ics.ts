// Export agenda (.ics, RFC 5545) : un match ou tout un calendrier filtré.
import type { Match, Team } from '@/types/entities'

const pad = (n: number) => String(n).padStart(2, '0')
const stamp = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
/** Coupe les lignes à 75 octets (règle iCalendar) */
const fold = (line: string) => { const out: string[] = []; let s = line; while (s.length > 74) { out.push(s.slice(0, 74)); s = ' ' + s.slice(74) } out.push(s); return out.join('\r\n') }

export interface IcsContext { team: (id: string) => Team | undefined; competition?: (id: string) => string | undefined; leagueName: string; address?: string; url?: string; durationMin?: number }

export function matchesToIcs(matches: Match[], ctx: IcsContext) {
  const now = stamp(new Date())
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//${ctx.leagueName}//Calendrier//FR`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(ctx.leagueName)}`]
  for (const m of matches) {
    if (!m.date) continue
    const start = new Date(m.date), end = new Date(start.getTime() + (ctx.durationMin ?? 45) * 60000)
    const h = ctx.team(m.home_team_id)?.name ?? 'À déterminer', a = ctx.team(m.away_team_id)?.name ?? 'À déterminer'
    const comp = ctx.competition?.(m.competition_id)
    lines.push('BEGIN:VEVENT', `UID:${m.id}@morocco-business-league`, `DTSTAMP:${now}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      fold(`SUMMARY:${esc(`${h} – ${a}`)}`),
      fold(`DESCRIPTION:${esc(`${ctx.leagueName}${comp ? ` · ${comp}` : ''} · Journée ${m.round ?? ''}${m.pitch ? ` · ${m.pitch}` : ''}${ctx.url ? `\n${ctx.url}/matchs/${m.id}` : ''}`)}`),
      fold(`LOCATION:${esc([m.pitch, ctx.address].filter(Boolean).join(', '))}`), 'END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadIcs(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** « 2 j 04 h 12 min » jusqu'à une date (null si passée) */
export function countdown(to: string | undefined, now: number) {
  if (!to) return null
  let s = Math.floor((new Date(to).getTime() - now) / 1000)
  if (s <= 0) return null
  const d = Math.floor(s / 86400); s -= d * 86400
  const h = Math.floor(s / 3600); s -= h * 3600
  const m = Math.floor(s / 60)
  return { d, h, m, s: s - m * 60 }
}

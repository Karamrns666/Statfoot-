import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarX, Star } from 'lucide-react'
import { format, startOfWeek, addDays as addDaysFns, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useData, useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useEffectiveSeason } from '@/hooks/useStats'
import { PageHeader, EmptyState } from '@/components/league/Bits'
import { FilterSelect } from '@/components/league/FilterSelect'
import { MatchRow } from '@/components/match/MatchRow'
import { CompetitionTabs } from '@/components/league/CompetitionTabs'
import { SeasonNotStarted } from '@/components/league/SeasonNotStarted'
import { AddToCalendar } from '@/components/match/AddToCalendar'
import { NextMatchBanner } from '@/components/match/NextMatchBanner'
import { STAGE_LABELS } from '@/lib/schedule'
import { isKnockout } from '@/lib/standings'
import { cn } from '@/lib/utils'
import type { Match } from '@/types/entities'

type Tab = 'tous' | 'direct' | 'a-venir' | 'termines' | 'favoris'
const FAV_KEY = 'statfoot:favoris'
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const dayKey = (d?: string) => (d ?? '').slice(0, 10)

function useFavorites() {
  const [fav, setFav] = useState<Set<string>>(() => { try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]')) } catch { return new Set() } })
  const toggle = (id: string) => setFav((f) => {
    const n = new Set(f); if (n.has(id)) n.delete(id); else n.add(id)
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...n])) } catch { /* stockage indisponible */ }
    return n
  })
  return { fav, toggle }
}

export default function Matches() {
  const { db } = useData()
  const L = useLookup()
  const { scopeSeasonId } = useSeason()
  const eff = useEffectiveSeason()
  const sid = scopeSeasonId ?? eff?.id ?? null
  const season = sid ? L.season.get(sid) : undefined
  const [sp, setSp] = useSearchParams()
  const set = (k: string, v: string) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); if (k === 'journee') n.delete('jour'); setSp(n, { replace: true }) }
  const { fav, toggle } = useFavorites()

  const base = useMemo(() => db.Match.filter((m) => m.published !== false && (!sid || m.season_id === sid)).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '')), [db.Match, sid])
  const rounds = useMemo(() => {
    const g = new Map<number, Match[]>()
    for (const m of base) { const r = m.round ?? 0; if (!g.has(r)) g.set(r, []); g.get(r)!.push(m) }
    return [...g.entries()].sort((a, b) => a[0] - b[0]).map(([round, ms]) => ({ round, date: ms[0]?.date, live: ms.some((m) => m.status === 'live'), done: ms.every((m) => m.status === 'finished' || m.status === 'cancelled'), label: ms.find((m) => m.stage && isKnockout(m))?.stage }))
  }, [base])
  // journée par défaut : celle du direct, sinon la prochaine à jouer, sinon la dernière
  const defaultRound = (rounds.find((r) => r.live) ?? rounds.find((r) => !r.done) ?? rounds.at(-1))?.round
  const roundParam = sp.get('journee')
  const round = roundParam === 'toutes' ? null : roundParam ? Number(roundParam) : defaultRound ?? null
  const tab = (sp.get('statut') ?? 'tous') as Tab
  const team = sp.get('equipe') ?? ''
  const day = sp.get('jour') ?? ''
  const comp = sp.get('competition') ?? ''
  const pitch = sp.get('terrain') ?? ''
  const seasonComps = db.Competition.filter((c) => c.season_id === sid).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const pitches = [...new Set(base.map((m) => m.pitch).filter(Boolean) as string[])].sort()

  const inRound = base.filter((m) => round == null || (m.round ?? 0) === round)
  const liveCount = base.filter((m) => m.status === 'live').length
  const filtered = inRound.filter((m) =>
    (tab === 'tous' || (tab === 'direct' && m.status === 'live') || (tab === 'a-venir' && (m.status === 'scheduled' || m.status === 'postponed')) || (tab === 'termines' && m.status === 'finished') || (tab === 'favoris' && (fav.has(m.home_team_id) || fav.has(m.away_team_id)))) &&
    (!team || m.home_team_id === team || m.away_team_id === team) && (!day || dayKey(m.date) === day) && (!comp || m.competition_id === comp) && (!pitch || m.pitch === pitch))

  // bande des jours : semaine de la journée sélectionnée
  const week = useMemo(() => {
    const first = inRound[0]?.date
    if (round == null || !first) return []
    const start = startOfWeek(new Date(first), { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, i) => { const d = addDaysFns(start, i); return { d, key: format(d, 'yyyy-MM-dd'), n: inRound.filter((m) => m.date && isSameDay(new Date(m.date), d)).length } })
  }, [inRound, round])

  const groups = useMemo(() => {
    const g = new Map<string, Match[]>()
    for (const m of filtered) {
      const r = m.stage && isKnockout(m) ? STAGE_LABELS[m.stage] : `Journée ${m.round}`
      const k = `${m.date ? cap(format(new Date(m.date), 'EEE d MMM', { locale: fr })) : 'Date à fixer'} · ${r}`
      if (!g.has(k)) g.set(k, []); g.get(k)!.push(m)
    }
    return [...g.entries()]
  }, [filtered])

  // prochains matchs (tous filtres sauf journée et jour) — pour le compte à rebours et l'export agenda
  const upcomingFiltered = base.filter((m) => m.status === 'scheduled' && m.date && new Date(m.date).getTime() > Date.now() - 3600000 &&
    (!team || m.home_team_id === team || m.away_team_id === team) && (!comp || m.competition_id === comp) && (!pitch || m.pitch === pitch) &&
    (tab !== 'favoris' || fav.has(m.home_team_id) || fav.has(m.away_team_id)))
  const nextMatch = upcomingFiltered[0]
  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => { strip.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' }) }, [round])
  const teams = db.Team.filter((t) => base.some((m) => m.home_team_id === t.id || m.away_team_id === t.id)).sort((a, b) => a.name.localeCompare(b.name))

  const TABS: { v: Tab; label: string }[] = [{ v: 'tous', label: 'Tous' }, { v: 'direct', label: 'En direct' }, { v: 'a-venir', label: 'À venir' }, { v: 'termines', label: 'Terminés' }, { v: 'favoris', label: 'Mes favoris' }]
  return (
    <div>
      <PageHeader title="Matchs" subtitle={`${season?.name ?? 'Toutes saisons'} · Calendrier et résultats`} />
      {seasonComps.length > 1 && <CompetitionTabs comps={seasonComps} value={comp} onChange={(v) => set('competition', v)} className="mb-4" />}

      {base.length === 0 ? <SeasonNotStarted what="Le calendrier et les résultats" /> : <>
      {/* journées */}
      <div ref={strip} className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Journées">
        <button role="tab" aria-selected={round == null} onClick={() => set('journee', 'toutes')} className={cn('shrink-0 cursor-pointer rounded-xl border px-4 py-2 text-left transition', round == null ? 'border-neon bg-neon text-white' : 'border-white/10 bg-white/[.03] text-muted-foreground hover:text-white')}>
          <div className="font-display text-lg font-black leading-none">Toutes</div><div className="mt-0.5 text-[11px] opacity-80">{base.length} matchs</div>
        </button>
        {rounds.map((r) => (
          <button key={r.round} role="tab" aria-selected={round === r.round} aria-current={round === r.round} onClick={() => set('journee', String(r.round))} className={cn('relative shrink-0 cursor-pointer rounded-xl border px-4 py-2 text-left transition', round === r.round ? 'border-neon bg-neon text-white' : 'border-white/10 bg-white/[.03] text-muted-foreground hover:text-white')}>
            {r.live && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-red-500 animate-pulse-live" />}
            <div className="font-display text-lg font-black leading-none">{r.label ? STAGE_LABELS[r.label] : `J${r.round}`}</div>
            <div className="mt-0.5 whitespace-nowrap text-[11px] opacity-80">{r.date ? format(new Date(r.date), 'd MMM', { locale: fr }) : '—'}</div>
          </button>
        ))}
      </div>

      {/* jours de la semaine */}
      {week.length > 0 && (
        <div className="mb-4 grid grid-cols-7 gap-1.5">
          {week.map((w) => (
            <button key={w.key} disabled={!w.n} aria-pressed={day === w.key} onClick={() => set('jour', day === w.key ? '' : w.key)} className={cn('rounded-lg py-1.5 text-center transition', w.n ? 'cursor-pointer' : 'opacity-35', day === w.key ? 'bg-sky text-ink' : w.n ? 'bg-white/[.06] hover:bg-white/10' : 'bg-transparent')}>
              <div className="text-[11px]">{format(w.d, 'EEE', { locale: fr })}</div>
              <div className="font-display text-lg font-black leading-none">{format(w.d, 'd')}</div>
            </button>
          ))}
        </div>
      )}

      {/* onglets */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t.v} onClick={() => set('statut', t.v === 'tous' ? '' : t.v)} aria-pressed={tab === t.v} className={cn('inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-bold transition', tab === t.v ? 'border-white bg-white text-ink' : 'border-white/15 text-muted-foreground hover:text-white')}>
            {t.v === 'direct' && <span className={cn('size-2 rounded-full', liveCount ? 'bg-red-500 animate-pulse-live' : 'bg-white/25')} />}
            {t.v === 'favoris' && <Star className={cn('size-3.5', fav.size && 'fill-award-gold text-award-gold')} />}
            {t.label}{t.v === 'direct' && <span className="num text-sm">{liveCount}</span>}
          </button>
        ))}
        <FilterSelect label="Équipe" value={team} onChange={(v) => set('equipe', v)} allLabel="Équipe : toutes" options={teams.map((t) => ({ value: t.id, label: t.name }))} className="rounded-full sm:w-52" />
        {pitches.length > 1 && <FilterSelect label="Terrain" value={pitch} onChange={(v) => set('terrain', v)} allLabel="Terrain : tous" options={pitches.map((x) => ({ value: x, label: x }))} className="rounded-full sm:w-40" />}
      </div>

      {nextMatch && <NextMatchBanner match={nextMatch} />}
      {upcomingFiltered.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <AddToCalendar matches={upcomingFiltered} label={`Ajouter les ${upcomingFiltered.length} prochains matchs à mon agenda`} filename="mbl-calendrier.ics" />
          <span className="text-xs">Fichier .ics compatible Google Agenda, Outlook et iPhone ; suit les filtres choisis.</span>
        </div>
      )}
      {tab === 'favoris' && !fav.size && <EmptyState title="Aucune équipe favorite" icon={<Star />}>Touchez l’étoile à côté d’une équipe pour suivre ses matchs ici.</EmptyState>}
      {groups.length === 0 && !(tab === 'favoris' && !fav.size) && <EmptyState title="Aucun match" icon={<CalendarX />}>Aucun match ne correspond à cette sélection.</EmptyState>}
      <div className="space-y-8">
        {groups.map(([k, ms]) => (
          <section key={k}>
            <h2 className="mb-3 flex items-center gap-3 font-display text-xl font-black sm:text-2xl"><span>{k}</span><span className="h-px flex-1 bg-gradient-to-r from-white/15 to-transparent" /><span className="whitespace-nowrap text-xs font-semibold text-muted-foreground">{ms.length} match{ms.length > 1 ? 's' : ''}</span></h2>
            <div className="grid gap-2.5 md:grid-cols-2">{ms.map((m) => <MatchRow key={m.id} match={m} favorites={fav} onToggleFavorite={toggle} />)}</div>
          </section>
        ))}
      </div>
      </>}
    </div>
  )
}

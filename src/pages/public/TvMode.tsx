// Mode TV / écran géant : /tv (tous les terrains) ou /live/:terrain (un terrain — cible du QR code).
//  · Plusieurs matchs en même temps → onglets pour passer de l'un à l'autre + rotation automatique (20 s, désactivable).
//  · Match en direct : score, chrono, buteurs avec minute, cartons, stats live (tirs, tirs cadrés, arrêts, possession).
//  · Mise à jour automatique sans recharger : la page lit les mêmes données que le Match Center
//    (chaque action saisie est diffusée aux autres onglets/écrans ouverts dans le navigateur).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Maximize, Pause, Play, RotateCw, X } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useNow } from '@/hooks/useNow'
import { TeamLogo } from '@/components/league/Identity'
import { QrCode, pitchSlug } from '@/components/league/QrCode'
import { durationsFor, fmtMinute, liveLabel, possession, teamStats } from '@/lib/matchEngine'
import { matchScorers } from '@/lib/stats'
import { fmtTime, playerShort } from '@/lib/format'
import { Logo } from '@/components/layout/Logo'
import type { Match, MatchEvent, Team } from '@/types/entities'
import { cn } from '@/lib/utils'

const ROTATE_MS = 20000
const PREF = 'statfoot:tv:rotation'
const readPref = () => { try { return localStorage.getItem(PREF) !== 'off' } catch { return true } }
const writePref = (on: boolean) => { try { localStorage.setItem(PREF, on ? 'on' : 'off') } catch { /* navigation privée */ } }

export default function TvMode() {
  const { terrain } = useParams()
  const { db, settings } = useData()
  const now = useNow(1000)
  const today = new Date(now).toISOString().slice(0, 10)
  const matches = useMemo(() => {
    const sel = db.Match.filter((m) => !terrain || terrain === 'tous' || pitchSlug(m.pitch) === terrain)
    const byPitch = (a: Match, b: Match) => (a.pitch ?? '').localeCompare(b.pitch ?? '', 'fr', { numeric: true }) || (a.date ?? '').localeCompare(b.date ?? '')
    const live = sel.filter((m) => m.status === 'live').sort(byPitch)
    if (live.length) return live
    return sel.filter((m) => (m.date ?? '').slice(0, 10) === today).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  }, [db.Match, terrain, today])

  const [selected, setSelected] = useState<string | null>(null)
  const [rotate, setRotate] = useState(readPref)
  const [cycle, setCycle] = useState(0) // relance la barre de progression
  const multi = matches.length > 1
  const current = matches.find((m) => m.id === selected) ?? matches[0]
  const pick = useCallback((id: string) => { setSelected(id); setCycle((c) => c + 1) }, [])
  const step = useCallback((d: number) => {
    if (!matches.length) return
    const i = Math.max(0, matches.findIndex((m) => m.id === current?.id))
    pick(matches[(i + d + matches.length) % matches.length].id)
  }, [matches, current?.id, pick])
  useEffect(() => {
    if (!multi || !rotate) return
    const t = setTimeout(() => step(1), ROTATE_MS)
    return () => clearTimeout(t)
  }, [multi, rotate, step, cycle, current?.id])
  const toggleRotate = () => setRotate((r) => { writePref(!r); setCycle((c) => c + 1); return !r })
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
      else if (e.key.toLowerCase() === 'r') setRotate((r) => { writePref(!r); return !r })
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [step])

  const pitchName = terrain && terrain !== 'tous' ? db.Match.find((x) => pitchSlug(x.pitch) === terrain)?.pitch ?? terrain : 'Tous les terrains'
  const url = `${location.origin}/live/${terrain ?? 'tous'}`
  return (
    <div className="tv fixed inset-0 z-50 flex flex-col overflow-y-auto text-white sm:overflow-hidden" style={{ background: 'radial-gradient(ellipse 50% 45% at 8% 0%, rgba(160,210,255,.16), transparent 70%), radial-gradient(ellipse 50% 45% at 92% 0%, rgba(160,210,255,.13), transparent 70%), #020B22' }}>
      {/* barre du haut */}
      <header className="flex items-center gap-4 px-[2vw] pt-[1.6vh]">
        <Logo subtitle={settings.league_name} />
        <div className="title-caps ml-auto hidden text-[clamp(1.1rem,2.2vw,2.6rem)] text-neon sm:block">{pitchName}</div>
        <div className="num ml-auto text-[clamp(1.1rem,2.2vw,2.6rem)] text-white/80 sm:ml-0" aria-label="Heure">{fmtTime(new Date(now).toISOString())}</div>
        <div className="flex items-center gap-1">
          <button className="hidden cursor-pointer rounded-lg p-2 hover:bg-white/10 sm:block" onClick={() => document.documentElement.requestFullscreen?.()} title="Plein écran"><Maximize /></button>
          <Link to="/" className="rounded-lg p-2 hover:bg-white/10" title="Quitter"><X /></Link>
        </div>
      </header>

      {/* onglets : un par match en cours */}
      {multi && (
        <nav className="mt-[1.4vh] flex flex-wrap items-stretch gap-2 px-[2vw]" aria-label="Matchs en cours">
          <div className="scrollbar-none -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 sm:flex-wrap" role="tablist">
            {matches.map((m) => <MatchTab key={m.id} m={m} active={m.id === current?.id} onClick={() => pick(m.id)} />)}
          </div>
          <button onClick={toggleRotate} aria-pressed={rotate} className={cn('relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-xl border px-4 font-display text-[clamp(.9rem,1.2vw,1.4rem)] font-bold uppercase', rotate ? 'border-neon/60 bg-neon/15 text-white' : 'border-white/15 bg-white/5 text-white/70')}>
            {rotate ? <Pause className="size-5" /> : <Play className="size-5" />}<RotateCw className="size-5" />
            <span>Rotation {rotate ? '20 s' : 'désactivée'}</span>
            {rotate && <span key={`${cycle}-${current?.id}`} className="tv-progress absolute inset-x-0 bottom-0 h-1 origin-left bg-neon" style={{ animationDuration: `${ROTATE_MS}ms` }} />}
          </button>
        </nav>
      )}

      {current ? <Board key={current.id} m={current} now={now} /> : (
        <div className="flex flex-1 items-center justify-center text-center">
          <div><div className="title-caps text-[clamp(2rem,5vw,5rem)]">Aucun match en cours</div><p className="text-[clamp(1rem,1.6vw,1.8rem)] text-white/70">Les matchs du jour s’afficheront ici automatiquement.</p></div>
        </div>
      )}

      <footer className="flex items-end justify-between gap-4 px-[2vw] pb-[1.6vh]">
        <p className="hidden text-[clamp(.8rem,1vw,1.1rem)] text-white/50 lg:block">{multi ? '← → changer de match · R rotation' : ''}</p>
        <div className="ml-auto hidden shrink-0 items-center gap-3 rounded-2xl bg-white p-1.5 sm:flex"><QrCode value={url} size={72} /><div className="pr-2 text-xs font-bold uppercase text-night-950">Suivez<br />en direct</div></div>
      </footer>
    </div>
  )
}

function MatchTab({ m, active, onClick }: { m: Match; active: boolean; onClick: () => void }) {
  const L = useLookup()
  const h = L.team.get(m.home_team_id), a = L.team.get(m.away_team_id)
  return (
    <button role="tab" aria-selected={active} onClick={onClick}
      className={cn('flex shrink-0 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-left transition', active ? 'border-neon bg-neon/20 shadow-[0_0_30px_-8px_rgb(248_90_0/.8)]' : 'border-white/10 bg-white/5 hover:bg-white/10')}>
      <div className="leading-tight">
        <div className="flex items-center gap-2 font-display text-[clamp(.8rem,1vw,1.2rem)] font-bold uppercase tracking-wider text-white/70">
          {m.status === 'live' && <span className="size-2.5 rounded-full bg-red-500 animate-pulse-live" />}{m.pitch ?? 'Terrain'}
        </div>
        <div className="flex items-center gap-2 font-display text-[clamp(1.1rem,1.6vw,2rem)] font-black">
          <TeamLogo team={h} size={28} />{h?.short_name}
          <span className="num rounded-md bg-black/40 px-2">{m.status === 'scheduled' ? fmtTime(m.date) : `${m.home_score ?? 0}-${m.away_score ?? 0}`}</span>
          {a?.short_name}<TeamLogo team={a} size={28} />
        </div>
      </div>
    </button>
  )
}

function Board({ m, now }: { m: Match; now: number }) {
  const { db } = useData()
  const L = useLookup()
  const h = L.team.get(m.home_team_id), a = L.team.get(m.away_team_id), comp = L.competition.get(m.competition_id)
  const ls = L.live.get(m.id)
  const events = useMemo(() => db.MatchEvent.filter((e) => e.match_id === m.id), [db.MatchEvent, m.id])
  const sc = matchScorers(m, events)
  const st = teamStats(m, events, ls, now)
  const pos = possession(ls, now)
  const live = m.status === 'live'
  const label = live ? liveLabel(ls, durationsFor(m, comp), now) : m.status === 'finished' ? 'Terminé' : `Coup d’envoi ${fmtTime(m.date)}`
  const cards = (tid: string) => events.filter((e) => e.team_id === tid && (e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card'))
  const goal = useGoalFlash(m)
  return (
    <main className="relative flex flex-1 flex-col items-center px-[2vw] py-[1vh] [justify-content:safe_center] sm:min-h-0 sm:overflow-hidden">
      <div className="mb-[1vh] text-center font-display text-[clamp(.95rem,min(1.6vw,2.8vh),2rem)] font-bold uppercase tracking-[.2em] text-white/70">{comp?.name}{m.round ? ` · Journée ${m.round}` : ''}{m.pitch ? ` · ${m.pitch}` : ''}</div>
      <div className="grid w-full max-w-[92vw] grid-cols-[1fr_auto_1fr] items-center gap-[2vw]">
        <TeamSide team={h} />
        <div className="flex flex-col items-center">
          <div className="num flex items-center leading-none text-[clamp(4.5rem,min(13vw,21vh),16rem)]" aria-live="polite" aria-label={`Score ${m.home_score ?? 0} à ${m.away_score ?? 0}`}>
            <span>{m.home_score ?? 0}</span><span className="mx-[1.6vw] inline-block h-[.09em] w-[.32em] rounded-full bg-white/35" aria-hidden /><span>{m.away_score ?? 0}</span>
          </div>
          <div className={cn('mt-[1vh] rounded-full px-[1.6vw] py-[.4vh] font-display text-[clamp(1.3rem,min(2.8vw,5vh),3.4rem)] font-black uppercase', live ? 'bg-red-600 text-white' : 'bg-white/10')}>
            {live && <span className="mr-3 inline-block size-[.5em] rounded-full bg-white align-middle animate-pulse-live" />}{label}
          </div>
        </div>
        <TeamSide team={a} />
      </div>

      {/* buteurs / cartons de chaque équipe, stats live au centre */}
      <div className="mt-[2vh] grid w-full max-w-[94vw] grid-cols-2 items-start gap-x-[5vw] gap-y-4 sm:grid-cols-[1fr_minmax(0,1.25fr)_1fr] sm:gap-[3vw]">
        <Timeline goals={sc.home} cards={cards(m.home_team_id)} align="right" className="sm:col-start-1 sm:row-start-1" />
        {(live || m.status === 'finished') ? (
          <div className="col-span-2 row-start-1 grid gap-[.9vh] sm:col-span-1 sm:col-start-2">
            <StatBar label="Tirs" h={st.home.shots} a={st.away.shots} hc={h?.primary_color} ac={a?.primary_color} />
            <StatBar label="Tirs cadrés" h={st.home.shots_on_target} a={st.away.shots_on_target} hc={h?.primary_color} ac={a?.primary_color} />
            <StatBar label="Arrêts" h={st.home.saves} a={st.away.saves} hc={h?.primary_color} ac={a?.primary_color} />
            {ls && <StatBar label="Possession" h={pos.home_pct} a={pos.away_pct} hc={h?.primary_color} ac={a?.primary_color} unit="%" />}
          </div>
        ) : <div className="hidden sm:block" />}
        <Timeline goals={sc.away} cards={cards(m.away_team_id)} align="left" className="sm:col-start-3 sm:row-start-1" />
      </div>
      {goal && <GoalFlash team={L.team.get(goal)} />}
    </main>
  )
}

function TeamSide({ team }: { team?: Team }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-[1.2vh] text-center">
      <div className="aspect-square w-[clamp(3.5rem,min(11vw,15vh),13rem)]"><TeamLogo team={team} size={220} className="!size-full" /></div>
      <div className="title-caps line-clamp-2 max-w-full text-[clamp(1.3rem,min(3vw,5vh),3.8rem)] leading-[.95]">{team?.name}</div>
    </div>
  )
}

/** Buteurs et cartons d'une équipe : une ligne par joueur et par type (⚽×2 12' 30'), 7 lignes au plus. */
function Timeline({ goals, cards, align, className }: { goals: MatchEvent[]; cards: MatchEvent[]; align: 'left' | 'right'; className?: string }) {
  const L = useLookup()
  const name = (e: MatchEvent) => (e.player_id ? playerShort(L.player.get(e.player_id)) : e.player_name_free ?? 'Joueur')
  const order = (e: MatchEvent) => ['1H', '2H', 'ET1', 'ET2'].indexOf(e.period ?? '1H') * 1000 + (e.minute ?? 0)
  const groups = new Map<string, { icon: string; label: string; events: MatchEvent[] }>()
  for (const e of [...goals, ...cards].sort((x, y) => order(x) - order(y))) {
    const icon = e.type === 'goal' || e.type === 'own_goal' ? '⚽' : e.type === 'yellow_card' ? '🟨' : '🟥'
    const k = `${icon}|${e.player_id ?? e.player_name_free ?? e.id}|${e.type === 'own_goal'}`
    if (!groups.has(k)) groups.set(k, { icon, label: `${name(e)}${e.type === 'own_goal' ? ' (csc)' : ''}`, events: [] })
    groups.get(k)!.events.push(e)
  }
  const rows = [...groups.values()]
  const shown = rows.slice(0, 7)
  return (
    <ul className={cn(className, 'min-w-0 space-y-[.5vh] text-[clamp(.95rem,min(1.6vw,2.8vh),2rem)] font-semibold', align === 'right' ? 'text-right' : 'text-left')}>
      {shown.map((g, i) => {
        const mins = g.events.map((e) => fmtMinute(e.minute, e.added_minute) + (e.goal_kind === 'penalty' ? ' pén.' : '')).filter((x) => x.trim())
        return (
          <li key={i} className={cn('flex items-baseline gap-[.6vw]', align === 'right' && 'flex-row-reverse')}>
            <span aria-hidden>{g.icon}{g.events.length > 1 && <span className="num text-[.8em]">×{g.events.length}</span>}</span>
            <span className="min-w-0 truncate">{g.label}</span>
            {mins.length > 0 && <span className="num shrink-0 text-neon">{mins.join(' ')}</span>}
          </li>
        )
      })}
      {rows.length > shown.length && <li className="text-white/60">+ {rows.length - shown.length} autres</li>}
    </ul>
  )
}

function StatBar({ label, h, a, hc = '#F85A00', ac = '#6CB4CC', unit = '' }: { label: string; h: number; a: number; hc?: string; ac?: string; unit?: string }) {
  const total = h + a
  const hp = total ? (h / total) * 100 : 50
  return (
    <div>
      <div className="flex items-baseline justify-between font-display font-black">
        <span className="num text-[clamp(1.2rem,min(2.4vw,4vh),3rem)]">{h}{unit}</span>
        <span className="text-[clamp(.85rem,min(1.2vw,2.1vh),1.5rem)] uppercase tracking-[.18em] text-white/75">{label}</span>
        <span className="num text-[clamp(1.2rem,min(2.4vw,4vh),3rem)]">{a}{unit}</span>
      </div>
      <div className="mt-1 flex h-[clamp(8px,1.1vh,16px)] gap-1 overflow-hidden rounded-full">
        <div className="tv-bar rounded-full" style={{ width: `${hp}%`, background: hc }} />
        <div className="tv-bar rounded-full" style={{ width: `${100 - hp}%`, background: ac }} />
      </div>
    </div>
  )
}

/** Affiche « BUT ! » quelques secondes quand le score d'une équipe augmente. */
function useGoalFlash(m: Match) {
  const last = useRef<{ id: string; h: number; a: number } | null>(null)
  const [team, setTeam] = useState<string | null>(null)
  useEffect(() => {
    const h = m.home_score ?? 0, a = m.away_score ?? 0
    const p = last.current
    last.current = { id: m.id, h, a }
    if (!p || p.id !== m.id || m.status !== 'live') return
    const scorer = h > p.h ? m.home_team_id : a > p.a ? m.away_team_id : null
    if (!scorer) return
    setTeam(scorer)
    const t = setTimeout(() => setTeam(null), 5000)
    return () => clearTimeout(t)
  }, [m.id, m.home_score, m.away_score, m.status, m.home_team_id, m.away_team_id])
  return team
}

function GoalFlash({ team }: { team?: Team }) {
  return (
    <div className="tv-goal pointer-events-none fixed inset-0 z-10 flex items-center justify-center" role="status">
      <div className="flex items-center gap-[2vw] rounded-[3vw] px-[4vw] py-[2vh] shadow-2xl" style={{ background: `linear-gradient(135deg, ${team?.primary_color ?? '#F85A00'}, #04163D)` }}>
        <div className="aspect-square w-[clamp(4rem,10vw,12rem)]"><TeamLogo team={team} size={160} className="!size-full" /></div>
        <div className="title-caps text-[clamp(4rem,12vw,14rem)] leading-none">But !</div>
      </div>
    </div>
  )
}

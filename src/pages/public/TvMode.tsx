// Mode TV / écran géant : /live/:terrain (ou /tv pour tous les terrains). Rotation automatique entre les matchs.
// Même page = cible du QR code par terrain pour les spectateurs (responsive).
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Maximize, X } from 'lucide-react'
import { useData, useLookup } from '@/hooks/useData'
import { useNow } from '@/hooks/useNow'
import { TeamLogo } from '@/components/league/Identity'
import { QrCode, pitchSlug } from '@/components/league/QrCode'
import { durationsFor, fmtMinute, liveLabel, possession } from '@/lib/matchEngine'
import { matchScorers } from '@/lib/stats'
import { fmtTime } from '@/lib/format'
import { Logo } from '@/components/layout/Logo'
import type { Match } from '@/types/entities'

export default function TvMode() {
  const { terrain } = useParams()
  const { db, settings } = useData()
  const now = useNow(1000)
  const today = new Date().toISOString().slice(0, 10)
  const matches = useMemo(() => {
    const sel = db.Match.filter((m) => !terrain || terrain === 'tous' || pitchSlug(m.pitch) === terrain)
    const live = sel.filter((m) => m.status === 'live')
    if (live.length) return live
    return sel.filter((m) => (m.date ?? '').slice(0, 10) === today).sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  }, [db.Match, terrain, today])
  const [idx, setIdx] = useState(0)
  useEffect(() => { const t = setInterval(() => setIdx((i) => i + 1), 12000); return () => clearInterval(t) }, [])
  const m = matches.length ? matches[idx % matches.length] : undefined
  const pitchName = terrain && terrain !== 'tous' ? db.Match.find((x) => pitchSlug(x.pitch) === terrain)?.pitch ?? terrain : 'Tous les terrains'
  const url = `${location.origin}/live/${terrain ?? 'tous'}`
  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-night-950 p-4 sm:p-8" style={{ background: 'radial-gradient(ellipse 50% 50% at 10% 0%, rgba(160,210,255,.18), transparent 70%), radial-gradient(ellipse 50% 50% at 90% 0%, rgba(160,210,255,.15), transparent 70%), #04163D' }}>
      <div className="flex items-center justify-between">
        <Logo subtitle={settings.league_name} />
        <div className="title-caps text-xl text-neon sm:text-3xl">{pitchName}</div>
        <div className="flex items-center gap-2">
          <button className="hidden rounded-lg p-2 hover:bg-white/10 sm:block cursor-pointer" onClick={() => document.documentElement.requestFullscreen?.()} title="Plein écran"><Maximize /></button>
          <Link to="/" className="rounded-lg p-2 hover:bg-white/10" title="Quitter"><X /></Link>
        </div>
      </div>
      {m ? <Board m={m} now={now} /> : <div className="flex flex-1 items-center justify-center text-center"><div><div className="title-caps text-4xl">Aucun match en cours</div><p className="text-muted-foreground">Les matchs du jour s'afficheront ici automatiquement.</p></div></div>}
      <div className="flex items-end justify-between gap-4">
        <div className="flex gap-2 overflow-x-auto">{matches.map((x, i) => <MiniScore key={x.id} m={x} active={x.id === m?.id} onClick={() => setIdx(i)} />)}</div>
        <div className="hidden shrink-0 items-center gap-3 rounded-2xl bg-white p-2 sm:flex"><QrCode value={url} size={96} /><div className="pr-2 text-xs font-bold uppercase text-night-950">Suivez<br />en direct</div></div>
      </div>
    </div>
  )
}

function Board({ m, now }: { m: Match; now: number }) {
  const { db } = useData()
  const L = useLookup()
  const h = L.team.get(m.home_team_id), a = L.team.get(m.away_team_id), comp = L.competition.get(m.competition_id)
  const ls = L.live.get(m.id)
  const sc = matchScorers(m, db.MatchEvent)
  const pos = possession(ls, now)
  const label = m.status === 'live' ? liveLabel(ls, durationsFor(m, comp), now) : m.status === 'finished' ? 'Terminé' : fmtTime(m.date)
  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="mb-4 text-center font-display text-lg font-bold uppercase tracking-widest text-muted-foreground sm:text-2xl">{comp?.name} · Journée {m.round}</div>
      <div className="grid w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex flex-col items-center gap-3 text-center"><TeamLogo team={h} size={180} className="size-24 sm:size-44" /><div className="title-caps text-2xl sm:text-5xl">{h?.name}</div></div>
        <div className="flex flex-col items-center">
          <div className="num text-[22vw] leading-none sm:text-[12vw]">{m.home_score ?? 0}<span className="text-white/30">-</span>{m.away_score ?? 0}</div>
          <div className={`mt-2 rounded-full px-5 py-1 font-display text-xl font-black uppercase sm:text-3xl ${m.status === 'live' ? 'bg-red-500 text-white' : 'bg-white/10'}`}>{label}</div>
        </div>
        <div className="flex flex-col items-center gap-3 text-center"><TeamLogo team={a} size={180} className="size-24 sm:size-44" /><div className="title-caps text-2xl sm:text-5xl">{a?.name}</div></div>
      </div>
      <div className="mt-6 grid w-full max-w-5xl grid-cols-2 gap-10 text-base sm:text-2xl">
        <div className="text-right">{sc.home.map((e) => <div key={e.id}>⚽ {L.player.get(e.player_id ?? '')?.last_name} {fmtMinute(e.minute, e.added_minute)}</div>)}</div>
        <div>{sc.away.map((e) => <div key={e.id}>⚽ {L.player.get(e.player_id ?? '')?.last_name} {fmtMinute(e.minute, e.added_minute)}</div>)}</div>
      </div>
      {ls && m.status === 'live' && (
        <div className="mt-6 w-full max-w-3xl">
          <div className="flex justify-between font-display text-xl font-bold"><span>{pos.home_pct}%</span><span className="text-sm uppercase text-muted-foreground">Possession</span><span>{pos.away_pct}%</span></div>
          <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-white/10"><div style={{ width: `${pos.home_pct}%`, background: h?.primary_color }} /><div style={{ width: `${pos.away_pct}%`, background: a?.primary_color }} /></div>
        </div>
      )}
    </div>
  )
}

function MiniScore({ m, active, onClick }: { m: Match; active: boolean; onClick: () => void }) {
  const L = useLookup()
  return (
    <button onClick={onClick} className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm cursor-pointer ${active ? 'bg-neon/20 ring-1 ring-neon' : 'bg-white/5'}`}>
      {m.status === 'live' && <span className="size-2 rounded-full bg-red-500 animate-pulse-live" />}
      <span className="font-display font-bold">{L.team.get(m.home_team_id)?.short_name}</span><span className="num">{m.status === 'scheduled' ? fmtTime(m.date) : `${m.home_score}-${m.away_score}`}</span><span className="font-display font-bold">{L.team.get(m.away_team_id)?.short_name}</span>
    </button>
  )
}

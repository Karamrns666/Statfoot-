// Match des capitaines : écusson, carte de match + feuille détaillée, bloc « prochain match » (accueil).
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Image as ImageIcon, MapPin, Star } from 'lucide-react'
import { VisualShareDialog } from '@/components/visuals/VisualShareDialog'
import { captainResultModel } from '@/lib/visuals/captain'
import { configFromSettings } from '@/lib/visuals'
import { canvasToPng, renderResult } from '@/lib/visuals/render'
import { LEAGUE } from '@/config/league'
import { useData, useLookup } from '@/hooks/useData'
import { useNow } from '@/hooks/useNow'
import { useCaptains } from '@/hooks/useCaptains'
import { CAPTAIN_COLORS, CAPTAIN_SIDES, captainLogo, captainScore, isFinished, lastCaptainMatch, nextCaptainMatch, shootoutWinner } from '@/lib/captains'
import { countdown } from '@/lib/ics'
import { fmtDate, playerName } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CaptainMatch, CaptainSide, CaptainTeam } from '@/types/entities'

export function CaptainCrest({ team, size = 48, className }: { team: CaptainTeam; size?: number; className?: string }) {
  return <img src={captainLogo(team)} alt={team.name} width={size} height={size} className={cn('shrink-0 object-contain drop-shadow-[0_4px_10px_rgb(0_0_0/.4)]', className)} style={{ width: size, height: size }} />
}

const sideColor = (t: CaptainTeam) => t.color ?? CAPTAIN_COLORS[t.side]

export function CaptainScoreLine({ m, teams, big }: { m: CaptainMatch; teams: Record<CaptainSide, CaptainTeam>; big?: boolean }) {
  const s = captainScore(m)
  const so = shootoutWinner(m)
  const done = isFinished(m)
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
      <div className="flex min-w-0 flex-col-reverse items-center gap-1 text-center sm:flex-row sm:justify-end sm:gap-2 sm:text-right"><span className={cn('max-w-full font-display font-black uppercase leading-none [overflow-wrap:anywhere] sm:truncate', big ? 'text-lg sm:text-4xl' : 'text-sm sm:text-xl')} style={{ color: sideColor(teams.orange) }}>{teams.orange.name}</span><CaptainCrest team={teams.orange} size={big ? 64 : 36} /></div>
      <div className="text-center">
        <div className={cn('num font-black leading-none', big ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl')}>{done ? `${s.orange} - ${s.bleue}` : 'vs'}</div>
        {done && m.orange_pens != null && m.bleue_pens != null && <div className="mt-0.5 text-xs font-bold text-muted-foreground">t.a.b. {m.orange_pens}-{m.bleue_pens}{so && ` · ${teams[so].name}`}</div>}
      </div>
      <div className="flex min-w-0 flex-col items-center gap-1 text-center sm:flex-row sm:gap-2 sm:text-left"><CaptainCrest team={teams.bleue} size={big ? 64 : 36} /><span className={cn('max-w-full font-display font-black uppercase leading-none [overflow-wrap:anywhere] sm:truncate', big ? 'text-lg sm:text-4xl' : 'text-sm sm:text-xl')} style={{ color: sideColor(teams.bleue) }}>{teams.bleue.name}</span></div>
    </div>
  )
}

/** Feuille de match : buteurs, passeurs, cartons, gardiens, homme du match */
export function CaptainSheet({ m, teams }: { m: CaptainMatch; teams: Record<CaptainSide, CaptainTeam> }) {
  const L = useLookup()
  const name = (id: string) => playerName(L.player.get(id))
  const motm = m.motm_player_id ? L.player.get(m.motm_player_id) : undefined
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {CAPTAIN_SIDES.map((side) => {
          const lines = m.lines.filter((l) => l.side === side)
          const ogFor = m.lines.filter((l) => l.side !== side && l.og > 0)
          return (
            <div key={side} className="rounded-xl border border-white/10 p-3" style={{ borderTop: `3px solid ${sideColor(teams[side])}` }}>
              <div className="mb-2 text-sm font-bold" style={{ color: sideColor(teams[side]) }}>{teams[side].name}</div>
              <ul className="space-y-1 text-sm">
                {lines.filter((l) => l.goals || l.assists || l.yc || l.rc).map((l) => (
                  <li key={l.player_id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{name(l.player_id)}</span>
                    <span className="flex shrink-0 items-center gap-1">
                      {Array.from({ length: l.yc }).map((_, i) => <span key={`y${i}`} className="inline-block h-3.5 w-2.5 rounded-[2px] bg-yellow-400" aria-label="Carton jaune" />)}
                      {Array.from({ length: l.rc }).map((_, i) => <span key={`r${i}`} className="inline-block h-3.5 w-2.5 rounded-[2px] bg-red-500" aria-label="Carton rouge" />)}
                      {l.goals > 0 && <span aria-label={`${l.goals} but(s)`}>{'⚽'.repeat(Math.min(l.goals, 8))}</span>}
                      {l.assists > 0 && <span className="text-xs text-muted-foreground">{l.assists} pd</span>}
                    </span>
                  </li>
                ))}
                {ogFor.map((l) => <li key={`og${l.player_id}`} className="flex justify-between gap-2 text-muted-foreground"><span>(C.S.C) {name(l.player_id)}</span><span>{'⚽'.repeat(l.og)}</span></li>)}
                {lines.filter((l) => l.gk).map((l) => <li key={`gk${l.player_id}`} className="flex justify-between gap-2 text-muted-foreground"><span>Gardien : {name(l.player_id)}</span><span>{l.saves} arrêt{l.saves > 1 ? 's' : ''}</span></li>)}
                {!lines.some((l) => l.goals || l.assists || l.yc || l.rc || l.gk) && !ogFor.length && <li className="text-muted-foreground">—</li>}
              </ul>
            </div>
          )
        })}
      </div>
      {motm && <p className="flex items-center gap-1.5 text-sm"><Star className="size-4 text-award-gold" />Homme du match : <Link to={`/joueurs/${motm.id}`} className="font-bold hover:text-neon">{playerName(motm)}</Link></p>}
      {m.notes && <p className="text-sm text-muted-foreground">{m.notes}</p>}
    </div>
  )
}

export function CaptainMatchCard({ m, teams, defaultOpen = false }: { m: CaptainMatch; teams: Record<CaptainSide, CaptainTeam>; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const done = isFinished(m)
  return (
    <article className="glass rounded-2xl p-4">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="capitalize">{fmtDate(m.date, "EEEE d MMMM 'à' HH:mm")}</span>{m.pitch && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{m.pitch}</span>}
        {!done && <span className="rounded-full bg-neon/15 px-2 py-0.5 font-bold text-neon">{m.status === 'cancelled' ? 'Annulé' : 'À venir'}</span>}
      </div>
      <CaptainScoreLine m={m} teams={teams} />
      {done && (
        <>
          <div className="mt-3 flex items-center justify-center gap-4">
            <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="tap flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-neon">Feuille de match<ChevronDown className={cn('size-4 transition', open && 'rotate-180')} /></button>
            <CaptainVisualButton m={m} teams={teams} />
          </div>
          {open && <div className="mt-3"><CaptainSheet m={m} teams={teams} /></div>}
        </>
      )}
    </article>
  )
}

/** Visuel résultat Orange contre Bleue (même système que les visuels de la ligue) */
export function CaptainVisualButton({ m, teams, label = 'Visuel' }: { m: CaptainMatch; teams: Record<CaptainSide, CaptainTeam>; label?: string }) {
  const { league, settings } = useData()
  const [open, setOpen] = useState(false)
  const s = captainScore(m)
  const render = async () => {
    const players = new Map(league.players.map((p) => [p.id, p]))
    return canvasToPng(await renderResult(captainResultModel(m, teams, players), configFromSettings(settings), { leagueLogo: LEAGUE.logo }))
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className="tap flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-neon"><ImageIcon className="size-3.5" />{label}</button>
      {open && <VisualShareDialog open={open} onOpenChange={setOpen} title="Match des capitaines" description="Visuel 1080 × 1080 aux couleurs officielles." fileName={`mbl-capitaines-${m.date.slice(0, 10)}.png`}
        caption={`⚔️ MATCH DES CAPITAINES | ${teams.orange.name} ${s.orange} - ${s.bleue} ${teams.bleue.name}\n#MoroccoBusinessLeague #MBL`} render={render} />}
    </>
  )
}

/** Accueil : prochain Match des capitaines avec compte à rebours (+ dernier résultat). */
export function NextCaptainBlock() {
  const { teams, matches } = useCaptains()
  const now = useNow(1000)
  const next = nextCaptainMatch(matches, new Date(now))
  const last = lastCaptainMatch(matches)
  if (!next && !last) return null
  const c = next ? countdown(next.date, now) : null
  return (
    <section aria-labelledby="capitaines-titre" className="relative overflow-hidden rounded-3xl border border-white/10 p-5 sm:p-7" style={{ background: `linear-gradient(110deg, ${sideColor(teams.orange)}33, transparent 45%, transparent 55%, ${sideColor(teams.bleue)}33), linear-gradient(180deg,#0D2B66,#04163D)` }}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div><h2 id="capitaines-titre" className="title-caps text-2xl sm:text-3xl">{next ? 'Prochain match des capitaines' : 'Match des capitaines'}</h2><p className="text-xs text-muted-foreground">Mini-tournoi mensuel hors championnat · ne compte pas au classement</p></div>
        <Link to="/match-des-capitaines" className="text-sm font-semibold text-neon hover:underline">Tout le tournoi</Link>
      </div>
      {next ? (
        <div className="space-y-4">
          <CaptainScoreLine m={next} teams={teams} big />
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <span className="capitalize text-muted-foreground">{fmtDate(next.date, "EEEE d MMMM 'à' HH:mm")}</span>{next.pitch && <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="size-3.5" />{next.pitch}</span>}
            {c && <span className="num rounded-lg bg-neon px-3 py-1 text-lg text-white" aria-label="Temps restant avant le coup d'envoi">{c.d ? `${c.d} j ${String(c.h).padStart(2, '0')} h ${String(c.m).padStart(2, '0')}` : `${String(c.h).padStart(2, '0')}:${String(c.m).padStart(2, '0')}:${String(c.s).padStart(2, '0')}`}</span>}
          </div>
          {last && <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground"><span>Dernier résultat : {teams.orange.name} {captainScore(last).orange} - {captainScore(last).bleue} {teams.bleue.name}</span><CaptainVisualButton m={last} teams={teams} label="Voir le visuel" /></div>}
        </div>
      ) : last && <div className="space-y-3"><CaptainScoreLine m={last} teams={teams} big /><div className="flex justify-center"><CaptainVisualButton m={last} teams={teams} label="Voir le visuel" /></div></div>}
    </section>
  )
}

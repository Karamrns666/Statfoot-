// Tirage au sort de la journée 1 — mode projection (écran 16:9, plein écran).
// L'ordre est déjà fixé (graine enregistrée, rejouable) : la projection le DÉVOILE équipe par équipe.
// Clavier : Espace / Entrée / → = équipe suivante · ← = annuler la dernière · A = automatique · F = plein écran · Échap = fermer.
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, X } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useLookup } from '@/hooks/useData'
import { useLeague } from '@/hooks/useLeague'
import { TeamLogo } from '@/components/league/Identity'
import { cn } from '@/lib/utils'
import type { Competition } from '@/types/entities'

export function DrawProjection({ comp, seasonName, onClose }: { comp: Competition; seasonName: string; onClose: () => void }) {
  const L = useLookup()
  const league = useLeague()
  const ps = comp.preseason ?? {}
  const order = ps.draw_order ?? []
  const [n, setN] = useState(Math.min(ps.revealed ?? 0, order.length))
  const [auto, setAuto] = useState(false)
  const [spin, setSpin] = useState<string | null>(null)
  const [full, setFull] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const persist = (v: number) => base44.entities.Competition.update(comp.id, { preseason: { ...(comp.preseason ?? {}), revealed: v } })

  const next = useCallback(() => {
    if (spin || n >= order.length) return
    const target = order[n]
    const done = () => { setSpin(null); setN(n + 1); persist(n + 1) }
    if (reduce) return done()
    // brassage : les logos des équipes encore dans l'urne défilent puis s'arrêtent sur l'équipe tirée
    const pool = order.slice(n)
    let i = 0
    const tick = () => {
      i++
      setSpin(i > 14 ? target : pool[Math.floor(Math.random() * pool.length)])
      if (i <= 14) window.setTimeout(tick, 40 + i * 9)
      else window.setTimeout(done, 650)
    }
    tick()
  }, [n, order, spin, reduce]) // eslint-disable-line react-hooks/exhaustive-deps
  const prev = () => { if (!spin && n > 0) { setN(n - 1); persist(n - 1) } }
  const toggleFull = async () => {
    try { if (!document.fullscreenElement) { await root.current?.requestFullscreen(); setFull(true) } else { await document.exitFullscreen(); setFull(false) } } catch { /* plein écran refusé */ }
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key.toLowerCase() === 'a') setAuto((a) => !a)
      else if (e.key.toLowerCase() === 'f') toggleFull()
      else if (e.key === 'Escape' && !document.fullscreenElement) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })
  useEffect(() => { if (!auto) return; if (n >= order.length) { setAuto(false); return } const t = window.setTimeout(next, spin ? 400 : 1600); return () => window.clearTimeout(t) }, [auto, n, spin, next, order.length])
  useEffect(() => { const f = () => setFull(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f) }, [])

  const matches = Math.floor(order.length / 2)
  const restSlot = order.length % 2 === 1
  const current = spin ?? (n > 0 ? order[n - 1] : undefined)
  const curTeam = current ? L.team.get(current) : undefined
  const matchOf = (i: number) => Math.floor(i / 2) + 1
  const isRest = (i: number) => restSlot && i === order.length - 1
  const caption = !current ? 'Prêt pour le tirage' : spin && spin !== order[n] ? 'Tirage en cours…' : isRest(spin ? n : n - 1) ? 'Au repos — jouera au rattrapage' : `Match ${matchOf(spin ? n : n - 1)} · équipe ${(spin ? n : n - 1) % 2 ? 'B' : 'A'}`
  const finished = n >= order.length

  return (
    <div ref={root} className="fixed inset-0 z-[70] flex flex-col overflow-hidden text-white" style={{ background: 'radial-gradient(ellipse 55% 45% at 28% 35%, rgb(240 90 34 / .28), transparent 70%), radial-gradient(ellipse 60% 60% at 90% 0%, rgb(31 111 224 / .35), transparent 70%), linear-gradient(160deg, #0B2E73 0%, #04163D 60%, #020B22 100%)' }} role="dialog" aria-label="Tirage au sort de la journée 1">
      {/* bandeau */}
      <header className="flex items-center gap-4 border-b border-white/10 px-[2.5vw] py-[1.6vh]">
        <img src={league.logo} alt="" className="h-[6vh] w-auto" />
        <div className="min-w-0 flex-1">
          <div className="title-caps truncate text-[clamp(18px,2.6vw,46px)] leading-none">Tirage au sort · <span className="text-[#F05A22]">Journée 1</span></div>
          <div className="mt-1 truncate text-[clamp(11px,1vw,18px)] text-white/70">Pré-saison {seasonName.replace(/^Saison /, '')} · système suisse · {order.length} équipes · {matches} matchs{restSlot ? ' · 1 équipe au repos' : ''}</div>
        </div>
        <div className="num text-[clamp(20px,3vw,56px)] font-black">{n}<span className="text-white/40"> / {order.length}</span></div>
        <div className="flex gap-1">
          <button onClick={toggleFull} className="cursor-pointer rounded-lg p-2 hover:bg-white/10" aria-label={full ? 'Quitter le plein écran' : 'Plein écran'} title="Plein écran (F)">{full ? <Minimize2 /> : <Maximize2 />}</button>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-2 hover:bg-white/10" aria-label="Fermer la projection" title="Fermer (Échap)"><X /></button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-[2vw] px-[2.5vw] py-[2.5vh] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* scène */}
        <section className="flex min-h-0 flex-col items-center justify-center text-center" aria-live="polite">
          {current ? (
            <>
              <div className={cn('rounded-[2rem] bg-white p-[2.2vh] shadow-[0_30px_80px_-20px_rgb(0_0_0/.7)] transition-transform', spin && spin !== order[n] ? 'scale-95 opacity-90' : 'scale-100')}>
                <TeamLogo team={curTeam} size={300} className="!size-[clamp(120px,28vh,320px)] !shadow-none !ring-0" />
              </div>
              <div className="title-caps mt-[3vh] text-[clamp(28px,4.6vw,88px)] leading-[.95]">{curTeam?.name}</div>
              <div className={cn('mt-[1.6vh] rounded-full px-5 py-1.5 font-display text-[clamp(14px,1.5vw,28px)] font-bold uppercase', caption.startsWith('Au repos') ? 'bg-white/15 text-white' : 'bg-[#F05A22] text-white')}>{caption}</div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-[3vh]">
              <img src={league.logo} alt="" className="h-[26vh] w-auto opacity-90" />
              <div className="title-caps text-[clamp(26px,3.4vw,64px)]">Prêt pour le tirage</div>
              <div className="text-[clamp(13px,1.2vw,22px)] text-white/70">Appuyez sur Espace pour tirer la première équipe</div>
            </div>
          )}
          {finished && <div className="mt-[3vh] title-caps text-[clamp(18px,2vw,36px)] text-[#7CE3A4]">Tirage terminé</div>}
        </section>

        {/* tableau des matchs */}
        <section className="grid min-h-0 auto-rows-fr grid-cols-1 gap-[1vh] sm:grid-cols-2" aria-label="Matchs de la journée 1">
          {Array.from({ length: matches }, (_, k) => {
            const a = order[k * 2], b = order[k * 2 + 1]
            const shownA = k * 2 < n, shownB = k * 2 + 1 < n
            const active = !finished && (k * 2 === n || k * 2 + 1 === n)
            return (
              <div key={k} className={cn('flex min-h-0 items-center gap-[0.8vw] rounded-2xl border px-[1vw] py-[0.6vh] transition', active ? 'border-[#F05A22] bg-[#F05A22]/15' : shownB ? 'border-white/15 bg-white/[.07]' : 'border-white/10 bg-white/[.03]')}>
                <span className="num w-[2.2vw] min-w-6 shrink-0 text-center text-[clamp(12px,1.2vw,22px)] font-black text-white/45">{k + 1}</span>
                <Slot id={shownA ? a : undefined} />
                <span className="font-display text-[clamp(11px,1vw,18px)] font-black text-[#F05A22]">VS</span>
                <Slot id={shownB ? b : undefined} right />
              </div>
            )
          })}
          {restSlot && (
            <div className={cn('flex min-h-0 items-center gap-[0.8vw] rounded-2xl border border-dashed px-[1vw] py-[0.6vh]', n === order.length ? 'border-white/40 bg-white/10' : 'border-white/15')}>
              <span className="shrink-0 font-display text-[clamp(11px,1vw,18px)] font-black uppercase text-white/60">Au repos</span>
              <Slot id={n === order.length ? order[order.length - 1] : undefined} />
            </div>
          )}
        </section>
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-white/10 px-[2.5vw] py-[1.4vh] text-[clamp(10px,0.85vw,15px)] text-white/60">
        <span>{ps.draw_source === 'manual' ? 'Tirage au sort officiel (saisie manuelle)' : <>Tirage enregistré le {ps.drawn_at ? new Date(ps.drawn_at).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }) : '—'} · graine {ps.seed ?? '—'} · rejouable à l’identique</>}</span>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={prev} disabled={!n || !!spin} className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-white hover:bg-white/10 disabled:opacity-40"><ChevronLeft className="size-4" />Annuler</button>
          <button onClick={() => setAuto((a) => !a)} disabled={finished} className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-white hover:bg-white/10 disabled:opacity-40">{auto ? <Pause className="size-4" /> : <Play className="size-4" />}{auto ? 'Pause' : 'Automatique'}</button>
          <button onClick={next} disabled={finished || !!spin} className="flex cursor-pointer items-center gap-1 rounded-lg bg-[#F05A22] px-4 py-1.5 font-bold text-white hover:brightness-110 disabled:opacity-40">Équipe suivante<ChevronRight className="size-4" /></button>
        </div>
      </footer>
    </div>
  )

  function Slot({ id, right }: { id?: string; right?: boolean }) {
    const t = id ? L.team.get(id) : undefined
    return (
      <div className={cn('flex min-w-0 flex-1 items-center gap-[0.6vw]', right && 'flex-row-reverse text-right')}>
        {t ? <TeamLogo team={t} size={40} className="!size-[clamp(22px,3.6vh,44px)]" /> : <span className="size-[clamp(22px,3.6vh,44px)] shrink-0 rounded-[22%] border border-dashed border-white/20" />}
        <span className={cn('line-clamp-2 min-w-0 break-words font-display text-[clamp(11px,1.12vw,22px)] font-black uppercase leading-[1.02]', !t && 'text-white/25')}>{t?.name ?? '· · ·'}</span>
      </div>
    )
  }
}

// Infobulles au survol (souris) ou au toucher (mobile) :
//  • InfoTip : bouton « i » relié au glossaire (texte de src/lib/glossary.ts, source unique) ;
//  • AdjustmentMark : icône « ajustement Ardentia » sur un classement, avec le détail des décisions.
import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Gavel } from 'lucide-react'
import { glossary, type GlossaryId } from '@/lib/glossary'
import { adjustmentLabel } from '@/lib/adjustments'
import type { StandingAdjustment } from '@/types/entities'
import { cn } from '@/lib/utils'

function TipButton({ ariaLabel, className, children, content }: { ariaLabel: string; className?: string; children: ReactNode; content: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0, up: false })
  const btn = useRef<HTMLButtonElement>(null)
  const tipId = useId()
  const show = () => {
    const r = btn.current?.getBoundingClientRect(); if (!r) return
    const up = r.bottom + 8 > innerHeight - 170
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 150), innerWidth - 150), y: up ? r.top - 8 : r.bottom + 8, up }); setOpen(true)
  }
  useEffect(() => {
    if (!open) return
    const close = (e: Event) => { if (!(e.target as Element)?.closest?.(`[data-tip="${tipId}"]`)) setOpen(false) }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const hide = () => setOpen(false)
    addEventListener('pointerdown', close); addEventListener('scroll', hide, true); addEventListener('keydown', esc)
    return () => { removeEventListener('pointerdown', close); removeEventListener('scroll', hide, true); removeEventListener('keydown', esc) }
  }, [open, tipId])
  const stop = (e: MouseEvent) => { e.stopPropagation(); e.preventDefault() }
  return (
    <>
      <button ref={btn} type="button" data-tip={tipId} aria-label={ariaLabel} aria-expanded={open} aria-describedby={open ? tipId : undefined}
        onClick={(e) => { stop(e); show() }} onMouseEnter={show} onMouseLeave={(e) => { if (!(e.relatedTarget as Element)?.closest?.(`[data-tip="${tipId}"]`)) setOpen(false) }} onFocus={show} onBlur={() => setOpen(false)}
        className={cn('relative inline-flex shrink-0 cursor-help items-center justify-center align-middle leading-none transition before:absolute before:-inset-[16px] before:content-[""]', className)}>
        {children}
      </button>
      {open && createPortal(
        <div id={tipId} role="tooltip" data-tip={tipId} onMouseLeave={() => setOpen(false)}
          className="fixed z-[100] w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-white/15 bg-night-950/95 p-3 text-left text-[13px] font-normal normal-case leading-snug tracking-normal text-white shadow-2xl backdrop-blur"
          style={{ left: pos.x, top: pos.y, transform: `translate(-50%, ${pos.up ? '-100%' : '0'})` }}>
          {content(() => setOpen(false))}
        </div>, document.body)}
    </>
  )
}

export function InfoTip({ id, className, label }: { id: GlossaryId; className?: string; label?: string }) {
  const g = glossary(id)
  return (
    <TipButton ariaLabel={`${label ?? g.term} : définition`} className={cn('size-[max(1.1em,14px)] min-h-0 rounded-full border border-current text-[.75em] font-black italic opacity-70 hover:opacity-100', className)}
      content={(close) => <>
        <div className="font-bold text-neon">{g.term}</div>
        <p className="mt-1 text-white/85">{g.short}</p>
        <Link to={`/glossaire#${g.id}`} onClick={close} className="mt-2 inline-block text-xs font-bold text-sky-soft underline underline-offset-2">Formule et exemple dans le glossaire</Link>
      </>}>i</TipButton>
  )
}

/** Icône sur la ligne d'une équipe dont le classement a été ajusté par Ardentia (ex. « −3 pts : décision Ardentia du 20/11 ») */
export function AdjustmentMark({ list, className }: { list?: StandingAdjustment[]; className?: string }) {
  if (!list?.length) return null
  return (
    <TipButton ariaLabel={`Classement ajusté : ${list.map(adjustmentLabel).join(' ; ')}`} className={cn('size-5 rounded-full bg-amber-400/15 text-amber-300 hover:bg-amber-400/25', className)}
      content={() => <>
        <div className="font-bold text-amber-300">Classement ajusté par Ardentia</div>
        <ul className="mt-1 space-y-1.5">{list.map((a) => <li key={a.id}><b>{adjustmentLabel(a)}</b><span className="block text-white/75">{a.reason}</span></li>)}</ul>
        <p className="mt-2 text-xs text-white/60">Correction ajoutée au calcul automatique, qui reste inchangé.</p>
      </>}>
      <Gavel className="size-3" aria-hidden />
    </TipButton>
  )
}

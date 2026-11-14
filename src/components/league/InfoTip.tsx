// Bouton « i » : définition courte au survol (souris) ou au toucher (mobile), avec un lien vers le glossaire.
// Le texte vient de src/lib/glossary.ts (source unique, aussi utilisée par la page /glossaire).
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { glossary, type GlossaryId } from '@/lib/glossary'
import { cn } from '@/lib/utils'

export function InfoTip({ id, className, label }: { id: GlossaryId; className?: string; label?: string }) {
  const g = glossary(id)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0, up: false })
  const btn = useRef<HTMLButtonElement>(null)
  const tipId = useId()
  const place = () => {
    const r = btn.current?.getBoundingClientRect(); if (!r) return
    setPos({ x: Math.min(Math.max(r.left + r.width / 2, 150), innerWidth - 150), y: r.bottom + 8 > innerHeight - 170 ? r.top - 8 : r.bottom + 8, up: r.bottom + 8 > innerHeight - 170 })
  }
  const show = () => { place(); setOpen(true) }
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
      <button ref={btn} type="button" data-tip={tipId} aria-label={`${label ?? g.term} : définition`} aria-expanded={open} aria-describedby={open ? tipId : undefined}
        onClick={(e) => { stop(e); show() }} onMouseEnter={show} onMouseLeave={(e) => { if (!(e.relatedTarget as Element)?.closest?.(`[data-tip="${tipId}"]`)) setOpen(false) }} onFocus={show} onBlur={() => setOpen(false)}
        className={cn('relative inline-flex size-[1.1em] min-h-0 shrink-0 cursor-help items-center justify-center rounded-full border border-current align-middle text-[.75em] font-black italic leading-none opacity-70 transition hover:opacity-100 before:absolute before:-inset-3 before:content-[""]', className)}>
        i
      </button>
      {open && createPortal(
        <div id={tipId} role="tooltip" data-tip={tipId} onMouseLeave={() => setOpen(false)}
          className="fixed z-[100] w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2 rounded-xl border border-white/15 bg-night-950/95 p-3 text-left text-[13px] font-normal normal-case leading-snug tracking-normal text-white shadow-2xl backdrop-blur"
          style={{ left: pos.x, top: pos.y, transform: `translate(-50%, ${pos.up ? '-100%' : '0'})` }}>
          <div className="font-bold text-neon">{g.term}</div>
          <p className="mt-1 text-white/85">{g.short}</p>
          <Link to={`/glossaire#${g.id}`} onClick={() => setOpen(false)} className="mt-2 inline-block text-xs font-bold text-sky-soft underline underline-offset-2">Formule et exemple dans le glossaire</Link>
        </div>, document.body)}
    </>
  )
}

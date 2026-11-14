// Bandeau orange en haut de chaque page quand l'admin regarde le site en mode simulation (+ page non indexée).
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { leaveSimulation } from '@/sim/simMode'

export function SimBanner({ compact = false }: { compact?: boolean }) {
  const { simulation } = useData()
  useEffect(() => {
    if (!simulation) return
    const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'
    document.head.appendChild(m)
    return () => m.remove()
  }, [simulation])
  // hauteur du bandeau publiée en --sim-h : les en-têtes collants se placent dessous au lieu d'être recouverts
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current, root = document.documentElement
    if (!el) { root.style.removeProperty('--sim-h'); return }
    const ro = new ResizeObserver(() => root.style.setProperty('--sim-h', `${el.offsetHeight}px`))
    ro.observe(el)
    return () => { ro.disconnect(); root.style.removeProperty('--sim-h') }
  }, [simulation])
  if (!simulation) return null
  return (
    <div ref={ref} role="status" className="sticky top-0 z-[60] flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-[#F97316] px-3 py-1.5 text-center text-[13px] font-black uppercase tracking-wide text-[#1A0A00] shadow-[0_2px_12px_rgb(249_115_22_/_.5)] no-print">
      <FlaskConical className="size-4" aria-hidden />
      <span>SIMULATION — données fictives</span>
      {!compact && <>
        <span className="hidden font-semibold normal-case tracking-normal sm:inline">Visible uniquement par les admins · lecture seule</span>
        <Link to="/admin/simulation" className="tap-sm rounded-full bg-[#1A0A00] px-2.5 py-0.5 text-[11px] font-bold normal-case tracking-normal text-white hover:bg-black">Gérer</Link>
        <button onClick={leaveSimulation} className="tap-sm cursor-pointer rounded-full border border-[#1A0A00]/40 px-2.5 py-0.5 text-[11px] font-bold normal-case tracking-normal hover:bg-[#1A0A00]/10">Quitter</button>
      </>}
    </div>
  )
}

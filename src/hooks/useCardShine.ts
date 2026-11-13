// Brillance des cartes : suit le curseur (ordinateur) ou l'inclinaison du téléphone, via des variables CSS
// (--mx / --my : point lumineux, --hx / --hy : position du reflet holographique). Rien ne bouge si
// l'utilisateur a demandé moins d'animations (prefers-reduced-motion).
import { useEffect, useRef, type PointerEvent } from 'react'

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function apply(el: HTMLElement, x: number, y: number) {
  const cx = Math.min(1, Math.max(0, x)), cy = Math.min(1, Math.max(0, y))
  el.style.setProperty('--mx', `${(cx * 100).toFixed(1)}%`)
  el.style.setProperty('--my', `${(cy * 100).toFixed(1)}%`)
  el.style.setProperty('--hx', `${(100 - cx * 100).toFixed(1)}%`)
  el.style.setProperty('--hy', `${(100 - cy * 100).toFixed(1)}%`)
}

// un seul écouteur d'inclinaison pour toutes les cartes de la page
const tilted = new Set<HTMLElement>()
let listening = false
function onTilt(e: DeviceOrientationEvent) {
  if (e.gamma == null || e.beta == null) return
  const x = 0.5 + Math.max(-30, Math.min(30, e.gamma)) / 60
  const y = 0.5 + Math.max(-30, Math.min(30, e.beta - 40)) / 60
  requestAnimationFrame(() => tilted.forEach((el) => { el.dataset.shine = 'on'; apply(el, x, y) }))
}

export function useCardShine<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || reduced() || typeof window === 'undefined' || !('DeviceOrientationEvent' in window) || !matchMedia('(hover: none)').matches) return
    tilted.add(el)
    if (!listening) { window.addEventListener('deviceorientation', onTilt); listening = true }
    return () => { tilted.delete(el); if (!tilted.size) { window.removeEventListener('deviceorientation', onTilt); listening = false } }
  }, [])
  const onPointerMove = (e: PointerEvent<T>) => {
    if (e.pointerType !== 'mouse' || reduced()) return
    const el = e.currentTarget, r = el.getBoundingClientRect()
    el.dataset.shine = 'on'
    apply(el, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
  }
  const onPointerLeave = (e: PointerEvent<T>) => { e.currentTarget.dataset.shine = 'off' }
  return { ref, onPointerMove, onPointerLeave }
}

// Détourage automatique en arrière-plan (admin connecté) : les photos joueurs sans fond sont produites
// sans intervention ; un seul onglet travaille à la fois (verrou partagé entre onglets).
import { useEffect, useRef, useState } from 'react'
import { base44 } from '@/api/base44Client'
import { useData } from '@/hooks/useData'
import { cutoutPlayerPhoto, failedCutout } from '@/api/playerPhotos'
import { autoCutoutsPaused, needsCutout } from '@/lib/cutoutQueue'

const LOCK = 'statfoot:cutout-lock'
const me = Math.random().toString(36).slice(2)
const takeLock = () => {
  try {
    const [owner, at] = (localStorage.getItem(LOCK) ?? '').split('|')
    if (owner && owner !== me && Date.now() - Number(at) < 90_000) return false
    localStorage.setItem(LOCK, `${me}|${Date.now()}`)
    return true
  } catch { return true }
}
const releaseLock = () => { try { if (localStorage.getItem(LOCK)?.startsWith(me)) localStorage.removeItem(LOCK) } catch { /* */ } }

export function useAutoCutouts(enabled: boolean) {
  const { db } = useData()
  const pending = db.Player.filter(needsCutout)
  const [current, setCurrent] = useState<string | null>(null)
  const [tick, setTick] = useState(0)
  const running = useRef(false)
  useEffect(() => {
    if (!enabled || running.current || !pending.length) return
    if (autoCutoutsPaused()) { const t = setTimeout(() => setTick((x) => x + 1), 5_000); return () => clearTimeout(t) }
    if (!takeLock()) { const t = setTimeout(() => setTick((x) => x + 1), 30_000); return () => clearTimeout(t) } // un autre onglet travaille
    running.current = true
    const p = pending[0]
    setCurrent(p.id)
    const beat = setInterval(() => { try { localStorage.setItem(LOCK, `${me}|${Date.now()}`) } catch { /* */ } }, 20_000)
    const photo = p.photo_url!
    cutoutPlayerPhoto(photo)
      .then((patch) => base44.entities.Player.update(p.id, patch))
      .catch(() => base44.entities.Player.update(p.id, failedCutout(p, photo)))
      .finally(() => { clearInterval(beat); running.current = false; releaseLock(); setCurrent(null) })
  }, [enabled, pending.length, pending[0]?.id, current, tick]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => releaseLock, [])
  return { pending: pending.length, current }
}

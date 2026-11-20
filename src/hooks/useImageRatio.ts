// Rapport largeur / hauteur d'une image (mis en cache) : sert à agrandir le cadre des logos larges.
import { useEffect, useState } from 'react'

const cache = new Map<string, number>()
export const WIDE_LOGO = 2

export function useImageRatio(src?: string | null): number | null {
  const [r, setR] = useState<number | null>(() => (src ? cache.get(src) ?? null : null))
  useEffect(() => {
    if (!src) { setR(null); return }
    if (cache.has(src)) { setR(cache.get(src)!); return }
    let live = true
    const i = new Image()
    i.decoding = 'async'
    i.onload = () => { if (i.naturalWidth && i.naturalHeight) { const v = i.naturalWidth / i.naturalHeight; cache.set(src, v); if (live) setR(v) } }
    i.src = src
    return () => { live = false }
  }, [src])
  return r
}

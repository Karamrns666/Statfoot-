// Logo « rogné » : retire les marges blanches / transparentes autour d'un logo (beaucoup de logos sont des carrés
// avec le dessin tout petit au centre) pour qu'il remplisse son cartouche. Résultat mis en cache par URL.
import { useEffect, useState } from 'react'

const cache = new Map<string, Promise<string>>()

function trim(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight
        if (!w || !h || url.endsWith('.svg') || url.startsWith('data:image/svg')) return resolve(url)
        const c = document.createElement('canvas'); c.width = w; c.height = h
        const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(img, 0, 0)
        const d = ctx.getImageData(0, 0, w, h).data
        let x0 = w, y0 = h, x1 = -1, y1 = -1
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          const empty = d[i + 3] < 16 || (d[i] > 242 && d[i + 1] > 242 && d[i + 2] > 242)
          if (!empty) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
        }
        if (x1 < 0) return resolve(url)
        const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.04)
        x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad)
        if ((x1 - x0) * (y1 - y0) > w * h * 0.85) return resolve(url) // déjà sans marge
        const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1
        o.getContext('2d')!.drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height)
        resolve(o.toDataURL('image/png'))
      } catch { resolve(url) } // image d'un autre site sans autorisation : on garde l'originale
    }
    img.onerror = () => resolve(url)
    img.src = url
  })
}

export function useTrimmedImage(url?: string | null): string | undefined {
  const [out, setOut] = useState<string | undefined>(url ?? undefined)
  useEffect(() => {
    if (!url) { setOut(undefined); return }
    let alive = true
    setOut(url)
    if (!cache.has(url)) cache.set(url, trim(url))
    cache.get(url)!.then((u) => { if (alive) setOut(u) })
    return () => { alive = false }
  }, [url])
  return out
}

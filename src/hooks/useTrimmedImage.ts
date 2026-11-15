// Logo « rogné » : retire les marges blanches / transparentes autour d'un logo (beaucoup de logos sont des carrés
// avec le dessin tout petit au centre) pour qu'il remplisse son cartouche. Résultat mis en cache par URL.
import { useEffect, useState } from 'react'

const cache = new Map<string, Promise<string>>()

const SCAN = 128 // détection des marges sur une copie réduite (rapide même sur téléphone)
const OUT = 384 // logo rogné : 384 px max (net à l’écran et dans les PNG exportés)
const idle = (fn: () => void) => ((window as unknown as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => void }).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1)))(fn, { timeout: 1500 })

function trim(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => idle(() => {
      try {
        const w = img.naturalWidth, h = img.naturalHeight
        if (!w || !h || url.endsWith('.svg') || url.startsWith('data:image/svg')) return resolve(url)
        const k = Math.min(1, SCAN / Math.max(w, h)), sw = Math.max(1, Math.round(w * k)), sh = Math.max(1, Math.round(h * k))
        const c = document.createElement('canvas'); c.width = sw; c.height = sh
        const ctx = c.getContext('2d', { willReadFrequently: true })!; ctx.drawImage(img, 0, 0, sw, sh)
        const d = ctx.getImageData(0, 0, sw, sh).data
        let x0 = sw, y0 = sh, x1 = -1, y1 = -1
        for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
          const i = (y * sw + x) * 4
          const empty = d[i + 3] < 16 || (d[i] > 242 && d[i + 1] > 242 && d[i + 2] > 242)
          if (!empty) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
        }
        if (x1 < 0) return resolve(url)
        // retour aux coordonnées de l'image d'origine (+1 px de sécurité dû à la réduction), puis petite marge
        let X0 = Math.max(0, Math.floor((x0 - 1) / k)), Y0 = Math.max(0, Math.floor((y0 - 1) / k))
        let X1 = Math.min(w - 1, Math.ceil((x1 + 2) / k)), Y1 = Math.min(h - 1, Math.ceil((y1 + 2) / k))
        const pad = Math.round(Math.max(X1 - X0, Y1 - Y0) * 0.04)
        X0 = Math.max(0, X0 - pad); Y0 = Math.max(0, Y0 - pad); X1 = Math.min(w - 1, X1 + pad); Y1 = Math.min(h - 1, Y1 + pad)
        const cw = X1 - X0 + 1, ch = Y1 - Y0 + 1
        if (cw * ch > w * h * 0.85 && Math.max(w, h) <= OUT * 2) return resolve(url) // déjà sans marge et léger
        const f = Math.min(1, OUT / Math.max(cw, ch))
        const o = document.createElement('canvas'); o.width = Math.max(1, Math.round(cw * f)); o.height = Math.max(1, Math.round(ch * f))
        const octx = o.getContext('2d')!; octx.imageSmoothingQuality = 'high'
        octx.drawImage(img, X0, Y0, cw, ch, 0, 0, o.width, o.height)
        resolve(o.toDataURL('image/png'))
      } catch { resolve(url) } // image d'un autre site sans autorisation : on garde l'originale
    })
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

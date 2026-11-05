// Détourage automatique des photos joueurs, dans le navigateur, avec @imgly/background-removal.
// La bibliothèque est intégrée au site mais chargée seulement quand un détourage est nécessaire (admin) ;
// son modèle IA (~80 Mo) est téléchargé une fois puis gardé en cache par le navigateur.
// La photo ne quitte jamais le navigateur. Le résultat passe ensuite par le post-traitement de cutoutProcess.ts.
import { canvasToBlob, decodeImage } from './imageOptimize'
import { alphaBox, bustFrame, cleanEdges, mainSubject } from './cutoutProcess'

type RemoveFn = (image: Blob, config?: { output?: { format?: string; quality?: number }; progress?: (key: string, current: number, total: number) => void }) => Promise<Blob>
let lib: Promise<RemoveFn> | null = null

function loadLib(): Promise<RemoveFn> {
  if (!lib) {
    lib = import('@imgly/background-removal').then((m) => {
      const fn = (m.removeBackground ?? m.default) as unknown as RemoveFn
      if (typeof fn !== 'function') throw new Error('Bibliothèque de détourage indisponible')
      return fn
    })
    lib.catch(() => { lib = null }) // nouvel essai possible plus tard
  }
  return lib
}

/** Étapes affichées dans la barre de progression (pourcentage global 0–100). */
export type CutoutProgress = (pct: number, label: string) => void

export const CUTOUT_HEIGHT = 800

/**
 * Photo d'origine → joueur seul sur fond transparent, cadré en buste, 800 px de haut, WebP avec alpha
 * (PNG si le navigateur ne sait pas encoder le WebP).
 * Progression : 0–70 % téléchargement de l'outil (1re fois seulement), 70–92 % analyse, 92–100 % finition.
 */
export async function removePhotoBackground(photo: Blob, onProgress?: CutoutProgress, timeoutMs = 240_000): Promise<Blob> {
  onProgress?.(2, 'Préparation de l’outil de détourage…')
  const run = (async () => {
    const remove = await loadLib()
    const seen = new Map<string, [number, number]>()
    const out = await remove(photo, {
      output: { format: 'image/png' },
      progress: (key, cur, total) => {
        if (key.startsWith('fetch')) {
          seen.set(key, [cur, total])
          const [c, t] = [...seen.values()].reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0])
          onProgress?.(t ? 2 + Math.round((c / t) * 68) : 10, 'Téléchargement de l’outil (1re fois seulement)…')
        } else onProgress?.(70 + (total ? Math.round((cur / total) * 22) : 10), 'Suppression du fond…')
      },
    })
    onProgress?.(93, 'Recadrage et nettoyage des bords…')
    const res = await finishCutout(out)
    onProgress?.(100, 'Terminé')
    return res
  })()
  const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Détourage trop long')), timeoutMs))
  return Promise.race([run, timeout])
}

/**
 * Post-traitement d'une image déjà détourée (sortie du modèle ou PNG importé à la main) :
 * joueur principal seul, cadrage buste centré sur la tête, 800 px de haut, bords propres, WebP transparent.
 */
export async function finishCutout(png: Blob, height = CUTOUT_HEIGHT): Promise<Blob> {
  const img = await decodeImage(png)
  const W = 'naturalWidth' in img ? img.naturalWidth : img.width, H = 'naturalHeight' in img ? img.naturalHeight : img.height
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0)
  const data = ctx.getImageData(0, 0, W, H)
  const px = data.data
  const alpha = (i: number) => px[i * 4 + 3]
  // 1. joueur au premier plan uniquement
  const subject = mainSubject(alpha, W, H)
  if (!subject) throw new Error('Aucun joueur détecté sur la photo')
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!subject.keep(x, y)) px[(y * W + x) * 4 + 3] = 0
  ctx.putImageData(data, 0, 0)
  // 2. cadrage buste / mi-corps
  const box = alphaBox(alpha, W, H)
  if (!box) throw new Error('Aucun joueur détecté sur la photo')
  const f = bustFrame(alpha, W, H, box)
  const cw = f.x1 - f.x0 + 1, ch = f.y1 - f.y0 + 1
  // hauteur standard (800 px) ; une très petite photo n'est pas agrandie plus que ×2
  const scale = Math.min(height / ch, 2)
  const outH = Math.max(1, Math.round(ch * scale)), outW = Math.max(1, Math.round(cw * scale))
  const out = document.createElement('canvas'); out.width = outW; out.height = outH
  const o = out.getContext('2d', { willReadFrequently: true })!
  o.imageSmoothingQuality = 'high'
  o.drawImage(c, f.x0, f.y0, cw, ch, 0, 0, outW, outH)
  // 3. bords propres à la taille finale
  const fin = o.getImageData(0, 0, outW, outH)
  cleanEdges(fin.data, outW, outH)
  o.putImageData(fin, 0, 0)
  const webp = await canvasToBlob(out, 'image/webp', 0.9).catch(() => null)
  return webp && webp.type === 'image/webp' ? webp : canvasToBlob(out, 'image/png')
}

/** @deprecated remplacé par finishCutout */
export const trimTransparent = (png: Blob) => finishCutout(png)

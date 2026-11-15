// Photo du joueur « préparée » une fois pour toutes dans un canvas : fondu en bas et ombre portée sont DESSINÉS dans
// l'image au lieu d'être des effets CSS (mask-image + filter: drop-shadow).
// Pourquoi : ces effets CSS, posés sur une carte qui se retourne en 3D (preserve-3d / backface-visibility), font
// clignoter, disparaître ou passer la photo devant le texte sur Safari (iPhone / iPad) et certains Android, et
// html-to-image les ignore (PNG téléchargé différent de la carte affichée). Une image déjà composée s'affiche
// partout pareil, à l'écran comme dans le PNG.
import { useEffect, useState } from 'react'

const cache = new Map<string, Promise<string | null>>()

function load(url: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image(); i.crossOrigin = 'anonymous'; i.decoding = 'async'
    i.onload = () => res(i); i.onerror = () => rej(new Error('image')); i.src = url
  })
}

/** Joueur détouré : fondu sur les 18 % du bas + ombre portée douce. Renvoie une URL data: (PNG transparent). */
async function bakeCutout(url: string): Promise<string | null> {
  const img = await load(url)
  const w = img.naturalWidth, h = img.naturalHeight
  if (!w || !h) return null
  const k = Math.min(1, 900 / h) // 900 px de haut suffisent (carte affichée ≤ 600 px, PNG ≤ 700 px)
  const W = Math.round(w * k), H = Math.round(h * k)
  // 1. fondu en bas
  const a = document.createElement('canvas'); a.width = W; a.height = H
  const ca = a.getContext('2d')!
  ca.drawImage(img, 0, 0, W, H)
  // halo du détourage : les pixels presque transparents (liseré clair autour du joueur) sont retirés,
  // les bords à demi-transparents sont légèrement resserrés
  try {
    const d = ca.getImageData(0, 0, W, H), px = d.data
    for (let i = 3; i < px.length; i += 4) { const a = px[i]; px[i] = a < 48 ? 0 : a < 200 ? Math.round((a - 48) * 255 / 152) : a }
    ca.putImageData(d, 0, 0)
  } catch { /* image d'un autre site sans autorisation : on garde tel quel */ }
  ca.globalCompositeOperation = 'destination-in'
  const g = ca.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#000'); g.addColorStop(0.82, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)')
  ca.fillStyle = g; ca.fillRect(0, 0, W, H)
  // 2. ombre portée, avec une marge pour qu'elle ne soit pas coupée
  const pad = Math.round(H * 0.04)
  const b = document.createElement('canvas'); b.width = W + pad * 2; b.height = H + pad
  const cb = b.getContext('2d')!
  cb.shadowColor = 'rgba(0,0,0,.45)'; cb.shadowBlur = Math.round(H * 0.022); cb.shadowOffsetY = Math.round(H * 0.012)
  cb.drawImage(a, pad, pad)
  return b.toDataURL('image/png')
}

/** Photo non détourée : recadrée en arche (haut arrondi) avec fondu en bas, centrée sur le haut du buste. */
async function bakeArch(url: string): Promise<string | null> {
  const img = await load(url)
  const w = img.naturalWidth, h = img.naturalHeight
  if (!w || !h) return null
  const W = 600, H = 900 // proportions du cadre (60 % × 90 % de la zone photo)
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d')!
  // cadrage « cover » centré horizontalement, haut du cadre à 18 % (tête en haut)
  const s = Math.max(W / w, H / h), dw = w * s, dh = h * s
  x.save()
  x.beginPath(); x.moveTo(0, H); x.lineTo(0, W / 2); x.arc(W / 2, W / 2, W / 2, Math.PI, 0); x.lineTo(W, H); x.closePath(); x.clip()
  x.drawImage(img, (W - dw) / 2, -(dh - H) * 0.18, dw, dh)
  x.restore()
  x.globalCompositeOperation = 'destination-in'
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#000'); g.addColorStop(0.7, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)')
  x.fillStyle = g; x.fillRect(0, 0, W, H)
  return c.toDataURL('image/png')
}

export type BakedState = { status: 'loading' | 'ready' | 'error'; src?: string }

export function useBakedPhoto(url: string | undefined, kind: 'cutout' | 'arch'): BakedState {
  const [st, setSt] = useState<BakedState>({ status: url ? 'loading' : 'error' })
  useEffect(() => {
    if (!url) { setSt({ status: 'error' }); return }
    let alive = true
    const key = `${kind}|${url}`
    if (!cache.has(key)) cache.set(key, (kind === 'cutout' ? bakeCutout(url) : bakeArch(url)).catch(() => null))
    setSt((s) => (s.src && s.status === 'ready' ? s : { status: 'loading' }))
    cache.get(key)!.then((src) => { if (alive) setSt(src ? { status: 'ready', src } : { status: 'error' }) })
    return () => { alive = false }
  }, [url, kind])
  return st
}

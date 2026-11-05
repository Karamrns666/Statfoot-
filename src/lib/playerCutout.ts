// Détourage d'une photo joueur enregistrée + verrou partagé entre onglets (un seul détourage à la fois :
// le modèle IA est lourd, on évite d'en faire tourner plusieurs en parallèle).
import { loadBlob, saveFile } from '@/api/fileStore'
import { finishCutout, removePhotoBackground, type CutoutProgress } from './bgRemoval'

/** Détoure la photo (URL enregistrée) et renvoie l'URL de la version détourée (WebP transparent). */
export async function cutoutFromUrl(url: string, onProgress?: CutoutProgress) {
  const out = await removePhotoBackground(await loadBlob(url), onProgress)
  return saveFile(out, 'cutout')
}

/** PNG/WebP déjà détouré (préparé dans un autre outil) → même post-traitement (cadrage, bords, 800 px). */
export async function cutoutFromFile(file: Blob) {
  return saveFile(await finishCutout(file), 'cutout')
}

const LOCK = 'statfoot:cutout-lock'
export function takeCutoutLock(owner: string, staleMs = 90_000) {
  try {
    const [o, at] = (localStorage.getItem(LOCK) ?? '').split('|')
    if (o && o !== owner && Date.now() - Number(at) < staleMs) return false
    localStorage.setItem(LOCK, `${owner}|${Date.now()}`)
    return true
  } catch { return true }
}
export function releaseCutoutLock(owner: string) {
  try { if (localStorage.getItem(LOCK)?.startsWith(`${owner}|`)) localStorage.removeItem(LOCK) } catch { /* stockage indisponible */ }
}

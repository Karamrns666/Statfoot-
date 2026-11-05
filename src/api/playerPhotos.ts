// Détourage d'une photo joueur déjà enregistrée → fichiers + champs à enregistrer sur le joueur.
// Deux fichiers sont conservés : photo_url (originale) et photo_cutout_url (détourée, WebP transparent).
import { loadBlob, saveFile } from './fileStore'
import { removePhotoBackground, type CutoutProgress } from '@/lib/bgRemoval'
import type { Player } from '@/types/entities'

export async function cutoutPlayerPhoto(photoUrl: string, onProgress?: CutoutProgress): Promise<Partial<Player>> {
  const res = await removePhotoBackground(await loadBlob(photoUrl), onProgress)
  const url = await saveFile(res.blob, 'cutout')
  return { photo_cutout_url: url, photo_cutout_status: 'ok', photo_cutout_source: photoUrl, photo_cutout_tries: 0, photo_cutout_disabled: undefined, photo_cutout_validated: undefined, photo_face_x: res.face.x, photo_face_y: res.face.y }
}

/** Champs après un échec (la photo originale reste affichée, recadrée proprement). */
export const failedCutout = (p: Pick<Player, 'photo_cutout_source' | 'photo_cutout_tries'>, photoUrl: string): Partial<Player> => ({
  photo_cutout_url: undefined, photo_cutout_status: 'failed', photo_cutout_source: photoUrl,
  photo_cutout_tries: (p.photo_cutout_source === photoUrl ? p.photo_cutout_tries ?? 0 : 0) + 1,
})

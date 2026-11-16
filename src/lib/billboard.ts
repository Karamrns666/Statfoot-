// Panneaux du billboard de l'accueil : liste, ordre par défaut et réglage admin (ordre + activation).
export const BILLBOARD_SLIDES: { key: string; label: string; help?: string }[] = [
  { key: 'brand', label: 'Logo MBL et nom de la ligue' },
  { key: 'poster', label: 'Affiche de la saison' },
  { key: 'intro', label: 'Présentation de la saison' },
  { key: 'xp', label: 'Meilleur joueur (XP)', help: 'dès qu’un match est joué' },
  { key: 'scorer', label: 'Meilleur buteur', help: 'dès le premier but' },
  { key: 'assist', label: 'Meilleur passeur', help: 'dès la première passe décisive' },
  { key: 'keeper', label: 'Meilleur gardien', help: 'dès le premier arrêt' },
  { key: 'attack', label: 'Meilleure attaque', help: 'dès le premier but' },
  { key: 'defense', label: 'Meilleure défense', help: 'dès qu’un match est joué' },
  { key: 'motm', label: 'Homme du dernier match', help: 'dès qu’un homme du match est désigné' },
]
export type BillboardLayout = { key: string; enabled: boolean }[]

/** Réglage enregistré complété avec les panneaux ajoutés depuis (activés, à leur place par défaut) */
export function billboardLayout(saved?: BillboardLayout | null): BillboardLayout {
  const known = new Set(BILLBOARD_SLIDES.map((s) => s.key))
  const out = (saved ?? []).filter((x) => known.has(x.key))
  for (const s of BILLBOARD_SLIDES) if (!out.some((x) => x.key === s.key)) out.push({ key: s.key, enabled: true })
  return out
}

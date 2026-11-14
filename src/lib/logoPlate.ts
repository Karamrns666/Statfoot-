// Fond du logo d'une équipe (réglage admin « Fond du logo ») : blanc, noir, transparent ou couleur de l'équipe.
// « auto » : blanc pour un logo d'entreprise (image importée), transparent pour un blason généré.
import type { Team } from '@/types/entities'
import { isBrandLogo } from './logos'

export type LogoBg = 'auto' | 'white' | 'black' | 'transparent' | 'team'
export const LOGO_BG_LABEL: Record<LogoBg, string> = { auto: 'Automatique', white: 'Blanc', black: 'Noir', transparent: 'Transparent', team: 'Couleur de l’équipe' }

export function logoPlate(team?: Pick<Team, 'logo_url' | 'logo_bg' | 'primary_color'> | null): { bg: string | null; dark: boolean } {
  const mode = (team?.logo_bg ?? 'auto') as LogoBg
  const brand = isBrandLogo(team?.logo_url)
  if (mode === 'black') return { bg: '#0A0A0A', dark: true }
  if (mode === 'transparent') return { bg: null, dark: false }
  if (mode === 'team') return { bg: team?.primary_color ?? '#0B2E73', dark: true }
  if (mode === 'white' || (mode === 'auto' && brand)) return { bg: '#FFFFFF', dark: false }
  return { bg: null, dark: false }
}

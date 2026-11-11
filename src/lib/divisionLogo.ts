// Logos officiels des deux divisions (utilisés partout où MASTER / CHALLENGER apparaissent).
import type { Competition } from '@/types/entities'
export const MASTER_LOGO = '/brand/logo-master.png'
export const CHALLENGER_LOGO = '/brand/logo-challenger.png'
export function divisionLogo(c?: Pick<Competition, 'phase' | 'logo_url'> | null): string | undefined {
  if (!c) return undefined
  if (c.logo_url) return c.logo_url
  return c.phase === 'gold' ? MASTER_LOGO : c.phase === 'silver' ? CHALLENGER_LOGO : undefined
}

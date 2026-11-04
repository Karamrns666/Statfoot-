import { useMemo } from 'react'
import { useData } from './useData'
import { LEAGUE, type LeagueInfo } from '@/config/league'

/** Infos officielles : config/league.ts, surchargées par Admin → Paramètres (entité Settings). */
export function useLeague(): LeagueInfo {
  const { settings: s } = useData()
  return useMemo(() => {
    const pick = (v: string | undefined | null, d: string) => (v && v.trim() ? v.trim() : d)
    const o = LEAGUE.organizer
    return {
      name: pick(s.league_name, LEAGUE.name), shortName: pick(s.short_name, LEAGUE.shortName), tagline: pick(s.tagline, LEAGUE.tagline),
      logo: pick(s.logo_url, LEAGUE.logo), founded: LEAGUE.founded, instagram: pick(s.socials?.instagram, LEAGUE.instagram),
      organizer: {
        name: pick(s.organizer, o.name), description: o.description, logo: o.logo, logoDark: o.logoDark,
        website: pick(s.website, o.website), email: pick(s.contact_email, o.email), phone: pick(s.contact_phone, o.phone), address: pick(s.address, o.address),
        instagram: pick(s.socials?.organizer_instagram, o.instagram), linkedin: pick(s.socials?.linkedin, o.linkedin),
      },
    }
  }, [s])
}

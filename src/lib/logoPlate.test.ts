import { describe, expect, it } from 'vitest'
import { logoPlate, logoSrc } from './logoPlate'
import { applyLogoPbeV2 } from '@/api/seed/migrations'
import { LOGO_FILES, officialLogo } from './officialTeams'

describe('logo selon le fond', () => {
  const pbe = { logo_url: '/logos/pbe.svg', logo_dark_url: '/logos/pbe-dark.svg', logo_bg: 'black' as const }
  it('pastille noire → version fond sombre', () => {
    expect(logoPlate(pbe).dark).toBe(true)
    expect(logoSrc(pbe)).toBe('/logos/pbe-dark.svg')
  })
  it('pastille blanche → version normale', () => {
    expect(logoSrc({ ...pbe, logo_bg: 'white' })).toBe('/logos/pbe.svg')
  })
  it('sans version fond sombre → logo habituel', () => {
    expect(logoSrc({ logo_url: '/logos/ald.png', logo_bg: 'black' })).toBe('/logos/ald.png')
  })
})

describe('Parebrise Express : nouveau logo officiel', () => {
  it('fichiers SVG + PNG 2000 px', () => {
    expect(officialLogo({ short: 'PBE' })).toEqual(LOGO_FILES.PBE)
    expect(LOGO_FILES.PBE.logo_url).toMatch(/pbe\.svg/)
  })
  it('migration : équipe et club passent aux nouveaux fichiers, même identifiant ; logo importé à la main intact', () => {
    const db = {
      Team: [
        { id: 't26_pbe', name: 'Parebrise Express', short_name: 'PBE', logo_url: '/logos/pbe.png', company_logo_url: '/logos/pbe-full.png', logo_bg: 'black' },
        { id: 't26_cam', name: 'CAM', short_name: 'CAM', logo_url: '/_files/perso.png' },
      ],
      Club: [{ id: 'club_pbe', name: 'Parebrise Express', logo_url: '/logos/pbe.png' }],
    }
    const out = applyLogoPbeV2(db as never)
    expect(out.Team![0]).toMatchObject({ id: 't26_pbe', logo_url: LOGO_FILES.PBE.logo_url, logo_dark_url: LOGO_FILES.PBE.logo_dark_url, company_logo_url: LOGO_FILES.PBE.company_logo_url, logo_bg: 'black' })
    expect(out.Team![1]).toBe(db.Team[1])
    expect(out.Club![0].logo_url).toBe(LOGO_FILES.PBE.logo_url)
    expect(applyLogoPbeV2({ ...db, Team: out.Team, Club: out.Club } as never)).toEqual({})
  })
})

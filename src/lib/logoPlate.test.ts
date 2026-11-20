import { describe, expect, it } from 'vitest'
import { isBleedSquare, logoLargeSrc, logoPlate, logoSize, logoSquareSrc, logoSrc, teamShortName, tileLogo } from './logoPlate'
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

describe('tuile logo unique', () => {
  it('tailles normalisées seulement', () => {
    expect([14, 22, 24, 28, 36, 44, 64, 72, 88, 120, 160, 300].map(logoSize)).toEqual(['xs', 'xs', 'xs', 'sm', 'md', 'md', 'lg', 'lg', 'xl', 'xl', 'hero', 'hero'])
    expect(logoSize('md')).toBe('md')
  })
  it('fond : blanc par défaut (auto / transparent), noir, couleur de l’équipe', () => {
    expect(logoPlate({}).bg).toBe('#FFFFFF')
    expect(logoPlate({ logo_bg: 'transparent' }).bg).toBe('#FFFFFF')
    expect(logoPlate({ logo_bg: 'black' }).bg).toBe('#0A0A0A')
    expect(logoPlate({ logo_bg: 'team', primary_color: '#123456' }).bg).toBe('#123456')
  })
  it('logo carré : celui de l’admin ; symbole seulement si « Symbole seul » ; sinon logo complet', () => {
    expect(logoSquareSrc({ logo_url: '/logos/cac.png', logo_square_url: '/x.png' })).toBe('/x.png')
    expect(logoSquareSrc({ logo_url: '/logos/cac.png' })).toBeUndefined()
    expect(logoSquareSrc({ logo_url: '/logos/cac.png', logo_small: 'symbol' })).toBe('/logos/cac-icone.png')
    expect(logoSquareSrc({ logo_url: '/logos/pbe.svg?v=2026-11b' })).toBe('/logos/pbe-carre-noir-1024.png')
    expect(logoSquareSrc({ logo_url: '/logos/pbe.svg?v=2026-11b', logo_small: 'symbol' })).toBe('/logos/pbe-icone.png')
    expect(isBleedSquare('/logos/pbe-carre-noir-1024.png')).toBe(true)
    expect(logoSquareSrc({ logo_url: '/logos/cob.png' })).toBeUndefined()
    expect(logoSquareSrc({ logo_url: '/_files/perso.png' })).toBeUndefined()
  })
  it('grand logo : fichier HD officiel, version sombre sur tuile noire', () => {
    expect(logoLargeSrc({ logo_url: '/logos/cob.png', company_logo_url: '/logos/cob-full.png' })).toBe('/logos/cob-full.png')
    expect(logoLargeSrc({ logo_url: '/logos/pbe.svg', logo_dark_url: '/logos/pbe-dark.svg', logo_bg: 'black', company_logo_url: '/logos/pbe-2000.png' })).toBe('/logos/pbe-dark.svg')
    expect(tileLogo({ logo_url: '/logos/cac.png', company_logo_url: '/logos/cac-full.png' }, true)).toBe('/logos/cac.png')
    expect(tileLogo({ logo_url: '/logos/pbe.svg', logo_bg: 'black' }, true)).toBe('/logos/pbe-carre-noir-1024.png')
  })
  it('nom court', () => {
    expect(teamShortName({ name: 'Parebrise Express', short_name: 'PBE' })).toBe('Parebrise Exp.')
    expect(teamShortName({ name: 'Parebrise Express', short_name: 'PBE', display_short: 'PB Express' })).toBe('PB Express')
    expect(teamShortName({ name: 'Cobco', short_name: 'COB' })).toBe('Cobco')
  })
})

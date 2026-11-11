// ============================================================================
//  Informations OFFICIELLES de la ligue — source unique.
//  Valeurs par défaut ; chaque champ peut être modifié dans Admin → Paramètres
//  (l'admin enregistre une surcharge dans l'entité Settings, lue par useLeague()).
// ============================================================================
export const LEAGUE = {
  name: 'Morocco Business League',
  shortName: 'MBL',
  tagline: 'Le premier championnat inter-entreprises au Maroc',
  taglineAr: 'الدوري الوطني للشركات المغربية',
  logo: '/brand/mbl-logo.png',
  founded: 2023,
  instagram: 'https://www.instagram.com/morocco.business.league/',
  organizer: {
    name: 'Ardentia',
    description: 'Agence événementielle et de communication, organisatrice de la Morocco Business League.',
    logo: '/brand/ardentia-logo-light.png',
    logoDark: '/brand/ardentia-logo-dark.png',
    logoRemote: 'https://media.base44.com/images/public/6a9ee5ea559f2e449ec37888/e6af957c3_cropped-ARDENTIA.webp',
    website: 'https://www.ardentia.ma',
    email: 'contact@ardentia.ma',
    phone: '+212 6 43 04 79 84',
    address: '39, Av Lalla Yaqout, 1er étage, Apt n°1, Casablanca',
    instagram: 'https://www.instagram.com/ardentia.ma/',
    linkedin: 'https://www.linkedin.com/company/ardentia-agence/',
  },
} as const

export interface LeagueInfo {
  name: string
  shortName: string
  tagline: string
  taglineAr: string
  logo: string
  founded: number
  instagram: string
  organizer: { name: string; description: string; logo: string; logoDark: string; website: string; email: string; phone: string; address: string; instagram: string; linkedin: string }
}

/** +212 6 43 04 79 84 → +212643047984 (lien tel:) */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`
/** lien WhatsApp avec message prérempli */
export const whatsappHref = (phone: string, text = 'Bonjour, je vous contacte depuis le site de la Morocco Business League.') =>
  `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`
export const mapsHref = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
export const mapsEmbed = (address: string) => `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`

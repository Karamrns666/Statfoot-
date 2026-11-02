// Génération de logos / visuels SVG (aucune image externe) — utilisés par le seed et en repli dans l'UI.
const enc = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

export function teamLogoSvg(short: string, c1 = '#22d3ee', c2 = '#0f172a', variant = 0) {
  const shapes = [
    `<path d="M50 4 L92 18 V50 C92 75 72 92 50 98 C28 92 8 75 8 50 V18 Z" fill="${c2}" stroke="${c1}" stroke-width="5"/>`,
    `<circle cx="50" cy="50" r="44" fill="${c2}" stroke="${c1}" stroke-width="6"/>`,
    `<path d="M50 4 L94 28 V72 L50 96 L6 72 V28 Z" fill="${c2}" stroke="${c1}" stroke-width="5"/>`,
  ]
  const stripe = variant % 2 === 0
    ? `<path d="M20 30 L80 30 L76 40 L24 40 Z" fill="${c1}" opacity=".9"/>`
    : `<path d="M30 22 L70 22 L50 36 Z" fill="${c1}" opacity=".9"/>`
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${shapes[variant % shapes.length]}${stripe}<text x="50" y="70" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="24" fill="#fff" letter-spacing="1">${short}</text></svg>`)
}

export function companyLogoSvg(name: string, color = '#22d3ee') {
  const initial = name.trim().charAt(0).toUpperCase()
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="22" fill="#0b1426" stroke="${color}" stroke-width="4"/><text x="50" y="66" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="48" fill="${color}">${initial}</text></svg>`)
}

export function photoPlaceholderSvg(title: string, hue = 200, seed = 0) {
  const x = 20 + (seed * 37) % 60
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,22%)"/><stop offset="1" stop-color="#0b1426"/></linearGradient><radialGradient id="l" cx="${x}%" cy="0%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="800" height="500" fill="url(#g)"/><rect width="800" height="500" fill="url(#l)"/><g stroke="#ffffff" stroke-opacity=".18" stroke-width="3" fill="none"><rect x="60" y="300" width="680" height="170"/><line x1="400" y1="300" x2="400" y2="470"/><circle cx="400" cy="385" r="45"/></g><text x="40" y="70" font-family="Arial Black,Arial" font-size="34" fill="#fff" opacity=".9">${title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text><text x="40" y="110" font-family="Arial" font-size="20" fill="#9fb3d9">StatFoot · photo de démonstration</text></svg>`)
}

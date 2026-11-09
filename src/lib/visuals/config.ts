// Configuration des visuels réseaux sociaux : src/config/visuals.json (valeurs par défaut, versionnées)
// + surcharge éventuelle saisie dans l'admin (Réglages → visuals_config), fusionnée zone par zone.
import DEFAULTS from '@/config/visuals.json'

export type ColorKey = keyof typeof DEFAULTS.colors
export interface Zone {
  x: number; y: number; w: number; h: number
  font?: 'display' | 'text'; weight?: number; size?: number; min?: number; color?: string; align?: 'left' | 'center' | 'right'
  lineHeight?: number; maxLines?: number; pad?: number; opacity?: number; logo?: number; gap?: number; text?: string
  labelFont?: 'display' | 'text'; labelSize?: number; fill?: string
}
export interface TemplateLayout { zones: Record<string, Zone>; decor: Record<string, Zone> }
export interface VisualsConfig {
  version: number
  colors: Record<string, string>
  fonts: { display: string; text: string }
  templates: { resultat: string; mvp: string; mvp2: string }
  resultat: TemplateLayout
  mvp: TemplateLayout
}

export const DEFAULT_VISUALS_CONFIG = DEFAULTS as unknown as VisualsConfig
export const VISUAL_SIZE = 1080

function mergeLayout(base: TemplateLayout, o?: Partial<TemplateLayout>): TemplateLayout {
  if (!o) return base
  const zones = { ...base.zones }
  for (const [k, z] of Object.entries(o.zones ?? {})) zones[k] = { ...base.zones[k], ...z }
  return { zones, decor: { ...base.decor, ...(o.decor ?? {}) } }
}

/** Fusionne une surcharge (JSON partiel) sur les valeurs par défaut. */
export function resolveVisualsConfig(override?: unknown): VisualsConfig {
  const o = (override && typeof override === 'object' ? override : {}) as Partial<VisualsConfig>
  const b = DEFAULT_VISUALS_CONFIG
  return {
    version: (o.version ?? 0) + b.version * 1000,
    colors: { ...b.colors, ...(o.colors ?? {}) },
    fonts: { ...b.fonts, ...(o.fonts ?? {}) },
    templates: { ...b.templates, ...(o.templates ?? {}) },
    resultat: mergeLayout(b.resultat, o.resultat),
    mvp: mergeLayout(b.mvp, o.mvp),
  }
}

export const colorOf = (cfg: VisualsConfig, c?: string) => (c ? cfg.colors[c] ?? c : cfg.colors.white)

const inter = (a: Zone, b: Zone) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
/** Zones de texte posées sur un élément de décor (contrôle de la mise en page). Les zones prévues DANS la bande sont autorisées. */
export function layoutProblems(cfg: VisualsConfig) {
  const out: string[] = []
  const inside: Record<string, string[]> = {
    resultat: ['competition:bandeOrangeHaut', 'homeLogo:bande', 'awayLogo:bande', 'homeScore:bande', 'awayScore:bande', 'subLine:bande', 'subLine:encocheV'],
    mvp: ['barLabel:barreOrange'],
  }
  for (const kind of ['resultat', 'mvp'] as const) {
    const L = cfg[kind]
    for (const [zk, z] of Object.entries(L.zones)) {
      if (zk === 'scoreWithSub') continue
      if (z.x < 0 || z.y < 0 || z.x + z.w > VISUAL_SIZE || z.y + z.h > VISUAL_SIZE) out.push(`${kind}.${zk} sort de l’image`)
      for (const [dk, d] of Object.entries(L.decor)) if (inter(z, d) && !inside[kind].includes(`${zk}:${dk}`)) out.push(`${kind}.${zk} recouvre le décor « ${dk} »`)
    }
  }
  return out
}

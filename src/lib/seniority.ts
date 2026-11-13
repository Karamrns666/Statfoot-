// Badge d'ancienneté d'un club (fonctions PURES, testées) :
//  ≥ 3 saisons MBL → PLATINUM · 2 saisons → GOLD · 1 saison → SILVER.
// Le nombre de saisons vient des liens approuvés entre équipes de saison (même club) ;
// l'admin peut le corriger à la main (Club.seasons_override, modification journalisée).
import type { Club, Competition, Season, Team } from '@/types/entities'
import { clubKey, clubTeams, seasonOrder, teamSeasonId } from './clubs'

export type SeniorityTier = 'platinum' | 'gold' | 'silver'
export const SENIORITY_ORDER: SeniorityTier[] = ['platinum', 'gold', 'silver']
export const SENIORITY_LABEL: Record<SeniorityTier, string> = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver' }
export const SENIORITY_RULE: Record<SeniorityTier, string> = { platinum: '3 saisons MBL ou plus', gold: '2 saisons MBL', silver: '1re saison MBL' }

export const seniorityTier = (seasons: number): SeniorityTier => (seasons >= 3 ? 'platinum' : seasons === 2 ? 'gold' : 'silver')

export interface Seniority { tier: SeniorityTier; seasons: number; computed: number; overridden: boolean }

export function teamSeniority(team: Team, teams: Team[], competitions: Competition[], seasons: Season[], clubs: Pick<Club, 'id' | 'seasons_override'>[] = []): Seniority {
  // saisons du club jusqu'à celle de cette équipe incluse (une équipe 2025-2026 garde son badge de l'époque)
  const order = seasonOrder(seasons)
  const mine = order.indexOf(teamSeasonId(team, competitions) ?? '')
  const ids = new Set(clubTeams(team, teams, competitions, seasons).map((x) => x.seasonId).filter((id): id is string => !!id && (mine < 0 || order.indexOf(id) <= mine)))
  const computed = Math.max(1, ids.size)
  const override = clubs.find((c) => c.id === clubKey(team))?.seasons_override
  const n = override && override > 0 ? override : computed
  return { tier: seniorityTier(n), seasons: n, computed, overridden: !!override && override > 0 && override !== computed }
}

export function seniorityMap(teams: Team[], competitions: Competition[], seasons: Season[], clubs: Pick<Club, 'id' | 'seasons_override'>[] = []) {
  return new Map(teams.map((t) => [t.id, teamSeniority(t, teams, competitions, seasons, clubs)]))
}

/**
 * Couleurs des cartes et des badges. Chaque niveau a un fond, une matière et un effet différents, pour se
 * reconnaître au premier coup d'œil même en petit :
 *  - PLATINUM : carte sombre (noir / bleu nuit), reflet holographique irisé, liseré platine, texte blanc, motif diamant ;
 *  - GOLD : or chaud (#8A6A1F → #F5D77A → #B8892B), reflet métallique, texte brun foncé, liseré doré ;
 *  - SILVER : argent clair (gris perle → blanc → gris acier), métal brossé, texte bleu foncé, liseré gris.
 * Contrastes du texte vérifiés WCAG AA (≥ 4,5:1) sur toute la hauteur du fond.
 */
export interface SeniorityStyle {
  /** cadre métallique (liseré) */ frame: string
  /** fond du recto */ bg: string
  /** matière par-dessus le fond (holographique, reflet or, métal brossé) */ sheen: string
  /** mode de fusion de la matière */ sheenBlend: string
  /** motif discret (diamants pour Platinum) */ pattern?: string
  /** reflet irisé qui suit le curseur / l'inclinaison (Platinum uniquement) */ holo?: string
  /** texte principal sur le fond */ fg: string
  /** texte secondaire */ fgSoft: string
  /** relief du texte (gravé clair sur métal, lueur sur fond sombre) */ textShadow: string
  /** pastille (badge, chips) */ chip: string
  chipText: string
  /** bandeau de stats en bas de carte */ bar: string
  barText: string
  barLabel: string
  /** pastille de niveau (badges, légendes) */ badge: string
  badgeText: string
  /** couleur unie représentative (légende, liserés) */ solid: string
  glow: string
}
const DIAMONDS = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22"><path d="M11 3 L16 11 L11 19 L6 11 Z" fill="none" stroke="white" stroke-opacity=".09" stroke-width="1"/></svg>')}")`
export const SENIORITY_STYLE: Record<SeniorityTier, SeniorityStyle> = {
  platinum: {
    frame: 'linear-gradient(150deg, #FFFFFF 0%, #C9D2DE 18%, #7F8A9C 38%, #F6F9FC 55%, #9AA5B6 75%, #E8EDF4 100%)',
    bg: 'radial-gradient(120% 60% at 50% 0%, #22306B 0%, transparent 62%), linear-gradient(180deg, #121B45 0%, #0A1230 45%, #060A1E 100%)',
    sheen: 'linear-gradient(115deg, transparent 22%, rgb(168 85 247 / .2) 34%, rgb(34 211 238 / .18) 45%, rgb(244 114 182 / .18) 56%, transparent 68%)',
    sheenBlend: 'screen',
    pattern: DIAMONDS,
    holo: 'linear-gradient(105deg, transparent 28%, rgb(196 181 253 / .5) 40%, rgb(103 232 249 / .45) 50%, rgb(249 168 212 / .45) 60%, transparent 72%)',
    fg: '#FFFFFF', fgSoft: '#C3CEEA', textShadow: '0 0 14px rgb(140 170 255 / .45)',
    chip: 'linear-gradient(180deg, #F6F9FC, #AEB8C8)', chipText: '#0A1230',
    bar: 'linear-gradient(180deg, #0E1A3F, #070C22)', barText: '#FFFFFF', barLabel: '#AFC0E6',
    badge: 'linear-gradient(135deg, #2A3A7A 0%, #0A1230 55%, #3B2370 100%)', badgeText: '#FFFFFF',
    solid: '#1E2C63', glow: 'rgb(139 92 246 / .45)',
  },
  gold: {
    frame: 'linear-gradient(150deg, #FFF3C4 0%, #B8892B 30%, #F5D77A 52%, #8A6A1F 78%, #E9C766 100%)',
    bg: 'linear-gradient(180deg, #F5D77A 0%, #E9C766 30%, #D6AC46 60%, #C99A35 85%, #B8892B 100%)',
    sheen: 'linear-gradient(120deg, rgb(138 106 31 / .35) 0%, transparent 22%, rgb(255 248 220 / .65) 40%, transparent 55%, rgb(138 106 31 / .25) 80%, transparent 100%)',
    sheenBlend: 'soft-light',
    fg: '#2B1A00', fgSoft: '#3F2A03', textShadow: '0 1px 0 rgb(255 240 190 / .7)',
    chip: 'linear-gradient(180deg, #3A2600, #1F1400)', chipText: '#F5D77A',
    bar: 'linear-gradient(180deg, #3A2600, #1F1400)', barText: '#F5D77A', barLabel: '#D9BC6A',
    badge: 'linear-gradient(180deg, #F8E08E, #E2BC55)', badgeText: '#2B1A00',
    solid: '#D6AC46', glow: 'rgb(232 185 49 / .5)',
  },
  silver: {
    frame: 'linear-gradient(150deg, #FFFFFF 0%, #AEB6C0 32%, #EEF1F4 52%, #7E8896 78%, #D5DAE0 100%)',
    bg: 'linear-gradient(180deg, #F4F6F8 0%, #E3E7EC 35%, #C9D0D8 72%, #AEB7C2 100%)',
    sheen: 'repeating-linear-gradient(90deg, rgb(255 255 255 / .35) 0 1px, rgb(0 0 0 / .045) 1px 2px, transparent 2px 4px)',
    sheenBlend: 'normal',
    fg: '#0B2350', fgSoft: '#2E4266', textShadow: '0 1px 0 rgb(255 255 255 / .8)',
    chip: 'linear-gradient(180deg, #0B2350, #061433)', chipText: '#FFFFFF',
    bar: 'linear-gradient(180deg, #0B2350, #061433)', barText: '#FFFFFF', barLabel: '#B9C6DE',
    badge: 'linear-gradient(180deg, #FFFFFF, #D3D9E0)', badgeText: '#0B2350',
    solid: '#C9D0D8', glow: 'rgb(120 135 155 / .4)',
  },
}

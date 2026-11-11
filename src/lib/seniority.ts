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

/** Couleurs des cartes et des badges, cohérentes avec la charte MBL (bleu marine #0B2E73, orange #F05A22). */
export interface SeniorityStyle {
  /** cadre métallique */ frame: string
  /** fond du recto */ bg: string
  /** reflet nacré / métal par-dessus le fond */ sheen: string
  /** texte principal sur le fond */ fg: string
  /** texte secondaire */ fgSoft: string
  /** pastille (badge, chips) */ chip: string
  chipText: string
  /** couleur unie représentative (légende, liserés) */ solid: string
  glow: string
}
export const SENIORITY_STYLE: Record<SeniorityTier, SeniorityStyle> = {
  platinum: {
    frame: 'linear-gradient(150deg, #FFFFFF 0%, #DCE8F5 22%, #9FB7D2 45%, #F4F8FF 62%, #B9CDE4 80%, #FFFFFF 100%)',
    bg: 'linear-gradient(180deg, #FFFFFF 0%, #EEF3FA 38%, #D5E1EF 70%, #BCCDE2 100%)',
    sheen: 'conic-gradient(from 200deg at 70% 30%, rgb(255 255 255 / 0), rgb(199 225 255 / .55), rgb(255 236 246 / .45), rgb(214 255 247 / .45), rgb(255 255 255 / 0) 70%)',
    fg: '#0B2E73', fgSoft: '#3D5A8A', chip: 'linear-gradient(180deg, #0B2E73, #061A47)', chipText: '#FFFFFF', solid: '#DCE8F5', glow: 'rgb(170 200 235 / .55)',
  },
  gold: {
    frame: 'linear-gradient(150deg, #FFF3C4 0%, #E8B931 28%, #A87512 52%, #F7D774 74%, #FFF3C4 100%)',
    bg: 'linear-gradient(180deg, #FCE9A6 0%, #EBC453 40%, #C99525 75%, #A87512 100%)',
    sheen: 'radial-gradient(90% 55% at 50% 0%, rgb(255 255 255 / .55), transparent 65%)',
    fg: '#2B1C00', fgSoft: '#5E4410', chip: 'linear-gradient(180deg, #0B2E73, #061A47)', chipText: '#FFE9A3', solid: '#E8B931', glow: 'rgb(232 185 49 / .5)',
  },
  silver: {
    frame: 'linear-gradient(150deg, #FFFFFF 0%, #C9D3DD 28%, #7D8A99 52%, #E6EBF0 74%, #FFFFFF 100%)',
    bg: 'linear-gradient(180deg, #EEF1F4 0%, #CBD3DC 42%, #9EAAB8 78%, #8592A2 100%)',
    sheen: 'radial-gradient(90% 55% at 50% 0%, rgb(255 255 255 / .6), transparent 65%)',
    fg: '#0E1E3A', fgSoft: '#3A4A62', chip: 'linear-gradient(180deg, #0B2E73, #061A47)', chipText: '#FFFFFF', solid: '#C9D3DD', glow: 'rgb(201 211 221 / .45)',
  },
}

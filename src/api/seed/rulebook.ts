// Règlement officiel Ardentia — texte intégral (converti du .docx sans réécriture) et versions.
// Une saison = une version ; les versions précédentes restent consultables (historique).
import type { Rulebook } from '@/types/entities'
import { SEASON_2026_ID } from './season2026'
import V3 from './reglement-v3.md?raw'
import V4 from './reglement-v4.md?raw'

export const RULEBOOK_TITLE = 'Règlement officiel — Football 6 contre 6'

export function buildRulebooks(): Rulebook[] {
  return [
    {
      id: 'rulebook_v4', version: 'v4', title: RULEBOOK_TITLE, date: '2026-11-09', season_id: SEASON_2026_ID, content: V4,
      pdf_url: '/reglement/reglement-ardentia-v4.pdf', status: 'current',
      changes: 'Cumul des cartons jaunes : 3 jaunes = 1 match de suspension (Art. 11.5). Suspension d’au moins 1 match après un carton rouge, alourdie possible par Ardentia (Art. 11.6). Gardien : 4 secondes dans sa moitié de terrain (Art. 4.3).',
    },
    {
      id: 'rulebook_v3', version: 'v3', title: RULEBOOK_TITLE, date: '2026-11-09', content: V3,
      pdf_url: '/reglement/reglement-ardentia-v3.pdf', status: 'archived',
      changes: 'Version remplacée par la v4 (les cartons ne se cumulaient pas d’un match à l’autre).',
    },
  ]
}

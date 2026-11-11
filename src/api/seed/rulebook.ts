// Règlement officiel Ardentia — texte intégral (converti du .docx sans réécriture) et versions.
// Une saison = une version ; les versions précédentes restent consultables (historique).
import type { Rulebook } from '@/types/entities'
import { SEASON_2026_ID } from './season2026'
import V3 from './reglement-v3.md?raw'
import V4 from './reglement-v4.md?raw'
import V9 from './reglement-v9.md?raw'

export const RULEBOOK_TITLE = 'Règlement officiel — Football 6 contre 6'

export function buildRulebooks(): Rulebook[] {
  return [
    {
      id: 'rulebook_v9', version: 'v9', title: RULEBOOK_TITLE, date: '2026-11-11', season_id: SEASON_2026_ID, content: V9,
      pdf_url: '/reglement/reglement-ardentia-v9.pdf', docx_url: '/reglement/REGLEMENT_DE_JEU_ARDENTIA_FOOTBALL_v9.docx', status: 'current',
      changes: 'Règlement v8 d’Ardentia complété du fonctionnement de la plateforme : pré-saison en système suisse et répartition MASTER / CHALLENGER (Art. 17.1), classement de la pré-saison (Art. 17.3), capitaines votants MASTER / CHALLENGER (Art. 19.3), coquilles corrigées (Art. 2.3). Nouveautés du v8 : plus de cumul de jaunes ni de suspension automatique, conseil de discipline (Art. 19), procès-verbaux (Art. 17.7), remplacements par la porte après accord de l’arbitre (Art. 2.4), règle des 4 secondes retirée de l’Art. 11.2.',
    },
    {
      id: 'rulebook_v4', version: 'v4', title: RULEBOOK_TITLE, date: '2026-11-09', content: V4,
      pdf_url: '/reglement/reglement-ardentia-v4.pdf', status: 'archived',
      changes: 'Version remplacée par la v9 (elle prévoyait le cumul des jaunes et une suspension automatique après un rouge). Cumul des cartons jaunes : 3 jaunes = 1 match de suspension (Art. 11.5). Suspension d’au moins 1 match après un carton rouge, alourdie possible par Ardentia (Art. 11.6). Gardien : 4 secondes dans sa moitié de terrain (Art. 4.3).',
    },
    {
      id: 'rulebook_v3', version: 'v3', title: RULEBOOK_TITLE, date: '2026-11-09', content: V3,
      pdf_url: '/reglement/reglement-ardentia-v3.pdf', status: 'archived',
      changes: 'Version remplacée par la v4 (les cartons ne se cumulaient pas d’un match à l’autre).',
    },
  ]
}

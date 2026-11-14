import { describe, expect, it } from 'vitest'
import { GLOSSARY } from './glossary'
import { IPG_TOP25 } from '@/api/seed/season2025.data'
import { matchRating } from './badges'

describe('glossaire', () => {
  it('identifiants uniques', () => {
    expect(new Set(GLOSSARY.map((g) => g.id)).size).toBe(GLOSSARY.length)
  })
  it('la formule IPG brut affichée retrouve les valeurs du fichier 2025 (±2,5)', () => {
    for (const r of IPG_TOP25) {
      const clutch = 3 * r.clutch_goals + r.clutch_assists
      expect(clutch).toBe(r.clutch_score)
      const raw = 3 * r.goals + 2 * r.assists + 2 * r.contribution + r.win_pct - r.card_penalty + 2 * clutch + r.adversity
      expect(Math.abs(raw - r.raw)).toBeLessThan(2.5)
    }
  })
  it('IPG = brut / max × 100', () => {
    const max = Math.max(...IPG_TOP25.map((r) => r.raw))
    for (const r of IPG_TOP25) expect(Math.abs((r.raw / max) * 100 - r.ipg)).toBeLessThan(0.6)
  })
  it("l'exemple de note correspond au calcul du site", () => {
    expect(matchRating({ goals: 1, assists: 1, result: 'W', motm: false, yellow: 0, red: 0, keeper: false, saves: 0, conceded: 0, clean_sheet: false } as never)).toBe(7.7)
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import { applyCompetitionNames, competitionSlug, legacySlugPhase, phaseName, resolveCompetitionNames, standingsPath } from './competitionNames'
import { applyRenameCompetitions, OLD_TAGLINE } from '@/api/seed/migrations'
import { generateLeagueData } from '@/api/seed/generate'
import { XP_LABELS } from './xp'
import { phaseLabel } from './disciplineLabels'

afterEach(() => applyCompetitionNames(undefined))

describe('noms des compétitions (config admin)', () => {
  it('par défaut : MASTER et CHALLENGER, partout', () => {
    expect([phaseName('gold'), phaseName('silver')]).toEqual(['MASTER', 'CHALLENGER'])
    expect(XP_LABELS.importance_gold).toBe('Importance — MASTER')
    expect(phaseLabel({ phase: 'silver', name: 'x' })).toBe('CHALLENGER')
    expect(standingsPath({ phase: 'gold', name: 'MASTER' })).toBe('/classement/master')
  })
  it('modifiable dans l’admin, sans toucher au code', () => {
    applyCompetitionNames({ competition_names: { gold: 'Élite', silver: '  ' } })
    expect([phaseName('gold'), phaseName('silver')]).toEqual(['Élite', 'CHALLENGER'])
    expect(competitionSlug({ phase: 'gold', name: 'Élite' })).toBe('elite')
    expect(resolveCompetitionNames({}).league_phase).toBe('Pré-saison')
  })
  it('anciennes adresses reconnues pour la redirection', () => {
    expect([legacySlugPhase('gold-cup'), legacySlugPhase('Silver-Cup'), legacySlugPhase('master')]).toEqual(['gold', 'silver', undefined])
  })
  it('migration : anciens noms par défaut renommés, noms personnalisés conservés, idempotente', () => {
    const db = {
      Competition: [
        { id: 'g', season_id: 's', name: 'Gold Cup', phase: 'gold' as const }, { id: 's', season_id: 's', name: 'Silver Cup', phase: 'silver' as const },
        { id: 'c', season_id: 's', name: 'Coupe du Président', phase: 'gold' as const },
        { id: 'p', season_id: 's', name: 'Phase de sélection', phase: 'league_phase' as const, split: { gold_to: 10, silver_from: 11, gold_name: 'Gold Cup', silver_name: 'Silver Cup' } },
      ],
      Division: [{ id: 'div_gold', name: 'Gold' }, { id: 'div_silver', name: 'Silver' }],
      Settings: [{ id: 'settings', tagline: OLD_TAGLINE }],
    }
    const out = applyRenameCompetitions(db)
    expect(out.Competition!.map((c) => c.name)).toEqual(['MASTER', 'CHALLENGER', 'Coupe du Président', 'Phase de sélection'])
    expect(out.Competition![3].split).toMatchObject({ gold_name: 'MASTER', silver_name: 'CHALLENGER' })
    expect(out.Division!.map((d) => d.name)).toEqual(['MASTER', 'CHALLENGER'])
    expect(out.Settings![0].tagline).toBe('Le premier championnat inter-entreprises au Maroc')
    expect(applyRenameCompetitions({ ...db, ...out })).toEqual({})
  })
  it('données neuves : plus aucun « Gold Cup » / « Silver Cup » hors texte officiel du règlement', () => {
    const db = generateLeagueData(new Date('2026-11-11T10:00:00'))
    expect(JSON.stringify({ ...db, Rulebook: [] })).not.toMatch(/Gold Cup|Silver Cup/)
  })
})

import { describe, expect, it } from 'vitest'
import { hasPrivate, keepPrivate, splitPrivate } from './privateFields'

describe('données privées', () => {
  it('sépare les champs privés d’un joueur', () => {
    const { pub, priv } = splitPrivate('Player', { id: 'p1', first_name: 'A', birth_date: '1990-01-01', documents: { id_card: { status: 'ok' } }, employment_verified: true })
    expect(pub).toEqual({ id: 'p1', first_name: 'A' })
    expect(priv).toEqual({ birth_date: '1990-01-01', documents: { id_card: { status: 'ok' } }, employment_verified: true })
    expect(hasPrivate('Player', pub)).toBe(false)
  })
  it('contacts d’équipe privés, autres entités inchangées', () => {
    expect(splitPrivate('Team', { id: 't', name: 'X', contact_phone: '06' }).pub).toEqual({ id: 't', name: 'X' })
    expect(splitPrivate('Match', { id: 'm', home_score: 2 }).priv).toBeNull()
  })
  it('une mise à jour publique ne fait pas perdre les champs privés à l’admin', () => {
    expect(keepPrivate('Player', { id: 'p1', first_name: 'B' }, { id: 'p1', first_name: 'A', birth_date: 'x' })).toEqual({ id: 'p1', first_name: 'B', birth_date: 'x' })
  })
})

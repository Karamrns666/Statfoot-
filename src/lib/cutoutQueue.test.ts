import { describe, expect, it } from 'vitest'
import { needsCutout, MAX_CUTOUT_TRIES } from './cutoutQueue'

describe('détourage automatique', () => {
  it('à faire pour toute photo sans version détourée, 3 essais au plus, refait si la photo change', () => {
    expect(needsCutout({})).toBe(false)
    expect(needsCutout({ photo_url: '/a' })).toBe(true)
    expect(needsCutout({ photo_url: '/a', photo_cutout_url: '/a-cut', photo_cutout_source: '/a' })).toBe(false)
    expect(needsCutout({ photo_url: '/a', photo_cutout_url: '/cut' })).toBe(false) // PNG importé à la main
    expect(needsCutout({ photo_url: '/b', photo_cutout_url: '/a-cut', photo_cutout_source: '/a' })).toBe(true)
    expect(needsCutout({ photo_url: '/a', photo_cutout_source: '/a', photo_cutout_tries: MAX_CUTOUT_TRIES - 1 })).toBe(true)
    expect(needsCutout({ photo_url: '/a', photo_cutout_source: '/a', photo_cutout_tries: MAX_CUTOUT_TRIES })).toBe(false)
    expect(needsCutout({ photo_url: '/b', photo_cutout_source: '/a', photo_cutout_tries: MAX_CUTOUT_TRIES })).toBe(true)
    expect(needsCutout({ photo_url: '/a', photo_card_mode: 'original' })).toBe(false) // l'admin a choisi la photo originale
  })
})

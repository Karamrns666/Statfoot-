import { describe, expect, it } from 'vitest'
import { fitSize } from './imageOptimize'
import { focusPos, teamCover } from '@/components/league/TeamBanner'
import type { Team } from '@/types/entities'

describe('images', () => {
  it('redimensionnement : ratio conservé, jamais agrandi', () => {
    expect(fitSize(4000, 3000, 2000, 2000)).toEqual({ w: 2000, h: 1500 })
    expect(fitSize(800, 1200, 1000, 1000)).toEqual({ w: 667, h: 1000 })
    expect(fitSize(300, 200, 2000, 2000)).toEqual({ w: 300, h: 200 })
  })
  it('en-tête équipe : image choisie, sinon la première ; recadrage mobile distinct', () => {
    const t = { id: 't', name: 'T', short_name: 'T', media: [
      { id: 'a', url: '/a', kind: 'team_photo', focus_x: 30, focus_y: 20 },
      { id: 'b', url: '/b', kind: 'poster', focus_x: 50, focus_y: 50, focus_x_mobile: 70, focus_y_mobile: 10 },
    ] } as Team
    expect(teamCover(t)?.id).toBe('a')
    expect(teamCover({ ...t, cover_media_id: 'b' })?.id).toBe('b')
    expect(teamCover({ ...t, media: [] })).toBeUndefined()
    expect(focusPos(t.media![0])).toBe('30% 20%')
    expect(focusPos(t.media![0], true)).toBe('30% 20%') // repli sur le recadrage ordinateur
    expect(focusPos(t.media![1], true)).toBe('70% 10%')
  })
})

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { patchRulebookEmployees, RULE_EMPLOYEE, RULE_RESERVE } from './migrations'

describe('règlement : joueurs salariés (Art. 2.3 / 17.4)', () => {
  const md = readFileSync('src/api/seed/reglement-v9.md', 'utf8')
  const out = patchRulebookEmployees(md)
  const sec = (t: string, s = out) => s.slice(s.indexOf(t), s.indexOf('\n## ', s.indexOf(t) + 5))
  it('2.3 : obligation après le 1er paragraphe et sanction à la fin', () => {
    const a = sec('## 2.3').split('\n\n')
    expect(a[2]).toBe(RULE_EMPLOYEE)
    expect(a.at(-1)!.trim()).toBe(RULE_RESERVE)
    expect(sec('## 2.3')).toContain('48 heures')
    console.log(sec('## 2.3'))
  })
  it('17.4 : sanction entre les deux paragraphes', () => {
    const b = sec('## 17.4').split('\n\n')
    expect(b[2]).toBe(RULE_RESERVE)
    expect(b[3]).toMatch(/^Ardentia examinera/)
    console.log(sec('## 17.4'))
  })
  it('idempotent et reste du texte inchangé', () => {
    expect(patchRulebookEmployees(out)).toBe(out)
    expect(out.replace('\n\n' + RULE_EMPLOYEE, '').replaceAll('\n\n' + RULE_RESERVE, '').replace(/\s+$/, '')).toBe(md.replace(/\s+$/, ''))
  })
})

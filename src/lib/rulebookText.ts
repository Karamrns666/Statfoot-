// Découpage du texte intégral du règlement (markdown converti du .docx) en articles et sections,
// pour le sommaire, les ancres (/reglement#art-17-3) et la recherche. Le texte n'est jamais réécrit.
import { artAnchor } from './reglement'

export type Block = { kind: 'p'; text: string } | { kind: 'ul' | 'ol'; items: string[] }
export interface RuleSection { id: string; ref: string; title: string; level: 1 | 2; blocks: Block[] }

/** « ARTICLE 17 — ORGANISATION… » → ref 17 ; « 17.3 Critères… » → ref 17.3 ; « PRÉAMBULE » → preambule */
function refOf(title: string, level: 1 | 2) {
  if (level === 1) { const m = title.match(/^ARTICLE\s+(\d+)/i); return m ? m[1] : 'preambule' }
  const m = title.match(/^(\d+\.\d+)/); return m ? m[1] : title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

export function parseRulebook(md: string): RuleSection[] {
  const out: RuleSection[] = []
  let cur: RuleSection | null = null
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null
  const flush = () => { if (list && cur) cur.blocks.push(list); list = null }
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd()
    const h = line.match(/^(#{1,2})\s+(.*)$/)
    if (h) {
      flush()
      const level = h[1].length as 1 | 2
      const title = h[2].trim()
      const ref = refOf(title, level)
      cur = { id: ref === 'preambule' ? 'art-preambule' : artAnchor(ref), ref, title, level, blocks: [] }
      out.push(cur)
      continue
    }
    if (!cur) continue
    if (!line.trim()) continue
    const li = line.match(/^\s*(?:(-)|(\d+)\.)\s+(.*)$/)
    if (li) {
      const kind = li[1] ? 'ul' : 'ol'
      if (!list || list.kind !== kind) { flush(); list = { kind, items: [] } }
      list.items.push(li[3].trim())
      continue
    }
    flush()
    cur.blocks.push({ kind: 'p', text: line.trim() })
  }
  flush()
  return out
}

/** Titre lisible : « ARTICLE 17 — ORGANISATION DE LA COMPÉTITION » → « Article 17 — Organisation de la compétition » */
export function prettyTitle(t: string) {
  if (/^ARTICLE/i.test(t) || t === t.toUpperCase()) {
    const s = t.toLowerCase()
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/— (\p{L})/u, (_m, c: string) => `— ${c.toUpperCase()}`)
  }
  return t
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
export const sectionText = (s: RuleSection) => [s.title, ...s.blocks.flatMap((b) => (b.kind === 'p' ? [b.text] : b.items))].join(' ').replace(/\*\*/g, '')
export function matchesQuery(s: RuleSection, q: string) { return !q.trim() || norm(sectionText(s)).includes(norm(q.trim())) }
export function countMatches(s: RuleSection, q: string) {
  if (!q.trim()) return 0
  const hay = norm(sectionText(s)), needle = norm(q.trim())
  let n = 0, i = hay.indexOf(needle)
  while (i >= 0) { n++; i = hay.indexOf(needle, i + needle.length) }
  return n
}
/** Découpe un texte en morceaux { text, hit } pour surligner la recherche (insensible aux accents et à la casse). */
export function highlight(text: string, q: string): { text: string; hit: boolean }[] {
  const needle = norm(q.trim())
  if (!needle) return [{ text, hit: false }]
  const hay = norm(text)
  const parts: { text: string; hit: boolean }[] = []
  let at = 0, i = hay.indexOf(needle)
  while (i >= 0) {
    if (i > at) parts.push({ text: text.slice(at, i), hit: false })
    parts.push({ text: text.slice(i, i + needle.length), hit: true })
    at = i + needle.length; i = hay.indexOf(needle, at)
  }
  if (at < text.length) parts.push({ text: text.slice(at), hit: false })
  return parts
}

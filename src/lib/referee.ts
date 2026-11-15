// Arbitres et évaluation de fin de match : critères, note globale, règle de verrouillage (24 h).
import type { Referee, RefereeEvaluation } from '@/types/entities'

export type Criterion = keyof RefereeEvaluation['scores']
export const CRITERIA: { key: Criterion; label: string; help: string }[] = [
  { key: 'game', label: 'Gestion du jeu et des fautes', help: 'Fautes sifflées à bon escient, avantage, fluidité du match' },
  { key: 'discipline', label: 'Discipline', help: 'Cartons justes et cohérents d’une équipe à l’autre' },
  { key: 'rules', label: 'Respect des règles', help: '6 contre 6, remplacements, chronomètre, temps additionnel' },
  { key: 'communication', label: 'Communication avec les capitaines', help: 'Explications, calme, autorité' },
  { key: 'punctuality', label: 'Ponctualité et tenue', help: 'Présent à l’heure, tenue correcte' },
]

export const refereeName = (r?: Pick<Referee, 'first_name' | 'last_name'> | null) => (r ? `${r.first_name} ${r.last_name}`.trim() : '')

/** Note globale = moyenne des 5 critères, au dixième */
export function overallScore(scores: Partial<RefereeEvaluation['scores']>) {
  const v = CRITERIA.map((c) => scores[c.key]).filter((x): x is number => typeof x === 'number' && x >= 1)
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : 0
}

export const LOCK_MS = 24 * 3600 * 1000
/** Modifiable par un admin pendant 24 h après la saisie, ensuite seulement par un super-admin (journalisé) */
export function canEditEvaluation(ev: Pick<RefereeEvaluation, 'submitted_at'> | undefined, role: string | undefined, now = Date.now()) {
  if (!ev) return true
  if (role === 'super_admin') return true
  return now - Date.parse(ev.submitted_at) < LOCK_MS
}
export const isLocked = (ev: Pick<RefereeEvaluation, 'submitted_at'>, now = Date.now()) => now - Date.parse(ev.submitted_at) >= LOCK_MS

/** Moyennes d'un arbitre par critère sur ses évaluations */
export function refereeStats(evals: RefereeEvaluation[]) {
  const avg = (k: Criterion) => { const v = evals.map((e) => e.scores[k]).filter((x) => x >= 1); return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null }
  return {
    count: evals.length,
    by: Object.fromEntries(CRITERIA.map((c) => [c.key, avg(c.key)])) as Record<Criterion, number | null>,
    overall: evals.length ? Math.round((evals.reduce((a, e) => a + e.overall, 0) / evals.length) * 10) / 10 : null,
  }
}

/** Export CSV (séparateur ; pour Excel en français) */
export function evaluationsCsv(rows: { date: string; match: string; referee: string; ev: RefereeEvaluation }[]) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const head = ['Date', 'Match', 'Arbitre', ...CRITERIA.map((c) => c.label), 'Note globale', 'Commentaire', 'Saisie par', 'Saisie le']
  const lines = rows.map((r) => [r.date, r.match, r.referee, ...CRITERIA.map((c) => r.ev.scores[c.key]), String(r.ev.overall).replace('.', ','), r.ev.comment, r.ev.author_email, r.ev.submitted_at].map(esc).join(';'))
  return '﻿' + [head.map(esc).join(';'), ...lines].join('\r\n')
}

// Arbitres : liste (nom, téléphone, association, actif), moyennes par critère, matchs arbitrés, historique des
// évaluations (privées), export CSV et impression / PDF.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Pencil, Plus, Printer } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { AdminPage } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { CRITERIA, evaluationsCsv, refereeName, refereeStats } from '@/lib/referee'
import { fmtDate } from '@/lib/format'
import type { Referee } from '@/types/entities'
import { cn } from '@/lib/utils'

const fmt = (v: number | null) => (v == null ? '–' : v.toFixed(1).replace('.', ','))

export default function RefereesAdmin() {
  const { db } = useData()
  const L = useLookup()
  const refs = (db.Referee ?? []).slice().sort((a, b) => Number(b.active !== false) - Number(a.active !== false) || refereeName(a).localeCompare(refereeName(b)))
  const evals = db.RefereeEvaluation ?? []
  const [edit, setEdit] = useState<Partial<Referee> | null>(null)
  const [sel, setSel] = useState<string>('')
  const matchLabel = (id: string) => { const m = db.Match.find((x) => x.id === id); return m ? `${m.number ?? ''} ${L.team.get(m.home_team_id)?.short_name ?? ''} ${m.home_score ?? ''}-${m.away_score ?? ''} ${L.team.get(m.away_team_id)?.short_name ?? ''}`.trim() : id }
  const rows = useMemo(() => evals.filter((e) => !sel || e.referee_id === sel).map((ev) => ({ ev, date: (db.Match.find((m) => m.id === ev.match_id)?.date ?? ev.submitted_at).slice(0, 10), match: matchLabel(ev.match_id), referee: ev.referee_name ?? '' })).sort((a, b) => b.date.localeCompare(a.date)), [evals, sel, db.Match]) // eslint-disable-line react-hooks/exhaustive-deps
  const save = async () => {
    if (!edit?.first_name?.trim() || !edit.last_name?.trim()) { toast.error('Nom et prénom obligatoires'); return }
    if (edit.id) await base44.entities.Referee.update(edit.id, edit); else await base44.entities.Referee.create({ active: true, ...edit } as Referee)
    toast.success('Arbitre enregistré'); setEdit(null)
  }
  const csv = () => {
    const blob = new Blob([evaluationsCsv(rows)], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `evaluations-arbitres-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }
  return (
    <AdminPage title="Arbitres" subtitle="Évaluations privées : jamais affichées sur le site public."
      actions={<><Button variant="outline" onClick={csv} disabled={!rows.length}><Download />Export CSV</Button><Button variant="outline" onClick={() => print()}><Printer />Imprimer / PDF</Button><Button onClick={() => setEdit({ association: 'Association Sifflé d’Or', active: true })}><Plus />Nouvel arbitre</Button></>}>
      {edit && (
        <Card className="no-print mb-4"><CardContent className="grid gap-2 pt-4 sm:grid-cols-2 lg:grid-cols-5">
          <Input placeholder="Prénom" value={edit.first_name ?? ''} onChange={(e) => setEdit({ ...edit, first_name: e.target.value })} />
          <Input placeholder="Nom" value={edit.last_name ?? ''} onChange={(e) => setEdit({ ...edit, last_name: e.target.value })} />
          <Input placeholder="Téléphone" inputMode="tel" value={edit.phone ?? ''} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
          <Input placeholder="Association" value={edit.association ?? ''} onChange={(e) => setEdit({ ...edit, association: e.target.value })} />
          <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={edit.active !== false} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />Actif</label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-5"><Button onClick={save}>Enregistrer</Button><Button variant="ghost" onClick={() => setEdit(null)}>Annuler</Button></div>
        </CardContent></Card>
      )}
      <div className="print-area space-y-4">
        <Card>
          <CardHeader><CardTitle>Moyennes par arbitre</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-muted-foreground"><th className="px-3 py-2">Arbitre</th><th className="px-2">Matchs</th><th className="px-2">Évals</th>{CRITERIA.map((c) => <th key={c.key} className="px-2">{c.label}</th>)}<th className="px-2">Globale</th><th className="no-print" /></tr></thead>
              <tbody>
                {refs.map((r) => {
                  const st = refereeStats(evals.filter((e) => e.referee_id === r.id))
                  return (
                    <tr key={r.id} className={cn('cursor-pointer border-t border-white/5 hover:bg-white/5', sel === r.id && 'bg-neon/10', r.active === false && 'opacity-60')} onClick={() => setSel(sel === r.id ? '' : r.id)}>
                      <td className="px-3 py-2"><b>{refereeName(r)}</b><div className="text-xs text-muted-foreground">{r.association}{r.phone ? ` · ${r.phone}` : ''}{r.active === false ? ' · inactif' : ''}</div></td>
                      <td className="num px-2">{db.Match.filter((m) => m.referee_id === r.id).length}</td>
                      <td className="num px-2">{st.count}</td>
                      {CRITERIA.map((c) => <td key={c.key} className="num px-2">{fmt(st.by[c.key])}</td>)}
                      <td className="num px-2 font-bold text-amber-200">{fmt(st.overall)}</td>
                      <td className="no-print px-2"><Button size="icon" variant="ghost" aria-label={`Modifier ${refereeName(r)}`} onClick={(e) => { e.stopPropagation(); setEdit(r) }}><Pencil /></Button></td>
                    </tr>
                  )
                })}
                {!refs.length && <tr><td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">Aucun arbitre : ajoutez-en un, ou choisissez-le directement depuis le match centre.</td></tr>}
              </tbody>
            </table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Historique des évaluations{sel ? ` — ${refereeName(refs.find((r) => r.id === sel))}` : ''}</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {!rows.length && <p className="text-muted-foreground">Aucune évaluation pour l’instant.</p>}
            {rows.map(({ ev, date, match, referee }) => (
              <div key={ev.id} className="rounded-xl border border-white/10 p-3">
                <div className="flex flex-wrap items-baseline gap-x-3"><b>{fmtDate(date)}</b><Link className="text-neon hover:underline" to={`/admin/feuille/${ev.match_id}`}>{match}</Link><span className="text-muted-foreground">{referee}</span><span className="ml-auto font-display text-xl text-amber-200">{fmt(ev.overall)}/5</span></div>
                <div className="mt-1 text-xs text-muted-foreground">{CRITERIA.map((c) => `${c.label} ${ev.scores[c.key]}`).join(' · ')}</div>
                {ev.comment && <p className="mt-1">« {ev.comment} »</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminPage>
  )
}

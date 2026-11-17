// Feuille de match imprimable / PDF (« Imprimer » → « Enregistrer en PDF »). Version publique sans l'évaluation.
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { buildMatchSheet, type SheetTeam } from '@/lib/matchSheet'
import { Button } from '@/components/ui/button'
import { fmtDateTime } from '@/lib/format'

export default function MatchSheetPrint() {
  const { id = '' } = useParams()
  const { db } = useData()
  const [priv, setPriv] = useState(true)
  const sheet = useMemo(() => buildMatchSheet(id, { private: priv }), [id, priv, db]) // eslint-disable-line react-hooks/exhaustive-deps
  if (!sheet) return <p className="p-6">Match introuvable.</p>
  const T = ({ t }: { t: SheetTeam }) => (
    <section className="break-inside-avoid">
      <h3 className="mb-1 text-lg font-black">{t.name}</h3>
      <p className="text-xs">Titulaires : {t.starters.join(', ') || '—'}<br />Remplaçants : {t.substitutes.join(', ') || '—'}<br />Gardien : {t.goalkeeper || '—'} · Capitaine : {t.captain || '—'}</p>
      <div className="mt-2 overflow-x-auto"><table className="w-full border-collapse text-xs">
        <thead><tr>{['N°', 'Joueur', 'Min.', 'Buts', 'Passes', 'Tirs', 'Cadrés', 'Arrêts', 'J', 'R'].map((h) => <th key={h} className="border border-black/30 px-1 py-0.5 text-left">{h}</th>)}</tr></thead>
        <tbody>{t.players.map((p) => <tr key={p.name}>{[p.number ?? '', p.name, p.minutes ?? '', p.goals, p.assists, p.shots, p.on_target, p.saves, p.yellow, p.red].map((v, i) => <td key={i} className="border border-black/30 px-1 py-0.5">{v || (i > 1 ? '' : v)}</td>)}</tr>)}</tbody>
      </table></div>
    </section>
  )
  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost" size="sm"><Link to="/admin/matchs"><ArrowLeft />Matchs</Link></Button>
        <label className="inline-flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={!priv} onChange={(e) => setPriv(!e.target.checked)} />Version publique (sans l’évaluation de l’arbitre)</label>
        <Button className="ml-auto" onClick={() => print()}><Printer />Imprimer / PDF</Button>
      </div>
      <article className="print-area space-y-4 rounded-xl bg-white p-6 text-black">
        <header className="flex items-start justify-between gap-4 border-b border-black/20 pb-3">
          <div>
            <div className="text-xs uppercase tracking-wider">Morocco Business League · Feuille de match{priv ? ' · CONFIDENTIEL' : ''}</div>
            <h1 className="text-2xl font-black">{sheet.home.name} {sheet.home.score ?? '–'} - {sheet.away.score ?? '–'} {sheet.away.name}</h1>
            <p className="text-sm">{sheet.number} · {sheet.competition}{sheet.round ? ` · Journée ${sheet.round}` : ''} · {sheet.date ? fmtDateTime(sheet.date) : 'date à fixer'} · {sheet.pitch ?? ''}</p>
            <p className="text-sm">Arbitre : <b>{sheet.referee ?? 'non renseigné'}</b>{sheet.penalties ? ` · Tirs au but : ${sheet.penalties}` : ''}{sheet.motm ? ` · Homme du match : ${sheet.motm}` : ''}</p>
            {sheet.forfeit && <p className="text-sm font-bold text-red-700">{sheet.forfeit}</p>}
          </div>
          <img src="/brand/mbl-logo.png" alt="" className="h-16 w-auto" />
        </header>
        <section><h3 className="font-black">Buts</h3>
          <ul className="text-sm">{sheet.goals.map((g, i) => <li key={i}>{g.minute} {g.team} — {g.scorer}{g.kind ? ' (penalty)' : ''}{g.assist ? `, passe ${g.assist}` : ''}</li>)}{!sheet.goals.length && <li>—</li>}</ul>
        </section>
        <section><h3 className="font-black">Entrées et sorties</h3>
          <ul className="text-sm">{(sheet.changes ?? []).map((c, i) => <li key={i}>{c.minute} {c.team} — {c.in ? `entre ${c.in}` : ''}{c.in && c.out ? ', ' : ''}{c.out ? `sort ${c.out}` : ''}</li>)}{!sheet.changes?.length && <li>—</li>}</ul>
        </section>
        <section><h3 className="font-black">Cartons</h3>
          <ul className="text-sm">{sheet.cards.map((c, i) => <li key={i}>{c.minute} {c.team} — {c.player} ({c.type})</li>)}{!sheet.cards.length && <li>—</li>}</ul>
        </section>
        <div className="grid gap-4 md:grid-cols-2 [&>*]:min-w-0"><T t={sheet.home} /><T t={sheet.away} /></div>
        {priv && (sheet.reserve || sheet.notes) && <section><h3 className="font-black">Réserves et incidents</h3><p className="text-sm">{sheet.reserve}{sheet.reserve && sheet.notes ? ' · ' : ''}{sheet.notes}</p></section>}
        {priv && (
          <section className="rounded-lg border border-black/30 p-3"><h3 className="font-black">Évaluation de l’arbitre (privée)</h3>
            {sheet.evaluation ? <>
              <ul className="text-sm">{sheet.evaluation.scores.map((s) => <li key={s.label}>{s.label} : {s.value}/5</li>)}</ul>
              <p className="text-sm font-bold">Note globale : {sheet.evaluation.overall.toFixed(1).replace('.', ',')}/5</p>
              {sheet.evaluation.comment && <p className="text-sm">« {sheet.evaluation.comment} »</p>}
              <p className="text-xs">Saisie par {sheet.evaluation.by} le {fmtDateTime(sheet.evaluation.at)}</p>
            </> : <p className="text-sm">Pas encore saisie.</p>}
          </section>
        )}
        <footer className="text-xs text-black/60">Document généré le {fmtDateTime(sheet.generated_at)} · ardentia-foot.com</footer>
      </article>
    </div>
  )
}

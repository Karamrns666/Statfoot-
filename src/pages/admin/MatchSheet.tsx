// Feuille de match officielle : se remplit depuis le Match Center, signatures arbitre + responsable, impression / PDF.
import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Printer, Wand2, PenLine, Radio, Save } from 'lucide-react'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { useAuth } from '@/hooks/useAuth'
import { useNow } from '@/hooks/useNow'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { TeamLogo } from '@/components/league/Identity'
import { SignaturePad } from '@/components/matchcenter/SignaturePad'
import { toast } from '@/components/ui/toast'
import { possession, sortEvents, teamStats, fmtMinute, fmtScore, PERIOD_LABEL } from '@/lib/matchEngine'
import { STAGE_LABELS } from '@/lib/schedule'
import { isKnockout } from '@/lib/stats'
import { EVENT_LABEL, fmtDateTime, playerName, STATUS_LABEL } from '@/lib/format'
import type { MatchStatus, MatchTeamStats } from '@/types/entities'

const STAT_FIELDS: { k: keyof MatchTeamStats; l: string }[] = [{ k: 'possession', l: 'Possession %' }, { k: 'shots', l: 'Tirs' }, { k: 'shots_on_target', l: 'Tirs cadrés' }, { k: 'corners', l: 'Corners' }, { k: 'fouls', l: 'Fautes' }, { k: 'offsides', l: 'Hors-jeu' }, { k: 'passes', l: 'Passes' }, { k: 'passes_completed', l: 'Passes réussies' }, { k: 'yellow_cards', l: 'Cartons jaunes' }, { k: 'red_cards', l: 'Cartons rouges' }, { k: 'saves', l: 'Arrêts' }]

export default function MatchSheet() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const { db, settings } = useData()
  const L = useLookup()
  const { user } = useAuth()
  const now = useNow(5000)
  const m = db.Match.find((x) => x.id === id)
  const events = sortEvents(db.MatchEvent.filter((e) => e.match_id === id))
  const [sig, setSig] = useState({ ref: m?.sheet?.referee_signature, mgr: m?.sheet?.manager_signature })
  const [notes, setNotes] = useState(m?.sheet?.notes ?? '')
  useEffect(() => { if (sp.get('print') && m) setTimeout(() => window.print(), 600) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!m) return <div>Match introuvable</div>
  const comp = L.competition.get(m.competition_id)
  const ls = L.live.get(m.id)
  const signed = m.sheet?.status === 'signed'
  const stats = (tid: string) => db.MatchTeamStats.find((s) => s.match_id === m.id && s.team_id === tid && (s.period ?? 'full') === 'full')

  const fill = async () => {
    for (const period of ['full', '1H', '2H'] as const) {
      const st = teamStats(m, events, ls, Date.now(), period === 'full' ? undefined : period)
      for (const [side, tid] of [['home', m.home_team_id], ['away', m.away_team_id]] as const) {
        const s = st[side]
        const row = { match_id: m.id, team_id: tid, period, possession: s.possession, shots: s.shots, shots_on_target: s.shots_on_target, corners: s.corners, fouls: s.fouls, offsides: s.offsides, yellow_cards: s.yellow, red_cards: s.red, saves: s.saves, source: 'match_center' as const }
        const cur = db.MatchTeamStats.find((x) => x.match_id === m.id && x.team_id === tid && (x.period ?? 'full') === period)
        if (cur) await base44.entities.MatchTeamStats.update(cur.id, row); else await base44.entities.MatchTeamStats.create(row)
      }
    }
    await base44.entities.Match.update(m.id, { sheet: { ...(m.sheet ?? {}), status: signed ? 'signed' : 'filled', filled_at: new Date().toISOString(), filled_by: user?.full_name ?? user?.email, actions_count: events.filter((e) => !e.auto).length } })
    toast.success('Feuille remplie depuis le Match Center')
  }
  const setStat = async (tid: string, k: keyof MatchTeamStats, v: number) => {
    const cur = stats(tid)
    if (cur) await base44.entities.MatchTeamStats.update(cur.id, { [k]: v, source: 'manual' })
    else await base44.entities.MatchTeamStats.create({ match_id: m.id, team_id: tid, period: 'full', [k]: v, source: 'manual' })
  }
  const sign = async () => {
    if (!sig.ref || !sig.mgr) { toast.error('Les deux signatures sont requises'); return }
    await base44.entities.Match.update(m.id, { sheet: { ...(m.sheet ?? {}), status: 'signed', referee_signature: sig.ref, manager_signature: sig.mgr, signed_at: new Date().toISOString(), notes } })
    toast.success('Feuille de match validée et signée')
  }
  const goals = events.filter((e) => e.type === 'goal' || e.type === 'own_goal')
  const cards = events.filter((e) => e.type === 'yellow_card' || e.type === 'second_yellow' || e.type === 'red_card')
  const subs = events.filter((e) => e.type === 'substitution')
  const kicks = events.filter((e) => e.period === 'PENS')
  const motm = m.motm_player_id ? L.player.get(m.motm_player_id) : undefined
  const pos = possession(ls, now)
  return (
    <div className="sheet mx-auto max-w-5xl">
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <Button asChild variant="ghost"><Link to="/admin/matchs"><ArrowLeft />Matchs</Link></Button>
        <Button asChild variant="outline"><Link to={`/admin/match-center/${m.id}`}><Radio />Match Center</Link></Button>
        <Button variant="outline" onClick={fill} disabled={signed}><Wand2 />Remplir depuis le Match Center</Button>
        <Button onClick={() => window.print()}><Printer />Imprimer / PDF</Button>
      </div>
      {m.sheet?.filled_at && <div className="no-print mb-4 rounded-xl bg-neon/10 px-4 py-2 text-sm">Remplie automatiquement le {fmtDateTime(m.sheet.filled_at)} par {m.sheet.filled_by} · {m.sheet.actions_count} actions · Score {fmtScore(m)}</div>}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
          <div><div className="title-caps text-2xl">Feuille de match officielle</div><div className="text-sm text-muted-foreground">{settings.league_name} · {db.Season.find((s) => s.id === m.season_id)?.name}</div></div>
          <div className="text-right text-sm"><div><b>{comp?.name}</b> · {isKnockout(m) ? STAGE_LABELS[m.stage!] : `Journée ${m.round}`}</div><div>{fmtDateTime(m.date)}</div><div>{m.pitch}</div></div>
        </div>
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-4">
          <div className="flex items-center gap-3"><TeamLogo team={L.team.get(m.home_team_id)} size={48} /><span className="title-caps text-xl">{L.team.get(m.home_team_id)?.name}</span></div>
          <div className="text-center"><div className="num text-5xl">{m.home_score ?? '-'} - {m.away_score ?? '-'}</div><div className="text-xs">MT {m.home_ht_score ?? '-'}-{m.away_ht_score ?? '-'}{m.extra_time ? ' · après prolongation' : ''}{m.penalties ? ` · TAB ${m.home_pens}-${m.away_pens}` : ''}</div></div>
          <div className="flex items-center justify-end gap-3"><span className="title-caps text-xl">{L.team.get(m.away_team_id)?.name}</span><TeamLogo team={L.team.get(m.away_team_id)} size={48} /></div>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-3">
          <label className="flex items-center gap-2">Statut
            <select disabled={signed} className="no-print h-9 flex-1 rounded-lg border border-input bg-night-950 px-2" value={m.status} onChange={(e) => base44.entities.Match.update(m.id, { status: e.target.value as MatchStatus })}>{Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
            <span className="hidden print:inline">{STATUS_LABEL[m.status]}</span></label>
          <label className="flex items-center gap-2">Arbitre <Input disabled={signed} className="h-9" defaultValue={m.referee} onBlur={(e) => base44.entities.Match.update(m.id, { referee: e.target.value })} /></label>
          <label className="flex items-center gap-2">Assistants <Input disabled={signed} className="h-9" defaultValue={m.assistant_referees?.join(', ')} onBlur={(e) => base44.entities.Match.update(m.id, { assistant_referees: e.target.value.split(',').map((x) => x.trim()).filter(Boolean) })} /></label>
        </div>
        {/* compositions */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[m.home_team_id, m.away_team_id].map((tid) => {
            const lu = db.Lineup.find((l) => l.match_id === m.id && l.team_id === tid)
            const entered = new Set(subs.filter((e) => e.team_id === tid).map((e) => e.player_id))
            return (
              <div key={tid} className="rounded-xl border border-white/10 p-3">
                <div className="mb-2 font-bold">{L.team.get(tid)?.name} {lu?.validated ? <Badge variant="success">Compo validée</Badge> : <Badge variant="warning">Compo non validée</Badge>}</div>
                <table className="w-full text-sm"><tbody>
                  {(lu?.starter_ids ?? []).map((pid) => <tr key={pid}><td className="w-8">{lu?.numbers?.[pid] ?? L.player.get(pid)?.number}</td><td>{playerName(L.player.get(pid))}</td><td className="text-right text-xs">{lu?.goalkeeper_id === pid && 'G '}{lu?.captain_id === pid && 'C'}</td></tr>)}
                  <tr><td colSpan={3} className="pt-2 text-xs font-bold uppercase text-muted-foreground">Remplaçants</td></tr>
                  {(lu?.substitute_ids ?? []).map((pid) => <tr key={pid} className={entered.has(pid) ? '' : 'opacity-60'}><td>{lu?.numbers?.[pid] ?? L.player.get(pid)?.number}</td><td>{playerName(L.player.get(pid))}</td><td className="text-right text-xs">{entered.has(pid) ? 'entré en jeu' : ''}</td></tr>)}
                </tbody></table>
              </div>
            )
          })}
        </div>
        {/* actions */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
          <div><div className="mb-1 font-bold">Buts</div>{goals.map((e) => <div key={e.id}>{fmtMinute(e.minute, e.added_minute)} {playerName(L.player.get(e.player_id ?? '')) || e.player_name_free} ({L.team.get(e.type === 'own_goal' ? (e.team_id === m.home_team_id ? m.away_team_id : m.home_team_id) : e.team_id)?.short_name}){e.type === 'own_goal' ? ' csc' : e.goal_kind === 'penalty' ? ' pen.' : ''}{e.related_player_id ? ` — passe ${playerName(L.player.get(e.related_player_id))}` : ''}</div>)}{!goals.length && '—'}</div>
          <div><div className="mb-1 font-bold">Cartons</div>{cards.map((e) => <div key={e.id}>{fmtMinute(e.minute, e.added_minute)} {e.type === 'yellow_card' ? '🟨' : e.type === 'second_yellow' ? '🟨🟥' : '🟥'} {playerName(L.player.get(e.player_id ?? '')) ?? 'Joueur inconnu'} ({L.team.get(e.team_id)?.short_name})</div>)}{!cards.length && '—'}</div>
          <div><div className="mb-1 font-bold">Remplacements</div>{subs.map((e) => <div key={e.id}>{fmtMinute(e.minute, e.added_minute)} {L.player.get(e.player_id ?? '')?.last_name} ↔ {L.player.get(e.related_player_id ?? '')?.last_name} ({L.team.get(e.team_id)?.short_name})</div>)}{!subs.length && '—'}</div>
        </div>
        {kicks.length > 0 && <div className="mt-3 text-sm"><b>{PERIOD_LABEL.PENS}</b> : {kicks.map((k) => `${L.team.get(k.team_id)?.short_name} ${L.player.get(k.player_id ?? '')?.last_name ?? ''} ${k.type === 'shootout_scored' ? '✓' : '✕'}`).join(' · ')}</div>}
        <div className="mt-3 text-sm"><b>Homme du match :</b> {motm ? playerName(motm) : '—'} · <b>Actions saisies :</b> {events.filter((e) => !e.auto).length} {events.length ? `(${[...new Set(events.map((e) => EVENT_LABEL[e.type]))].slice(0, 6).join(', ')}…)` : ''}</div>
        {/* stats collectives */}
        <div className="mt-4 overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="text-xs uppercase text-muted-foreground"><th className="text-left">Statistiques collectives</th><th>{L.team.get(m.home_team_id)?.short_name}</th><th>{L.team.get(m.away_team_id)?.short_name}</th></tr></thead>
          <tbody>{STAT_FIELDS.map((f) => <tr key={f.k} className="border-t border-white/5"><td className="py-1">{f.l}</td>{[m.home_team_id, m.away_team_id].map((tid) => <td key={tid} className="text-center"><input disabled={signed} type="number" className="no-print h-8 w-16 rounded border border-input bg-night-950 text-center" value={(stats(tid)?.[f.k] as number | undefined) ?? (f.k === 'possession' && ls ? (tid === m.home_team_id ? pos.home_pct : pos.away_pct) : '')} onChange={(e) => setStat(tid, f.k, +e.target.value)} /><span className="hidden print:inline">{(stats(tid)?.[f.k] as number | undefined) ?? '-'}</span></td>)}</tr>)}</tbody>
        </table></div>
        {/* validation */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><div className="mb-1 flex items-center gap-1 text-sm font-bold"><PenLine className="size-4" />Signature de l'arbitre</div>{signed && m.sheet?.referee_signature ? <img src={m.sheet.referee_signature} alt="Signature arbitre" className="h-28 rounded bg-white" /> : <SignaturePad value={sig.ref} onChange={(v) => setSig({ ...sig, ref: v })} />}</div>
          <div><div className="mb-1 flex items-center gap-1 text-sm font-bold"><PenLine className="size-4" />Signature du responsable compétition</div>{signed && m.sheet?.manager_signature ? <img src={m.sheet.manager_signature} alt="Signature responsable" className="h-28 rounded bg-white" /> : <SignaturePad value={sig.mgr} onChange={(v) => setSig({ ...sig, mgr: v })} />}</div>
        </div>
        <Textarea disabled={signed} className="mt-3" placeholder="Observations (réserves, incidents…)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="mt-3 flex items-center justify-between">
          {signed ? <Badge variant="success">Validée numériquement le {fmtDateTime(m.sheet?.signed_at)}</Badge> : <span className="text-xs text-muted-foreground">Validation numérique : les deux signatures sont nécessaires.</span>}
          {!signed && <Button className="no-print" onClick={sign}><Save />Valider et signer</Button>}
          {signed && user?.role === 'super_admin' && <Button variant="ghost" className="no-print" onClick={() => base44.entities.Match.update(m.id, { sheet: { ...m.sheet, status: 'filled', referee_signature: undefined, manager_signature: undefined, signed_at: undefined } })}>Annuler la validation</Button>}
        </div>
      </div>
    </div>
  )
}

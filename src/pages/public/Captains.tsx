// Match des capitaines : mini-tournoi mensuel ORANGE vs BLEUE, hors championnat.
// Bilan, matchs mois par mois avec feuilles de match, statistiques individuelles, effectifs.
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useLookup } from '@/hooks/useData'
import { useCaptains } from '@/hooks/useCaptains'
import { EmptyState, PageHeader } from '@/components/league/Bits'
import { PlayerAvatar } from '@/components/league/Identity'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CaptainCrest, CaptainMatchCard, NextCaptainBlock } from '@/components/captains/CaptainBits'
import { CAPTAIN_COLORS, CAPTAIN_SIDES, captainMonths, topAssisters, topKeepers, topScorers, type CaptainPlayerStats } from '@/lib/captains'
import { playerName } from '@/lib/format'
import type { CaptainSide, CaptainTeam } from '@/types/entities'

const monthLabel = (m: string) => format(new Date(`${m}-01T12:00:00`), 'MMMM yyyy', { locale: fr })

export default function Captains() {
  const { teams, matches, record, stats } = useCaptains()
  const months = captainMonths(matches)
  return (
    <div className="space-y-8">
      <PageHeader title="Match des capitaines" subtitle="Chaque mois, l’équipe Orange affronte l’équipe Bleue. Tournoi hors championnat : il ne compte ni au classement, ni pour l’XP, l’IPG, les statistiques ou la discipline de la ligue." />

      {/* bilan face à face */}
      <section className="grid gap-3 sm:grid-cols-2" aria-label="Bilan">
        {CAPTAIN_SIDES.map((side) => <RecordCard key={side} team={teams[side]} r={record[side]} />)}
      </section>

      <NextCaptainBlock />

      <Tabs defaultValue="matchs">
        <TabsList><TabsTrigger value="matchs">Matchs</TabsTrigger><TabsTrigger value="stats">Statistiques</TabsTrigger><TabsTrigger value="effectifs">Effectifs</TabsTrigger></TabsList>
        <TabsContent value="matchs" className="space-y-6">
          {months.length ? months.map(({ month, matches: ms }) => (
            <section key={month}>
              <h2 className="title-caps mb-3 text-xl capitalize">{monthLabel(month)}</h2>
              <div className="grid gap-3 lg:grid-cols-2">{ms.map((m, i) => <CaptainMatchCard key={m.id} m={m} teams={teams} defaultOpen={i === 0 && month === months[0].month} />)}</div>
            </section>
          )) : <EmptyState title="Aucun match pour l’instant">Le premier Match des capitaines sera annoncé ici.</EmptyState>}
        </TabsContent>
        <TabsContent value="stats" className="grid gap-4 lg:grid-cols-3">
          <StatList title="Buteurs" rows={topScorers(stats)} teams={teams} value={(s) => s.goals} unit="buts" />
          <StatList title="Passeurs" rows={topAssisters(stats)} teams={teams} value={(s) => s.assists} unit="passes" />
          <StatList title="Gardiens" rows={topKeepers(stats)} teams={teams} value={(s) => s.saves} unit="arrêts" sub={(s) => `${s.clean_sheets} clean sheet${s.clean_sheets > 1 ? 's' : ''} · ${s.conceded} encaissé${s.conceded > 1 ? 's' : ''}`} />
        </TabsContent>
        <TabsContent value="effectifs" className="grid gap-4 sm:grid-cols-2">
          {CAPTAIN_SIDES.map((side) => <Roster key={side} team={teams[side]} />)}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function RecordCard({ team, r }: { team: CaptainTeam; r: { played: number; won: number; drawn: number; lost: number; gf: number; ga: number } }) {
  const c = team.color ?? CAPTAIN_COLORS[team.side]
  return (
    <div className="glass flex items-center gap-4 rounded-2xl p-4" style={{ borderLeft: `4px solid ${c}` }}>
      <CaptainCrest team={team} size={64} />
      <div className="min-w-0 flex-1">
        <div className="title-caps truncate text-2xl" style={{ color: c }}>{team.name}</div>
        <div className="mt-1 grid grid-cols-4 gap-2 text-center">
          {[['V', r.won], ['N', r.drawn], ['D', r.lost], ['MJ', r.played]].map(([l, v]) => <div key={l}><div className="num text-2xl font-black">{v}</div><div className="text-[11px] font-bold text-muted-foreground">{l}</div></div>)}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">Buts pour {r.gf} · contre {r.ga}</div>
      </div>
    </div>
  )
}

function StatList({ title, rows, teams, value, unit, sub }: { title: string; rows: CaptainPlayerStats[]; teams: Record<CaptainSide, CaptainTeam>; value: (s: CaptainPlayerStats) => number; unit: string; sub?: (s: CaptainPlayerStats) => string }) {
  const L = useLookup()
  return (
    <section className="glass rounded-2xl p-4">
      <h2 className="title-caps mb-3 text-xl">{title}</h2>
      {rows.length ? (
        <ol className="space-y-2">
          {rows.slice(0, 10).map((s, i) => {
            const p = L.player.get(s.player_id)
            return (
              <li key={s.player_id} className="flex items-center gap-3">
                <span className="num w-5 text-right text-muted-foreground">{i + 1}</span>
                <PlayerAvatar player={p} team={p ? L.team.get(p.team_id) : undefined} size={32} />
                <span className="min-w-0 flex-1"><Link to={p ? `/joueurs/${p.id}` : '#'} className="block truncate font-semibold hover:text-neon">{playerName(p)}</Link><span className="text-xs" style={{ color: teams[s.side].color ?? CAPTAIN_COLORS[s.side] }}>{teams[s.side].name}{sub ? ` · ${sub(s)}` : ''}</span></span>
                <span className="num text-xl font-black">{value(s)}<span className="ml-1 text-[10px] font-bold text-muted-foreground">{unit}</span></span>
              </li>
            )
          })}
        </ol>
      ) : <p className="text-sm text-muted-foreground">Pas encore de données.</p>}
    </section>
  )
}

function Roster({ team }: { team: CaptainTeam }) {
  const L = useLookup()
  const c = team.color ?? CAPTAIN_COLORS[team.side]
  return (
    <section className="glass rounded-2xl p-4" style={{ borderTop: `3px solid ${c}` }}>
      <div className="mb-3 flex items-center gap-3"><CaptainCrest team={team} size={40} /><h2 className="title-caps text-xl" style={{ color: c }}>{team.name}</h2></div>
      {team.player_ids.length ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {team.player_ids.map((id) => { const p = L.player.get(id); const t = p ? L.team.get(p.team_id) : undefined; return (
            <li key={id} className="flex items-center gap-2"><PlayerAvatar player={p} team={t} size={30} /><span className="min-w-0"><Link to={`/joueurs/${id}`} className="block truncate text-sm font-semibold hover:text-neon">{playerName(p)}{team.captain_id === id && <span className="ml-1 text-neon">(C)</span>}</Link><span className="block truncate text-xs text-muted-foreground">{t?.name}</span></span></li>
          ) })}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Effectif à venir.</p>}
    </section>
  )
}

import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import type { Match } from '@/types/entities'
import { base44 } from '@/api/base44Client'
import { useData, useLookup } from '@/hooks/useData'
import { tallyVotes } from '@/lib/stats'
import { PlayerAvatar } from '@/components/league/Identity'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/toast'
import { playerShort } from '@/lib/format'

/** Empreinte anonyme de l'appareil : 1 vote par appareil et par match */
function voterKey() {
  try {
    let k = localStorage.getItem('statfoot:voter')
    if (!k) { k = crypto.randomUUID(); localStorage.setItem('statfoot:voter', k) }
    return k
  } catch { return 'anon' }
}

/** Vote ouvert pendant le match et jusqu'à N min après la fin (Paramètres). L'admin garde la décision finale. */
export function isVoteOpen(m: Match, now = Date.now()) {
  if (m.status === 'live') return true
  return !!m.motm_vote_closes_at && now < new Date(m.motm_vote_closes_at).getTime()
}

export function MotmVoteWidget({ match }: { match: Match }) {
  const { db } = useData()
  const L = useLookup()
  const [choice, setChoice] = useState<string>()
  const key = voterKey()
  const votes = db.MotmVote.filter((v) => v.match_id === match.id)
  const mine = votes.find((v) => v.voter_key === key)
  const open = isVoteOpen(match)
  const candidates = useMemo(() => db.Lineup.filter((l) => l.match_id === match.id).flatMap((l) => [...(l.starter_ids ?? []), ...db.MatchEvent.filter((e) => e.match_id === match.id && e.type === 'substitution' && e.team_id === l.team_id).map((e) => e.player_id!)]), [db.Lineup, db.MatchEvent, match.id])
  const tally = tallyVotes(votes)
  if (mine || !open) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">{mine ? 'Merci pour votre vote !' : 'Vote clôturé.'} {votes.length} vote{votes.length > 1 ? 's' : ''} · résultat consultatif, décision finale de l'organisation.</p>
        {tally.slice(0, 5).map((t) => {
          const p = L.player.get(t.player_id)
          return (
            <div key={t.player_id} className="relative overflow-hidden rounded-lg bg-white/5 px-3 py-2 text-sm">
              <div className="absolute inset-y-0 left-0 bg-neon/20" style={{ width: `${t.pct}%` }} />
              <div className="relative flex justify-between"><span className="flex items-center gap-1.5">{mine?.player_id === t.player_id && <Check className="size-3.5 text-neon" />}{playerShort(p)}</span><span className="num">{t.pct}%</span></div>
            </div>
          )
        })}
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <div className="grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
        {candidates.map((pid) => {
          const p = L.player.get(pid)
          return (
            <button key={pid} onClick={() => setChoice(pid)} className={`flex items-center gap-2 rounded-lg p-2 text-left text-xs cursor-pointer ${choice === pid ? 'bg-neon/20 ring-1 ring-neon' : 'bg-white/5 hover:bg-white/10'}`}>
              <PlayerAvatar player={p} team={L.team.get(p?.team_id ?? '')} size={26} /><span className="truncate">{playerShort(p)}</span>
            </button>
          )
        })}
      </div>
      <Button className="w-full" disabled={!choice} onClick={async () => { await base44.entities.MotmVote.create({ match_id: match.id, player_id: choice!, voter_key: key }); toast.success('Vote enregistré') }}>Voter</Button>
    </div>
  )
}

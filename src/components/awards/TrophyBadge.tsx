import { Crown, Flame, Footprints, Hand, Send, Shield, ShieldCheck, Sparkles, Star, Swords, Compass, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AwardCategory } from '@/types/entities'
import { AWARD_LABELS } from '@/lib/stats'
import { cn } from '@/lib/utils'

export const AWARD_STYLE: Record<AwardCategory, { color: string; icon: LucideIcon; label: string; criteria: string }> = {
  ballon_or: { color: '#facc15', icon: Trophy, label: AWARD_LABELS.ballon_or, criteria: 'Joueurs de champ classés à l’XP' },
  top_scorer: { color: '#ef4444', icon: Footprints, label: AWARD_LABELS.top_scorer, criteria: 'Buts, puis passes, puis moins de matchs joués' },
  top_assist: { color: '#f97316', icon: Send, label: AWARD_LABELS.top_assist, criteria: 'Passes, puis buts, puis moins de matchs joués' },
  golden_glove: { color: '#3b82f6', icon: Hand, label: AWARD_LABELS.golden_glove, criteria: 'Gardiens classés à l’XP (clean sheets, arrêts, buts encaissés)' },
  best_team: { color: '#22c55e', icon: Shield, label: AWARD_LABELS.best_team, criteria: 'Champion, sinon leader du classement' },
  player_of_tournament: { color: '#e879f9', icon: Crown, label: AWARD_LABELS.player_of_tournament, criteria: 'Meilleure note moyenne /10, tous postes' },
  best_defender: { color: '#22c55e', icon: ShieldCheck, label: AWARD_LABELS.best_defender, criteria: 'Défenseurs, note moyenne, min. de matchs' },
  best_midfielder: { color: '#f97316', icon: Compass, label: AWARD_LABELS.best_midfielder, criteria: 'Milieux, note moyenne, min. de matchs' },
  best_forward: { color: '#ef4444', icon: Flame, label: AWARD_LABELS.best_forward, criteria: 'Attaquants, note moyenne, min. de matchs' },
  best_young: { color: '#F85A00', icon: Sparkles, label: AWARD_LABELS.best_young, criteria: 'Moins de 23 ans au début de saison' },
  best_defense: { color: '#60a5fa', icon: Shield, label: AWARD_LABELS.best_defense, criteria: 'Moins de buts encaissés par match' },
  best_attack: { color: '#fb7185', icon: Swords, label: AWARD_LABELS.best_attack, criteria: 'Plus de buts marqués' },
}

export function TrophyBadge({ category, size = 56, className, rank }: { category: AwardCategory; size?: number; className?: string; rank?: number }) {
  const s = AWARD_STYLE[category]
  const Icon = s.icon
  return (
    <div className={cn('relative shrink-0 rounded-full', className)} style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, ${s.color}ee, ${s.color}55 55%, #04163D 100%)`, boxShadow: `0 0 ${size / 2.5}px ${s.color}88, inset 0 0 ${size / 6}px #ffffff55` }} />
      <div className="absolute inset-[12%] rounded-full border-2" style={{ borderColor: '#ffffff55' }} />
      <Icon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" style={{ width: size * 0.42, height: size * 0.42 }} strokeWidth={2.2} />
      {rank && <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-night-900 font-display text-xs font-black ring-2" style={{ color: s.color, ['--tw-ring-color' as string]: s.color }}>{rank}</span>}
    </div>
  )
}

export { Star }

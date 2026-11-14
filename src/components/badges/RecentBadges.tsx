// Accueil : « Derniers badges débloqués » + visuel 1080 × 1350 « Badge débloqué » (joueur + badge) à télécharger / partager.
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Player, Team } from '@/types/entities'
import type { BadgeState } from '@/lib/badges'
import { useRecentUnlocks } from '@/hooks/useBadgeOwnership'
import { useBadgeMeta } from '@/hooks/useBadgeMeta'
import { useLookup } from '@/hooks/useData'
import { BadgeEmblem, RARITY_ACCENT } from './BadgeEmblem'
import { RARITY_LABEL, ROMAN } from '@/lib/badgeCatalog'
import { fmtDate, playerName } from '@/lib/format'

const slugName = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
import { TeamLogo } from '@/components/league/Identity'
import { CardShareActions } from '@/components/players/CardShare'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

/** Visuel « Badge débloqué » (mis à l'échelle 1080 × 1350 par CardShareActions) */
export function BadgeUnlockedCard({ b, player, team, date }: { b: BadgeState; player?: Player; team?: Team; date?: string }) {
  const m = useBadgeMeta()(b.def.id)
  const accent = RARITY_ACCENT[m.rarity]
  return (
    <div style={{ width: 900, padding: 48, borderRadius: 40, background: `radial-gradient(70% 50% at 50% 30%, ${accent}40, transparent 70%), linear-gradient(180deg,#0D2B66,#04163D)`, boxShadow: `inset 0 0 0 3px ${accent}88`, color: '#fff', textAlign: 'center', fontFamily: 'inherit' }}>
      <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '.18em', color: accent }}>BADGE DÉBLOQUÉ</div>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '28px 0 18px' }}>
        <BadgeEmblem pictogram={m.pictogram} rarity={m.rarity} level={m.level} size={420} title={b.def.name} />
      </div>
      <div className="font-display" style={{ fontSize: 72, fontWeight: 900, lineHeight: 1, textTransform: 'uppercase' }}>{b.def.name}</div>
      <div style={{ marginTop: 10, fontSize: 30, fontWeight: 800, color: accent }}>{RARITY_LABEL[m.rarity]}{m.level ? ` · palier ${ROMAN[m.level]}` : ''}</div>
      <div style={{ marginTop: 8, fontSize: 28, color: 'rgb(255 255 255 / .75)' }}>{b.def.description}</div>
      <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        {team && <TeamLogo team={team} size={88} />}
        <div style={{ textAlign: 'left' }}>
          <div className="font-display" style={{ fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{playerName(player)}</div>
          <div style={{ fontSize: 26, color: 'rgb(255 255 255 / .7)' }}>{team?.name}{date ? ` · ${fmtDate(date, 'd MMMM yyyy')}` : ''}</div>
        </div>
      </div>
    </div>
  )
}

export function RecentBadges({ seasonId }: { seasonId: string | null }) {
  const rows = useRecentUnlocks(seasonId, 8)
  const L = useLookup()
  const meta = useBadgeMeta()
  const [open, setOpen] = useState<(typeof rows)[number] | null>(null)
  if (!rows.length) return null
  const sel = open && { p: L.player.get(open.playerId), t: L.team.get(L.player.get(open.playerId)?.team_id ?? '') }
  return (
    <>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map((r) => {
          const p = L.player.get(r.playerId), t = L.team.get(p?.team_id ?? ''), m = meta(r.badge.def.id)
          return (
            <li key={`${r.playerId}-${r.badge.def.id}`}>
              <button onClick={() => setOpen(r)} className="glass flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition hover:-translate-y-0.5">
                <BadgeEmblem pictogram={m.pictogram} rarity={m.rarity} level={m.level} size={56} title={r.badge.def.name} />
                <span className="min-w-0">
                  <span className="block truncate font-display text-lg font-extrabold leading-tight">{r.badge.def.name}</span>
                  <span className="block truncate text-xs font-bold" style={{ color: RARITY_ACCENT[m.rarity] }}>{RARITY_LABEL[m.rarity]}</span>
                  <span className="block truncate text-xs text-muted-foreground">{playerName(p)} · {t?.short_name}{r.match.date ? ` · ${fmtDate(r.match.date, 'd MMM')}` : ''}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {open && sel && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>{open.badge.def.name}</DialogTitle><DialogDescription>Débloqué par <Link className="font-bold text-neon" to={`/joueurs/${open.playerId}`}>{playerName(sel.p)}</Link></DialogDescription></DialogHeader>
            <div className="overflow-hidden rounded-2xl" style={{ height: 300 }}><div style={{ transform: 'scale(.32)', transformOrigin: 'top left', width: 900 }}><BadgeUnlockedCard b={open.badge} player={sel.p} team={sel.t} date={open.match.date} /></div></div>
            <CardShareActions cardWidth={900} card={<BadgeUnlockedCard b={open.badge} player={sel.p} team={sel.t} date={open.match.date} />}
              fileName={`badge-${open.badge.def.id}-${slugName(playerName(sel.p))}.png`} downloadLabel="Télécharger le visuel"
              url={`${location.origin}/joueurs/${open.playerId}`} text={`${playerName(sel.p)} débloque le badge ${open.badge.def.name} · Morocco Business League`} />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

// Collection de badges : compteur global (jauge circulaire + nombre par rareté), filtres par rareté et catégorie,
// tri, badges débloqués (date + match) ou verrouillés (condition + progression), fenêtre de détail.
import { useMemo, useState, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import type { BadgeState } from '@/lib/badges'
import { BADGES } from '@/lib/badges'
import { CATEGORY_ORDER, RARITY_LABEL, RARITY_ORDER, RARITY_RANK, ROMAN, type BadgeCategory, type Rarity } from '@/lib/badgeCatalog'
import { BadgeEmblem, RARITY_ACCENT } from './BadgeEmblem'
import { useBadgeMeta } from '@/hooks/useBadgeMeta'
import { useBadgeOwnership } from '@/hooks/useBadgeOwnership'
import { useLookup } from '@/hooks/useData'
import { fmtDate } from '@/lib/format'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type Sort = 'rarity' | 'progress' | 'name'

export function BadgeCounter({ badges }: { badges: BadgeState[] }) {
  const meta = useBadgeMeta()
  const n = badges.filter((b) => b.unlocked).length, total = badges.length
  const pct = total ? n / total : 0
  const per = RARITY_ORDER.slice().reverse().map((r) => ({ r, n: badges.filter((b) => b.unlocked && meta(b.def.id).rarity === r).length }))
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 64 64" className="size-20 shrink-0 -rotate-90" role="img" aria-label={`${n} badges débloqués sur ${total}`}>
        <circle cx="32" cy="32" r="27" fill="none" stroke="rgb(255 255 255 / .1)" strokeWidth="7" />
        <circle cx="32" cy="32" r="27" fill="none" stroke="#FF7A1F" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${pct * 169.6} 169.6`} />
        <text x="32" y="37" textAnchor="middle" transform="rotate(90 32 32)" fontSize="15" fontWeight="900" fill="#fff">{Math.round(pct * 100)}%</text>
      </svg>
      <div>
        <div className="font-display text-3xl font-black">{n} / {total} badges</div>
        <div className="text-sm text-muted-foreground">{per.map((x, i) => <span key={x.r}>{i > 0 && ' · '}<b style={{ color: RARITY_ACCENT[x.r] }}>{x.n}</b> {RARITY_LABEL[x.r].toLowerCase()}{x.n > 1 && x.r !== 'rare' && x.r !== 'epic' ? 's' : x.n > 1 ? 's' : ''}</span>)}</div>
      </div>
    </div>
  )
}

export function BadgeCollection({ badges, seasonId }: { badges: BadgeState[]; seasonId: string | null }) {
  const meta = useBadgeMeta()
  const [rarity, setRarity] = useState<Rarity | ''>('')
  const [cat, setCat] = useState<BadgeCategory | ''>('')
  const [sort, setSort] = useState<Sort>('rarity')
  const [open, setOpen] = useState<BadgeState | null>(null)
  const list = useMemo(() => badges
    .filter((b) => (!rarity || meta(b.def.id).rarity === rarity) && (!cat || meta(b.def.id).category === cat))
    .sort((a, b) => sort === 'name' ? a.def.name.localeCompare(b.def.name)
      : sort === 'progress' ? Number(b.unlocked) - Number(a.unlocked) || b.pct - a.pct
        : RARITY_RANK[meta(b.def.id).rarity] - RARITY_RANK[meta(a.def.id).rarity] || Number(b.unlocked) - Number(a.unlocked)), [badges, rarity, cat, sort, meta])
  const cats = CATEGORY_ORDER.filter((c) => badges.some((b) => meta(b.def.id).category === c))
  const chip = (on: boolean) => cn('min-h-9 cursor-pointer rounded-full border px-3 text-xs font-bold transition', on ? 'border-neon bg-neon/15 text-neon' : 'border-white/15 text-muted-foreground hover:text-white')
  return (
    <div className="space-y-4">
      <BadgeCounter badges={badges} />
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par rareté">
        <button className={chip(!rarity)} onClick={() => setRarity('')}>Toutes raretés</button>
        {RARITY_ORDER.map((r) => <button key={r} className={chip(rarity === r)} onClick={() => setRarity(r)} style={rarity === r ? undefined : { color: RARITY_ACCENT[r] }}>{RARITY_LABEL[r]}</button>)}
      </div>
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par catégorie">
        <button className={chip(!cat)} onClick={() => setCat('')}>Toutes catégories</button>
        {cats.map((c) => <button key={c} className={chip(cat === c)} onClick={() => setCat(c)}>{c}</button>)}
        <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">Trier
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-9 rounded-lg border border-white/15 bg-night-950 px-2 text-white">
            <option value="rarity">par rareté</option><option value="progress">par progression</option><option value="name">par nom</option>
          </select>
        </label>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {list.map((b) => <BadgeTileNew key={b.def.id} b={b} onOpen={() => setOpen(b)} />)}
      </div>
      {open && <BadgeDetail b={open} seasonId={seasonId} onClose={() => setOpen(null)} />}
    </div>
  )
}

function BadgeTileNew({ b, onOpen }: { b: BadgeState; onOpen: () => void }) {
  const m = useBadgeMeta()(b.def.id)
  const hidden = b.def.secret && !b.unlocked
  const L = useLookup()
  const mt = b.unlocked_match
  return (
    <button onClick={onOpen} className={cn('flex cursor-pointer flex-col items-center rounded-2xl border p-3 text-center transition hover:-translate-y-0.5', b.unlocked ? 'border-white/10 bg-white/[.04]' : 'border-white/5')}>
      <BadgeEmblem pictogram={hidden ? 'lock_net' : m.pictogram} rarity={m.rarity} level={m.level} locked={!b.unlocked} size={84} title={hidden ? 'Badge secret' : b.def.name} />
      <div className={cn('mt-2 font-display text-[16px] font-extrabold leading-tight', !b.unlocked && 'text-white/60')}>{hidden ? '???' : b.def.name}</div>
      <div className="text-[11px] font-bold" style={{ color: RARITY_ACCENT[m.rarity] }}>{RARITY_LABEL[m.rarity]}{m.level ? ` · ${ROMAN[m.level]}` : ''}</div>
      {!hidden && <div className="mt-1 text-[11px] leading-snug text-muted-foreground">{b.def.description}</div>}
      {b.unlocked
        ? <div className="mt-1 text-[11px] text-muted-foreground">Débloqué {mt?.date ? `le ${fmtDate(mt.date, 'd MMM')}` : `en J${b.unlocked_round}`}{mt ? ` · ${L.team.get(mt.home_team_id)?.short_name ?? ''}–${L.team.get(mt.away_team_id)?.short_name ?? ''}` : ''}</div>
        : hidden ? <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Lock className="size-3" />Badge secret</div>
          : (
            <div className="mt-1.5 w-full">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: RARITY_ACCENT[m.rarity] }} /></div>
              <div className="mt-1 text-[11px] text-muted-foreground">{b.value} / {b.def.target}</div>
            </div>
          )}
    </button>
  )
}

/** Fenêtre de détail : badge en grand (rotation 3D légère au survol / à l'inclinaison), rareté, condition exacte, % de joueurs, paliers */
export function BadgeDetail({ b, seasonId, onClose }: { b: BadgeState; seasonId: string | null; onClose: () => void }) {
  const metaOf = useBadgeMeta()
  const m = metaOf(b.def.id)
  const own = useBadgeOwnership(seasonId).get(b.def.id)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = e.currentTarget.getBoundingClientRect()
    setTilt({ x: ((e.clientY - r.top) / r.height - 0.5) * -18, y: ((e.clientX - r.left) / r.width - 0.5) * 18 })
  }
  const levels = m.family ? BADGES.filter((d) => metaOf(d.id).family === m.family).sort((a, c) => (metaOf(a.id).level ?? 0) - (metaOf(c.id).level ?? 0)) : []
  const hidden = b.def.secret && !b.unlocked
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{hidden ? 'Badge secret' : b.def.name}</DialogTitle>
          <DialogDescription><span style={{ color: RARITY_ACCENT[m.rarity] }} className="font-bold">{RARITY_LABEL[m.rarity]}</span> · {m.category}{m.level ? ` · palier ${ROMAN[m.level]}` : ''}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-2" onPointerMove={move} onPointerLeave={() => setTilt({ x: 0, y: 0 })} style={{ perspective: 600 }}>
          <div style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: 'transform .15s ease-out' }}>
            <BadgeEmblem pictogram={hidden ? 'lock_net' : m.pictogram} rarity={m.rarity} level={m.level} locked={!b.unlocked} size={180} title={b.def.name} />
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p><b>Condition :</b> {hidden ? 'secrète — à découvrir sur le terrain' : b.def.description}{b.def.keeperOnly ? ' (gardiens uniquement)' : ''}.</p>
          {!b.unlocked && !hidden && <p><b>Progression :</b> {b.value} / {b.def.target}</p>}
          {own && <p><b>Obtenu par {own.pct < 1 && own.count ? '< 1' : Math.round(own.pct)} % des joueurs</b> de la saison ({own.count} / {own.total}).</p>}
          {levels.length > 1 && (
            <div>
              <b>Paliers</b>
              <ul className="mt-1 space-y-1">{levels.map((d) => { const md = metaOf(d.id); return <li key={d.id} className="flex items-center gap-2"><BadgeEmblem pictogram={md.pictogram} rarity={md.rarity} size={28} title={d.name} /><span className="font-semibold">{ROMAN[md.level ?? 0]} · {d.name}</span><span className="text-muted-foreground">— {d.description}</span></li> })}</ul>
            </div>
          )}
          <Link to="/badges" className="inline-block text-xs font-bold text-neon underline underline-offset-4">Tous les badges de la ligue</Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// « Tous les badges de la ligue » : chaque badge, sa rareté, sa condition exacte et les joueurs de la saison qui l'ont.
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@/components/league/Bits'
import { BadgeEmblem, RARITY_ACCENT } from '@/components/badges/BadgeEmblem'
import { useBadgeMeta } from '@/hooks/useBadgeMeta'
import { useBadgeOwnership } from '@/hooks/useBadgeOwnership'
import { useLookup } from '@/hooks/useData'
import { useSeason } from '@/hooks/useSeason'
import { useEffectiveSeason } from '@/hooks/useStats'
import { BADGES } from '@/lib/badges'
import { CATEGORY_ORDER, RARITY_LABEL, RARITY_ORDER, RARITY_RANK, ROMAN, type Rarity } from '@/lib/badgeCatalog'
import { playerName } from '@/lib/format'
import { cn } from '@/lib/utils'

export default function Badges() {
  const { scopeSeasonId } = useSeason()
  const eff = useEffectiveSeason()
  const sid = scopeSeasonId ?? eff?.id ?? null
  const meta = useBadgeMeta()
  const own = useBadgeOwnership(sid)
  const L = useLookup()
  const [rarity, setRarity] = useState<Rarity | ''>('')
  const list = useMemo(() => BADGES.filter((d) => !rarity || meta(d.id).rarity === rarity)
    .sort((a, b) => CATEGORY_ORDER.indexOf(meta(a.id).category) - CATEGORY_ORDER.indexOf(meta(b.id).category) || RARITY_RANK[meta(a.id).rarity] - RARITY_RANK[meta(b.id).rarity]), [rarity, meta])
  const chip = (on: boolean) => cn('min-h-9 cursor-pointer rounded-full border px-3 text-xs font-bold transition', on ? 'border-neon bg-neon/15 text-neon' : 'border-white/15 text-muted-foreground hover:text-white')
  return (
    <div>
      <PageHeader title="Badges de la ligue" subtitle={`${BADGES.length} badges à débloquer · ${eff?.name ?? ''} · le Match des capitaines ne débloque aucun badge`} />
      <div className="mb-5 flex flex-wrap gap-2">
        <button className={chip(!rarity)} onClick={() => setRarity('')}>Toutes raretés</button>
        {RARITY_ORDER.map((r) => <button key={r} className={chip(rarity === r)} onClick={() => setRarity(r)} style={rarity === r ? undefined : { color: RARITY_ACCENT[r] }}>{RARITY_LABEL[r]}</button>)}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {list.map((d) => {
          const m = meta(d.id), o = own.get(d.id)
          const hidden = d.secret && !o?.count
          return (
            <article key={d.id} className="glass flex gap-4 rounded-2xl p-4">
              <BadgeEmblem pictogram={hidden ? 'lock_net' : m.pictogram} rarity={m.rarity} level={m.level} size={88} title={hidden ? 'Badge secret' : d.name} />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-xl font-extrabold leading-tight">{hidden ? 'Badge secret' : d.name}</h2>
                <div className="text-xs font-bold" style={{ color: RARITY_ACCENT[m.rarity] }}>{RARITY_LABEL[m.rarity]} · {m.category}{m.level ? ` · ${m.family} ${ROMAN[m.level]}` : ''}</div>
                <p className="mt-1 text-sm text-muted-foreground">{hidden ? 'Condition secrète.' : d.description}{d.keeperOnly ? ' (gardiens)' : ''}</p>
                <p className="mt-1 text-xs text-muted-foreground">{o?.count ? <>Obtenu par <b className="text-white">{Math.max(1, Math.round(o.pct))} %</b> des joueurs ({o.count})</> : 'Personne ne l’a encore débloqué.'}</p>
                {!!o?.players.length && (
                  <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-xs">
                    {o.players.slice(0, 12).map((pid) => <Link key={pid} to={`/joueurs/${pid}`} className="tap-sm rounded-full bg-white/5 px-2 py-0.5 hover:text-neon">{playerName(L.player.get(pid))}</Link>)}
                    {o.players.length > 12 && <span className="text-muted-foreground">+{o.players.length - 12}</span>}
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

// Planche de validation des badges (temporaire, non référencée) : chaque badge, débloqué ET verrouillé, en grand et en mini.
import { useEffect } from 'react'
import { BadgeEmblem, RARITY_ACCENT } from '@/components/badges/BadgeEmblem'
import { badgeCatalog, RARITY_LABEL, RARITY_ORDER, type Rarity } from '@/lib/badgeCatalog'

export default function BadgeBoard() {
  useEffect(() => { const m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex'; document.head.appendChild(m); return () => m.remove() }, [])
  const cat = badgeCatalog()
  const byR = (r: Rarity) => cat.filter((c) => c.meta.rarity === r)
  return (
    <div className="space-y-10 rounded-3xl bg-[#050B1C] p-4 sm:p-8">
      <header>
        <h1 className="font-display text-3xl font-black uppercase">Planche des badges MBL</h1>
        <p className="text-sm text-muted-foreground">{cat.length} badges · Commun (bronze cuivré, bouclier) · Rare (saphir, bouclier à ailettes) · Épique (améthyste, emblème à pointes, gemme, halo) · Légendaire (orange MBL et or, couronne, étoiles, particules, holographique)</p>
      </header>
      <section>
        <h2 className="mb-3 text-lg font-bold">Un même emblème dans les 4 raretés</h2>
        <div className="flex flex-wrap gap-6">
          {(['common', 'rare', 'epic', 'legendary'] as Rarity[]).map((r) => (
            <div key={r} className="text-center"><BadgeEmblem pictogram="ball_net" rarity={r} level={r === 'common' ? 1 : r === 'rare' ? 2 : r === 'epic' ? 3 : 4} size={120} title="Buteur" /><div className="mt-1 text-sm font-bold" style={{ color: RARITY_ACCENT[r] }}>{RARITY_LABEL[r]}</div></div>
          ))}
        </div>
      </section>
      {RARITY_ORDER.map((r) => (
        <section key={r}>
          <h2 className="mb-3 font-display text-2xl font-black uppercase" style={{ color: RARITY_ACCENT[r] }}>{RARITY_LABEL[r]} · {byR(r).length}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {byR(r).map(({ def, meta }) => (
              <div key={def.id} className="rounded-2xl border border-white/10 bg-white/[.03] p-3">
                <div className="flex items-end gap-3">
                  <BadgeEmblem pictogram={meta.pictogram} rarity={meta.rarity} level={meta.level} size={84} title={def.name} />
                  <BadgeEmblem pictogram={meta.pictogram} rarity={meta.rarity} level={meta.level} size={84} locked title={def.name} />
                  <div className="flex flex-col items-center gap-2 pb-2">
                    <div className="flex gap-2"><BadgeEmblem pictogram={meta.pictogram} rarity={meta.rarity} size={32} title={def.name} /><BadgeEmblem pictogram={meta.pictogram} rarity={meta.rarity} size={32} locked title={def.name} /></div>
                    <div className="flex gap-2"><BadgeEmblem pictogram={meta.pictogram} rarity={meta.rarity} size={24} title={def.name} /><BadgeEmblem pictogram={meta.pictogram} rarity={meta.rarity} size={24} locked title={def.name} /></div>
                  </div>
                </div>
                <div className="mt-2 text-sm font-bold">{def.name}{meta.level ? ` · ${meta.family} ${['', 'I', 'II', 'III', 'IV'][meta.level]}` : ''}</div>
                <div className="text-xs text-muted-foreground">{def.description} · {meta.category}</div>
                <div className="mt-1 text-[11px]" style={{ color: RARITY_ACCENT[r] }}>Pourquoi {RARITY_LABEL[r].toLowerCase()} : {meta.why}</div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

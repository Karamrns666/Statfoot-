// « Glossaire des statistiques » : définitions, formules exactes (tirées des constantes du code) et exemples chiffrés.
// Les badges sont listés depuis le catalogue (même source que la collection et la page Badges).
import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { PageHeader } from '@/components/league/Bits'
import { BadgeEmblem, RARITY_ACCENT } from '@/components/badges/BadgeEmblem'
import { useBadgeMeta } from '@/hooks/useBadgeMeta'
import { BADGES } from '@/lib/badges'
import { CATEGORY_ORDER, RARITY_LABEL, ROMAN } from '@/lib/badgeCatalog'
import { GLOSSARY, type GlossaryEntry } from '@/lib/glossary'
import { SENIORITY_LABEL, SENIORITY_ORDER } from '@/lib/seniority'
import { TierIcon } from '@/components/league/SeniorityBadge'

const GROUPS: GlossaryEntry['group'][] = ['Joueurs', 'Équipes et classements', 'IPG (saison 2025)', 'Badges']

export default function Glossary() {
  const { hash } = useLocation()
  const meta = useBadgeMeta()
  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('ring-2', 'ring-neon'); const t = setTimeout(() => el.classList.remove('ring-2', 'ring-neon'), 2200); return () => clearTimeout(t) }
  }, [hash])
  const badges = BADGES.slice().sort((a, b) => CATEGORY_ORDER.indexOf(meta(a.id).category) - CATEGORY_ORDER.indexOf(meta(b.id).category))
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Glossaire des statistiques" subtitle="Ce que mesure chaque chiffre du site, comment il est calculé, avec un exemple." />
      <nav aria-label="Rubriques" className="mb-6 flex flex-wrap gap-2">
        {GROUPS.map((g) => <a key={g} href={`#g-${g}`} className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-white">{g}</a>)}
      </nav>
      {GROUPS.map((g) => (
        <section key={g} id={`g-${g}`} className="mb-8 scroll-mt-24">
          <h2 className="mb-3 font-display text-2xl font-black uppercase">{g}</h2>
          <div className="space-y-3">
            {GLOSSARY.filter((e) => e.group === g).map((e) => (
              <article key={e.id} id={e.id} className="glass scroll-mt-24 rounded-2xl p-4 transition">
                <h3 className="font-display text-xl font-extrabold">{e.term}</h3>
                <p className="mt-1 text-sm text-white/90">{e.short}</p>
                {e.formula && <p className="mt-2 text-sm"><b className="text-neon">Calcul :</b> <span className="text-muted-foreground">{e.formula}</span></p>}
                {e.example && <p className="mt-1 text-sm"><b className="text-sky-soft">Exemple :</b> <span className="text-muted-foreground">{e.example}</span></p>}
                {e.note && <p className="mt-1 text-xs italic text-muted-foreground">{e.note}</p>}
                {e.id === 'niveaux' && (
                  <div className="mt-2 flex flex-wrap gap-3 text-sm">{SENIORITY_ORDER.map((t) => <span key={t} className="inline-flex items-center gap-1.5"><TierIcon tier={t} className="size-4" />{SENIORITY_LABEL[t]}</span>)}</div>
                )}
              </article>
            ))}
          </div>
          {g === 'Badges' && (
            <div className="mt-4">
              <h3 className="mb-2 font-display text-xl font-extrabold">Les {BADGES.length} badges</h3>
              <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
                {badges.map((d) => {
                  const m = meta(d.id)
                  return (
                    <li key={d.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <BadgeEmblem pictogram={m.pictogram} rarity={m.rarity} level={m.level} size={40} simple title={d.name} />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold">{d.secret ? `${d.name} (secret)` : d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.description}{d.keeperOnly ? ' — gardiens' : ''}</div>
                      </div>
                      <span className="shrink-0 text-right text-xs font-bold" style={{ color: RARITY_ACCENT[m.rarity] }}>{RARITY_LABEL[m.rarity]}{m.level ? ` ${ROMAN[m.level]}` : ''}<span className="block font-normal text-muted-foreground">{m.category}</span></span>
                    </li>
                  )
                })}
              </ul>
              <Link to="/badges" className="mt-2 inline-block text-sm font-bold text-neon underline underline-offset-4">Voir qui a débloqué chaque badge</Link>
            </div>
          )}
        </section>
      ))}
    </div>
  )
}

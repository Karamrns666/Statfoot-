// En-tête de la page équipe : bannière pleine largeur, hauteur « couverture », avec la photo collective
// ou le poster choisi dans l'admin. Point de recadrage distinct pour ordinateur et mobile.
// Logo et nom par-dessus, dégradé pour la lisibilité. Sans image : bannière aux couleurs de l'équipe.
import { useState, type CSSProperties, type ReactNode } from 'react'
import type { Team, TeamMedia } from '@/types/entities'
import { TeamLogo, TeamLogoWatermark } from '@/components/league/Identity'

export function teamCover(team?: Team | null): TeamMedia | undefined {
  const media = team?.media ?? []
  return media.find((m) => m.id === team?.cover_media_id) ?? media[0]
}
export const focusPos = (m: TeamMedia, mobile = false) =>
  `${mobile ? m.focus_x_mobile ?? m.focus_x ?? 50 : m.focus_x ?? 50}% ${mobile ? m.focus_y_mobile ?? m.focus_y ?? 50 : m.focus_y ?? 50}%`

export function TeamBanner({ team, children }: { team: Team; children?: ReactNode }) {
  const [broken, setBroken] = useState<string | null>(null)
  const found = teamCover(team)
  // image introuvable (ex. importée sur un autre navigateur avant la mise en ligne du stockage partagé) → bannière aux couleurs
  const cover = found && broken !== found.url ? found : undefined
  const c1 = team.primary_color ?? '#F85A00', c2 = team.secondary_color ?? '#04163D'
  return (
    <section className="relative -mt-6 ml-[calc(50%-50vw)] w-screen overflow-hidden sm:-mt-8" aria-label={`${team.name} — en-tête`}>
      {/* fond décoratif, toujours DERRIÈRE le contenu (jamais par-dessus le texte) */}
      <div className="pointer-events-none absolute inset-0 -z-0" aria-hidden>
        {cover ? (
          <img src={cover.url} alt="" fetchPriority="high" onError={() => setBroken(cover.url)}
            className="absolute inset-0 size-full object-cover [object-position:var(--pos-m)] sm:[object-position:var(--pos-d)]"
            style={{ '--pos-m': focusPos(cover, true), '--pos-d': focusPos(cover) } as CSSProperties} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 90% at 85% 10%, ${c1}aa, transparent 65%), radial-gradient(ellipse 60% 80% at 0% 100%, ${c1}55, transparent 70%), linear-gradient(160deg, ${c2}, #04163D 70%)` }}>
            <TeamLogoWatermark team={team} className="absolute -right-[8vw] top-[8%] h-[46%] w-[min(70vw,640px)] opacity-[.08] sm:top-1/2 sm:h-[60%] sm:-translate-y-1/2" />
          </div>
        )}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(4_22_61/.55)_0%,transparent_28%,transparent_40%,rgb(4_22_61/.85)_70%,#04163D_100%)]" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(4_22_61/.75)_0%,transparent_55%)] sm:block" />
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: `linear-gradient(90deg, ${c1}, transparent)` }} />
      </div>
      {cover && <span className="sr-only">{`${cover.kind === 'poster' ? 'Poster' : 'Photo collective'} — ${team.name}`}</span>}
      {/* contenu dans le flux : UN logo (hero), puis le nom, puis les infos — empilés sur téléphone, alignés sur ordinateur */}
      <div className={cover ? 'relative flex min-h-[min(78svh,680px)] flex-col justify-end sm:min-h-[max(460px,min(68vh,680px))]' : 'relative flex min-h-[340px] flex-col justify-end sm:min-h-[max(380px,44vh)]'}>
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-4 px-4 pb-8 pt-24 sm:flex-row sm:items-end sm:gap-8 sm:pb-12">
          <TeamLogo team={team} size="hero" />
          <div className="min-w-0 flex-1">
            <h1 className="title-caps break-words text-[clamp(2.2rem,9vw,6.5rem)] leading-[.9] text-white drop-shadow-[0_4px_24px_rgb(0_0_0/.6)]">{team.name}</h1>
            {children}
          </div>
        </div>
      </div>
    </section>
  )
}

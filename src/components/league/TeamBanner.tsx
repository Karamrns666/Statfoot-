// En-tête de la page équipe : bannière pleine largeur, hauteur « couverture », avec la photo collective
// ou le poster choisi dans l'admin. Point de recadrage distinct pour ordinateur et mobile.
// Logo et nom par-dessus, dégradé pour la lisibilité. Sans image : bannière aux couleurs de l'équipe.
import type { CSSProperties, ReactNode } from 'react'
import type { Team, TeamMedia } from '@/types/entities'
import { TeamLogo } from '@/components/league/Identity'

export function teamCover(team?: Team | null): TeamMedia | undefined {
  const media = team?.media ?? []
  return media.find((m) => m.id === team?.cover_media_id) ?? media[0]
}
export const focusPos = (m: TeamMedia, mobile = false) =>
  `${mobile ? m.focus_x_mobile ?? m.focus_x ?? 50 : m.focus_x ?? 50}% ${mobile ? m.focus_y_mobile ?? m.focus_y ?? 50 : m.focus_y ?? 50}%`

export function TeamBanner({ team, children }: { team: Team; children?: ReactNode }) {
  const cover = teamCover(team)
  const c1 = team.primary_color ?? '#F85A00', c2 = team.secondary_color ?? '#04163D'
  return (
    <section className="relative -mt-6 ml-[calc(50%-50vw)] w-screen overflow-hidden sm:-mt-8" aria-label={`${team.name} — en-tête`}>
      <div className={cover ? 'relative h-[78svh] max-h-[680px] min-h-[440px] sm:h-[68vh] sm:min-h-[460px]' : 'relative h-[46svh] min-h-[340px] sm:h-[44vh] sm:min-h-[380px]'}>
        {cover ? (
          <img src={cover.url} alt={`${cover.kind === 'poster' ? 'Poster' : 'Photo collective'} — ${team.name}`} fetchPriority="high"
            className="absolute inset-0 size-full object-cover [object-position:var(--pos-m)] sm:[object-position:var(--pos-d)]"
            style={{ '--pos-m': focusPos(cover, true), '--pos-d': focusPos(cover) } as CSSProperties} />
        ) : (
          <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 90% at 85% 10%, ${c1}aa, transparent 65%), radial-gradient(ellipse 60% 80% at 0% 100%, ${c1}55, transparent 70%), linear-gradient(160deg, ${c2}, #04163D 70%)` }}>
            <div className="absolute -right-[6vw] top-1/2 aspect-square w-[min(60vw,560px)] -translate-y-1/2 opacity-15"><TeamLogo team={team} size={560} className="!size-full" /></div>
          </div>
        )}
        {/* dégradés de lisibilité */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(4_22_61/.55)_0%,transparent_28%,transparent_45%,rgb(4_22_61/.85)_78%,#04163D_100%)]" />
        <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(4_22_61/.75)_0%,transparent_55%)] sm:block" />
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: `linear-gradient(90deg, ${c1}, transparent)` }} />
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 pb-8 sm:flex-row sm:items-end sm:gap-6 sm:pb-12">
            <div className="aspect-square w-20 shrink-0 sm:w-32"><TeamLogo team={team} size={128} className="!size-full" /></div>
            <div className="min-w-0">
              <h1 className="title-caps text-[clamp(2.4rem,9vw,6.5rem)] leading-[.88] text-white drop-shadow-[0_4px_24px_rgb(0_0_0/.6)]">{team.name}</h1>
              {children}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

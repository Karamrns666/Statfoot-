// « Comment sont calculés les XP et le classement » — texte généré depuis le barème réel (lib/xp.ts) :
// valeurs (XP_DEFAULTS + réglages de la saison), critères de classement (RACE_CRITERIA) et exemples
// calculés par le moteur lui-même (xpExamples → matchXPLines). Modifier le barème met ce texte à jour.
import { useMemo, type ReactNode } from 'react'
import { phaseName } from '@/lib/competitionNames'
import { ArtLink } from '@/components/reglement/ArtLink'
import { ChevronDown, Calculator } from 'lucide-react'
import { useData } from '@/hooks/useData'
import { RACE_CRITERIA, RACE_ELIGIBLE, XP_LABELS, xpConfig, xpExamples, type XPConfig, type XPLine } from '@/lib/xp'
import type { XPKey } from '@/types/entities'
import { cn } from '@/lib/utils'

const num = (v: number) => v.toLocaleString('fr-FR')
const signed = (v: number) => (v > 0 ? `+${num(v)}` : v < 0 ? `−${num(-v)}` : '0')
const mult = (v: number) => `×${num(v)}`

function Item({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-white/5 py-1.5 last:border-0">
      <span className="min-w-0">{label}{note && <span className="block text-xs text-muted-foreground">{note}</span>}</span>
      <span className="num shrink-0 text-base text-white">{value}</span>
    </li>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-night-950/40 p-3">
      <h4 className="mb-1 font-display text-lg font-black">{title}</h4>
      <ul className="text-sm">{children}</ul>
    </div>
  )
}

const pts = (cfg: XPConfig, k: XPKey) => `${signed(cfg[k])} XP`

function ExampleTable({ lines, total }: { lines: XPLine[]; total: number }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {lines.map((l, i) => (
          <tr key={i} className="border-b border-white/5">
            <td className="py-1 pr-2">{l.label}</td>
            <td className="num py-1 text-right text-muted-foreground">{l.count > 1 ? `${l.count} × ` : ''}{signed(l.base)}{l.mult !== 1 ? ` ${mult(l.mult)}` : ''}</td>
            <td className="num w-20 whitespace-nowrap py-1 text-right text-white">{signed(l.points)}</td>
          </tr>
        ))}
        <tr><td colSpan={2} className="pt-2 font-bold">Total du match</td><td className="num whitespace-nowrap pt-2 text-right text-lg text-neon">{signed(total)} XP</td></tr>
      </tbody>
    </table>
  )
}

export function XPExplainer({ seasonId, className }: { seasonId?: string | null; className?: string }) {
  const { league } = useData()
  const cfg = useMemo(() => xpConfig(league.xpRules, seasonId), [league.xpRules, seasonId])
  const examples = useMemo(() => xpExamples(cfg), [cfg])
  const order = (k: keyof typeof RACE_CRITERIA) => RACE_CRITERIA[k].map((c) => c.label).join(', puis ')
  const imp = (['importance_league_phase', 'importance_gold', 'importance_silver', 'importance_knockout'] as const)
  const impAllOne = imp.every((k) => cfg[k] === 1)
  return (
    <details className={cn('group glass rounded-2xl', className)}>
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <Calculator className="size-5 shrink-0 text-neon" />
        <span className="flex-1 font-display text-lg font-black sm:text-xl">Comment sont calculés les XP et le classement</span>
        <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 px-4 pb-5 text-sm leading-relaxed">
        <p className="text-muted-foreground">Chaque action d’un match rapporte (ou coûte) des points d’expérience, les <b className="text-white">XP</b>. Ils sont recalculés automatiquement après chaque match. Chaque ligne est arrondie à l’entier.</p>
        <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-muted-foreground"><b className="text-white">Ce qui vient du règlement Ardentia :</b> le résultat d’un match (victoire, nul, défaite <ArtLink art="17.2" />), les cartons (2 jaunes dans un match = rouge, pas de cumul d’un match à l’autre <ArtLink art="11.5" />) et les suspensions, décidées uniquement par le conseil de discipline <ArtLink art="19" />. <b className="text-white">Ce qui est propre à la MBL :</b> le barème des XP ci-dessous (valeur de chaque action, multiplicateurs) — il ne change ni le classement des équipes ni les suspensions.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <Block title="Résultat">
            <Item label={XP_LABELS.win} value={pts(cfg, 'win')} note="pour chaque joueur ayant joué le match" />
            <Item label={XP_LABELS.loss} value={pts(cfg, 'loss')} note="pour chaque joueur ayant joué le match" />
            <Item label="Match nul" value="0 XP" />
          </Block>
          <Block title="Buts et passes">
            <Item label={XP_LABELS.goal} value={`${pts(cfg, 'goal')} × mult.`} />
            <Item label={XP_LABELS.assist} value={`${pts(cfg, 'assist')} × mult.`} />
            <Item label="Adversaire classé 1er à 3e" value={mult(cfg.mult_top3)} note="classement avant la journée" />
            <Item label="Adversaire classé 4e à 6e" value={mult(cfg.mult_4_6)} />
            <Item label="Adversaire classé 7e et au-delà" value={mult(cfg.mult_7plus)} />
            <Item label="Adversaire pas encore classé" value={mult(1)} note="avant le premier match de la compétition" />
          </Block>
          <Block title="Gardien">
            <Item label="Match sans but encaissé (clean sheet)" value={`${pts(cfg, 'clean_sheet_gk')}${impAllOne ? '' : ' × importance'}`} note="gardien ayant joué tout le match" />
            {!impAllOne && <Item label="Importance" value={`${mult(cfg.importance_league_phase)} · ${mult(cfg.importance_gold)} · ${mult(cfg.importance_silver)} · ${mult(cfg.importance_knockout)}`} note={`phase de ligue · ${phaseName('gold')} · ${phaseName('silver')} · phases finales`} />}
            <Item label={XP_LABELS.save} value={pts(cfg, 'save')} />
            <Item label={XP_LABELS.penalty_saved} value={pts(cfg, 'penalty_saved')} />
            <Item label={XP_LABELS.shootout_saved} value={pts(cfg, 'shootout_saved')} />
            <Item label={XP_LABELS.goal_conceded_gk} value={pts(cfg, 'goal_conceded_gk')} />
          </Block>
          <Block title="Discipline">
            <Item label={XP_LABELS.yellow} value={pts(cfg, 'yellow')} />
            <Item label="Deux jaunes dans le même match" value={pts(cfg, 'double_yellow_total')} note="au total (remplace les jaunes)" />
            <Item label={XP_LABELS.red_direct} value={pts(cfg, 'red_direct')} />
            <Item label="Chaque match de suspension" value={pts(cfg, 'per_suspension_match')} />
          </Block>
          <Block title="Homme du match">
            <Item label={XP_LABELS.motm} value={pts(cfg, 'motm')} note="désigné à la fin de chaque match" />
          </Block>
          <Block title="Bonus du mois">
            <Item label={XP_LABELS.player_of_month} value={pts(cfg, 'player_of_month')} />
            <Item label={XP_LABELS.team_of_month} value={pts(cfg, 'team_of_month')} note="pour chaque joueur de l’équipe ayant joué ce mois-ci" />
            <Item label={XP_LABELS.goal_of_month} value={pts(cfg, 'goal_of_month')} note="pour le buteur" />
          </Block>
          <Block title="Classement">
            <li className="py-1.5">Les joueurs sont classés par <b className="text-white">{order('xp')}</b>. En cas d’égalité parfaite, ils partagent le même rang.</li>
            <li className="py-1.5">La flèche ▲ / ▼ montre les places gagnées ou perdues depuis la journée précédente.</li>
            <li className="py-1.5"><b className="text-white">Ballon d’or</b> : {RACE_ELIGIBLE.ballon_or.label} ({num(cfg.min_matches_awards)}), classés par {order('ballon_or')}.</li>
            <li className="py-1.5"><b className="text-white">Gant d’or</b> : {RACE_ELIGIBLE.golden_glove.label} ({num(cfg.min_matches_awards)}), classés par {order('golden_glove')}.</li>
          </Block>
        </div>
        <div>
          <h4 className="mb-2 font-display text-lg font-black">Exemples chiffrés</h4>
          <div className="grid gap-3 md:grid-cols-2">
            {examples.map((ex) => (
              <div key={ex.title} className="rounded-xl bg-night-950/40 p-3">
                <div className="font-bold">{ex.title}</div>
                <p className="mb-2 text-xs text-muted-foreground">{ex.context}</p>
                <ExampleTable lines={ex.lines} total={ex.total} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </details>
  )
}

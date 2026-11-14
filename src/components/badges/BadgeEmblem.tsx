// Emblème de badge MBL : illustration SVG ORIGINALE (aucune icône de bibliothèque), en relief.
// La rareté se lit à la forme, la matière et l'effet :
//   Commun = bouclier simple en bronze cuivré · Rare = bouclier à ailettes bleu saphir
//   Épique = emblème à pointes améthyste, gemme, halo · Légendaire = médaillon couronné orange MBL / or, étoiles,
//   particules et reflet holographique.
// Paliers (I à IV) : chevrons sous l'emblème + chiffre romain. Verrouillé : silhouette sombre + cadenas.
// En mini (≤ 32 px), les détails sont simplifiés automatiquement. Animations coupées si prefers-reduced-motion.
import { useId, type ReactNode } from 'react'
import { ROMAN, type Pictogram, type Rarity } from '@/lib/badgeCatalog'

interface Palette { rim: [string, string]; face: [string, string, string, string]; glyph: string; shadow: string; halo?: string }
export const RARITY_PALETTE: Record<Rarity | 'locked', Palette> = {
  common: { rim: ['#2E1608', '#8C5427'], face: ['#6B3A16', '#C98245', '#F4C892', '#8F5426'], glyph: '#FFF3E2', shadow: '#2E1608' },
  rare: { rim: ['#081833', '#2F64B0'], face: ['#123571', '#3C78D4', '#B5D8FF', '#1C4A96'], glyph: '#F3F9FF', shadow: '#06142E' },
  epic: { rim: ['#1C0533', '#7230B5'], face: ['#371060', '#8B4CD6', '#E8CCFF', '#561C94'], glyph: '#FCF6FF', shadow: '#17042A', halo: '#B57CFF' },
  legendary: { rim: ['#4A1400', '#C64F00'], face: ['#9C3600', '#FF7A1F', '#FFE28F', '#E39B18'], glyph: '#FFFCF2', shadow: '#3D1000', halo: '#FF8A2A' },
  locked: { rim: ['#0A0F1C', '#1F2943'], face: ['#121A2D', '#1B2640', '#26324F', '#151E34'], glyph: '#3E4E74', shadow: '#070B15' },
}
/** couleur d'accent de chaque rareté (textes, barres, filtres) */
export const RARITY_ACCENT: Record<Rarity, string> = { common: '#E0A26A', rare: '#6FA8F0', epic: '#C08BFF', legendary: '#FF8A2A' }

// ---------------------------------------------------------------------------------------------------------
//  Formes (repère 100 × 100)
// ---------------------------------------------------------------------------------------------------------
const SHIELD = 'M50 7 L85 18 C85 18 86 40 84 52 C80 74 64 87 50 94 C36 87 20 74 16 52 C14 40 15 18 15 18 Z'
const SHIELD_NARROW = 'M50 9 L79 19 C79 19 80 40 78 51 C75 71 62 84 50 91 C38 84 25 71 22 51 C20 40 21 19 21 19 Z'
const WING_L = 'M22 24 L3 19 L9 30 L1 33 L10 40 L4 46 L21 49 Z'
const WING_R = 'M78 24 L97 19 L91 30 L99 33 L90 40 L96 46 L79 49 Z'
const spikes = (n: number, ro: number, ri: number, cx = 50, cy = 50, rot = -90) =>
  Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? ri : ro, a = ((rot + (i * 180) / n) * Math.PI) / 180; return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}` }).join(' ')
const SPIKED = spikes(8, 47, 37)
const CROWN = 'M28 22 L33 6 L42 16 L50 2 L58 16 L67 6 L72 22 Z'

function shapeFor(r: Rarity | 'locked', base: Rarity) {
  const k = r === 'locked' ? base : r
  if (k === 'common') return { d: SHIELD, poly: undefined, circle: false }
  if (k === 'rare') return { d: SHIELD_NARROW, poly: undefined, circle: false }
  if (k === 'epic') return { d: undefined, poly: SPIKED, circle: false }
  return { d: undefined, poly: undefined, circle: true }
}

// ---------------------------------------------------------------------------------------------------------
//  Pictogrammes (dessins originaux, centrés en 50,52, ~ 36 px)
// ---------------------------------------------------------------------------------------------------------
function Ball({ cx, cy, r, fill, ink }: { cx: number; cy: number; r: number; fill: string; ink: string }) {
  const k = r / 16
  const pent = Array.from({ length: 5 }, (_, i) => { const a = ((-90 + i * 72) * Math.PI) / 180; return `${(cx + 6 * k * Math.cos(a)).toFixed(2)},${(cy + 6 * k * Math.sin(a)).toFixed(2)}` }).join(' ')
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke={ink} strokeWidth={1.6 * k} />
      <polygon points={pent} fill={ink} />
      {Array.from({ length: 5 }, (_, i) => { const a = ((-90 + i * 72) * Math.PI) / 180; return <line key={i} x1={cx + 6 * k * Math.cos(a)} y1={cy + 6 * k * Math.sin(a)} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke={ink} strokeWidth={1.4 * k} /> })}
    </g>
  )
}
const Net = ({ ink, x = 30, y = 34, w = 40, h = 30 }: { ink: string; x?: number; y?: number; w?: number; h?: number }) => (
  <g stroke={ink} strokeWidth="1.2" opacity=".85" fill="none">
    <rect x={x} y={y} width={w} height={h} strokeWidth="2.2" />
    {Array.from({ length: 5 }, (_, i) => <line key={`v${i}`} x1={x + ((i + 1) * w) / 6} y1={y} x2={x + ((i + 1) * w) / 6} y2={y + h} />)}
    {Array.from({ length: 3 }, (_, i) => <line key={`h${i}`} x1={x} y1={y + ((i + 1) * h) / 4} x2={x + w} y2={y + ((i + 1) * h) / 4} />)}
  </g>
)
const Padlock = ({ cx, cy, s, fill, ink, label }: { cx: number; cy: number; s: number; fill: string; ink: string; label?: string }) => (
  <g transform={`translate(${cx} ${cy}) scale(${s})`}>
    <path d="M-8 -4 V-10 A8 8 0 0 1 8 -10 V-4" fill="none" stroke={fill} strokeWidth="4" />
    <path d="M-8 -4 V-10 A8 8 0 0 1 8 -10 V-4" fill="none" stroke={ink} strokeWidth="1.2" opacity=".6" />
    <rect x="-12" y="-5" width="24" height="19" rx="3.5" fill={fill} stroke={ink} strokeWidth="1.6" />
    {label ? <text x="0" y="10" textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="system-ui, sans-serif" fill={ink}>{label}</text>
      : <><circle cx="0" cy="3" r="2.6" fill={ink} /><rect x="-1.1" y="3" width="2.2" height="6" fill={ink} /></>}
  </g>
)
const FLAME = 'M50 22 C56 32 66 36 64 50 C63 60 57 66 50 67 C42 66 36 60 36 51 C36 44 40 41 42 36 C44 42 46 44 48 44 C47 36 48 28 50 22 Z'
const STAR = (cx: number, cy: number, ro: number, ri: number) => spikes(5, ro, ri, cx, cy)

function Glyph({ p, c, ink, simple }: { p: Pictogram; c: string; ink: string; simple: boolean }): ReactNode {
  const ball = (cx: number, cy: number, r: number) => <Ball cx={cx} cy={cy} r={r} fill={c} ink={ink} />
  switch (p) {
    case 'ball': return ball(50, 52, 17)
    case 'ball_net': return <>{!simple && <Net ink={c} />}{ball(simple ? 50 : 56, simple ? 52 : 57, simple ? 16 : 11)}</>
    case 'ball_target': return <>{!simple && <><circle cx="50" cy="52" r="19" fill="none" stroke={c} strokeWidth="2.5" /><circle cx="50" cy="52" r="13.5" fill="none" stroke={c} strokeWidth="2" opacity=".7" /></>}{ball(50, 52, simple ? 16 : 9)}</>
    case 'ball_fire': return <><path d={FLAME} transform="translate(0 -6) scale(1 1.05)" fill={c} opacity=".9" />{ball(50, 58, 11)}</>
    case 'boot': return (
      <g>
        <path d="M28 58 L29 38 Q30 34 34 34 L43 34 Q45 41 50 43 Q62 45 70 50 Q74 53 73 58 Z" fill={c} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
        {!simple && <path d="M36 38 L42 42 M38 36 L44 40" stroke={ink} strokeWidth="1.4" />}
        {[33, 42, 52, 62].map((x) => <rect key={x} x={x} y="58" width="4" height="5" rx="1" fill={c} stroke={ink} strokeWidth="1" />)}
      </g>
    )
    case 'pass': return (
      <g fill="none" stroke={c} strokeWidth="4" strokeLinecap="round">
        <path d="M30 60 Q50 30 70 46" />
        <path d="M62 40 L71 46 L63 53" strokeLinejoin="round" />
        {!simple && <circle cx="30" cy="60" r="4.5" fill={c} stroke="none" />}
      </g>
    )
    case 'baton': return (
      <g>
        <line x1="34" y1="68" x2="62" y2="40" stroke={c} strokeWidth="4" strokeLinecap="round" />
        <polygon points={STAR(64, 38, 11, 4.6)} fill={c} stroke={ink} strokeWidth="1" />
        {!simple && <><circle cx="32" cy="70" r="4" fill={c} /><path d="M40 40 Q36 34 40 30" stroke={c} strokeWidth="2" fill="none" opacity=".7" /></>}
      </g>
    )
    case 'compass': return (
      <g stroke={c} strokeWidth="4" strokeLinecap="round" fill="none">
        <circle cx="50" cy="31" r="4.5" fill={c} />
        <line x1="48" y1="35" x2="36" y2="70" /><line x1="52" y1="35" x2="64" y2="70" />
        {!simple && <path d="M36 62 Q50 72 64 62" strokeWidth="2.4" opacity=".75" />}
      </g>
    )
    case 'ball_boot': return <>{ball(62, 44, 10)}<path d="M26 66 L27 50 Q28 47 31 47 L38 47 Q40 52 44 54 Q53 55 59 59 Q62 61 61 66 Z" fill={c} stroke={ink} strokeWidth="1.5" /></>
    case 'bolts': return <>{[[-9, 0], [9, 4]].map(([dx, dy], i) => <path key={i} d="M52 30 L40 54 L49 54 L45 72 L60 46 L51 46 Z" transform={`translate(${dx} ${dy}) scale(.82) translate(11 9)`} fill={c} stroke={ink} strokeWidth="1.4" strokeLinejoin="round" />)}</>
    case 'orbit': return <>{ball(50, 52, 12)}<ellipse cx="50" cy="52" rx="24" ry="9" fill="none" stroke={c} strokeWidth="2.8" transform="rotate(-25 50 52)" />{!simple && <circle cx="71" cy="42" r="3.4" fill={c} />}</>
    case 'shield_check': return <><path d="M50 30 L67 36 C67 52 61 63 50 70 C39 63 33 52 33 36 Z" fill={c} stroke={ink} strokeWidth="1.6" /><path d="M42 50 L48 56 L59 43" fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></>
    case 'metronome': return <><path d="M42 30 L58 30 L68 70 L32 70 Z" fill={c} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" /><line x1="50" y1="64" x2="60" y2="36" stroke={ink} strokeWidth="2.6" strokeLinecap="round" /><circle cx="56" cy="47" r="3.4" fill={ink} /></>
    case 'armband': return <><rect x="28" y="38" width="44" height="28" rx="6" fill={c} stroke={ink} strokeWidth="1.6" /><text x="50" y="60.5" textAnchor="middle" fontSize="24" fontWeight="900" fontFamily="system-ui, sans-serif" fill={ink}>C</text>{!simple && <><line x1="28" y1="44" x2="72" y2="44" stroke={ink} strokeWidth="1" opacity=".4" /><line x1="28" y1="60" x2="72" y2="60" stroke={ink} strokeWidth="1" opacity=".4" /></>}</>
    case 'crown': return <><path d="M30 64 L28 38 L40 48 L50 32 L60 48 L72 38 L70 64 Z" fill={c} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" /><rect x="30" y="64" width="40" height="6" rx="2" fill={c} stroke={ink} strokeWidth="1.4" />{!simple && [40, 50, 60].map((x) => <circle key={x} cx={x} cy="57" r="2.4" fill={ink} />)}</>
    case 'balls2': return <>{ball(40, 52, 11)}{ball(61, 52, 11)}</>
    case 'balls3': return <>{ball(50, 41, 10)}{ball(39, 60, 10)}{ball(61, 60, 10)}</>
    case 'balls4': return <>{ball(39, 41, 9.5)}{ball(61, 41, 9.5)}{ball(39, 62, 9.5)}{ball(61, 62, 9.5)}</>
    case 'star_medal': return <><polygon points={STAR(50, 50, 20, 8.5)} fill={c} stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />{!simple && <circle cx="50" cy="51" r="4.5" fill={ink} opacity=".45" />}</>
    case 'flame': return <><path d={FLAME} fill={c} stroke={ink} strokeWidth="1.6" />{!simple && <path d="M50 46 C53 51 56 53 55 58 C54 62 52 63 50 63 C47 63 45 61 45 58 C45 55 48 52 50 46 Z" fill={ink} opacity=".45" />}</>
    case 'bullseye': return <><circle cx="50" cy="52" r="18" fill="none" stroke={c} strokeWidth="3.4" /><circle cx="50" cy="52" r="10" fill="none" stroke={c} strokeWidth="3" /><circle cx="50" cy="52" r="3.6" fill={c} />{!simple && <path d="M57 45 L70 32 M64 32 L70 32 L70 38" stroke={c} strokeWidth="2.6" fill="none" strokeLinecap="round" />}</>
    case 'crosshair': return <g stroke={c} strokeWidth="3.2" fill="none" strokeLinecap="round"><circle cx="50" cy="52" r="15" /><line x1="50" y1="30" x2="50" y2="41" /><line x1="50" y1="63" x2="50" y2="74" /><line x1="28" y1="52" x2="39" y2="52" /><line x1="61" y1="52" x2="72" y2="52" /><circle cx="50" cy="52" r="3" fill={c} stroke="none" /></g>
    case 'glove': return (
      <g fill={c} stroke={ink} strokeWidth="1.5" strokeLinejoin="round">
        <path d="M36 70 L36 46 Q36 42 40 42 L40 30 Q40 27 43 27 Q46 27 46 30 L46 40 L46 27 Q46 24 49.5 24 Q53 24 53 27 L53 40 L53 29 Q53 26 56 26 Q59 26 59 29 L59 42 L59 34 Q59 31 62 31 Q65 31 65 34 L65 56 Q65 64 58 70 Z" />
        <path d="M36 52 Q30 48 30 42 Q30 38 34 39 L40 46" />
        {!simple && <rect x="36" y="66" width="22" height="6" rx="2" fill={ink} opacity=".55" stroke="none" />}
      </g>
    )
    case 'wall': return <g fill={c} stroke={ink} strokeWidth="1.4">{[[30, 34, 18], [50, 34, 20], [30, 44, 10], [42, 44, 18], [62, 44, 8], [30, 54, 18], [50, 54, 20], [30, 64, 10], [42, 64, 18], [62, 64, 8]].map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height="9" rx="1.2" />)}</g>
    case 'lock_net': return <>{!simple && <Net ink={c} x={27} y={30} w={46} h={34} />}<Padlock cx={50} cy={simple ? 54 : 58} s={simple ? 1.25 : 0.95} fill={c} ink={ink} /></>
    case 'lock3': return <>{!simple && <Net ink={c} x={27} y={30} w={46} h={34} />}<Padlock cx={50} cy={simple ? 54 : 58} s={simple ? 1.3 : 1.05} fill={c} ink={ink} label="3" /></>
  }
}

// ---------------------------------------------------------------------------------------------------------
//  Emblème
// ---------------------------------------------------------------------------------------------------------
export interface BadgeEmblemProps {
  pictogram: Pictogram
  rarity: Rarity
  /** palier 1…4 (badges cumulatifs) */
  level?: number
  locked?: boolean
  size?: number
  /** nom du badge (texte alternatif) */
  title: string
  className?: string
}

export function BadgeEmblem({ pictogram, rarity, level, locked = false, size = 96, title, className }: BadgeEmblemProps) {
  const uid = useId().replace(/:/g, '')
  const mini = size <= 32
  const pal = RARITY_PALETTE[locked ? 'locked' : rarity]
  const shape = shapeFor(locked ? 'locked' : rarity, rarity)
  const outer = (props: Record<string, unknown>) => shape.circle ? <circle cx="50" cy="52" r="38" {...props} /> : shape.poly ? <polygon points={shape.poly} {...props} /> : <path d={shape.d} {...props} />
  const k = (n: string) => `${n}-${uid}`
  const showLevel = !!level && !mini
  return (
    <svg viewBox="-12 -12 124 132" width={size} height={size * (132 / 124)} role="img" aria-label={locked ? `${title} (verrouillé)` : title}
      className={['bdg', `bdg-${locked ? 'locked' : rarity}`, mini ? 'bdg-mini' : '', className ?? ''].join(' ')} style={{ overflow: 'visible' }}>
      <title>{locked ? `${title} — verrouillé` : title}</title>
      <defs>
        <linearGradient id={k('rim')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={pal.rim[1]} /><stop offset="1" stopColor={pal.rim[0]} /></linearGradient>
        <linearGradient id={k('face')} x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stopColor={pal.face[2]} /><stop offset=".35" stopColor={pal.face[1]} /><stop offset=".75" stopColor={pal.face[0]} /><stop offset="1" stopColor={pal.face[3]} /></linearGradient>
        <radialGradient id={k('gloss')} cx=".35" cy=".2" r=".7"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".6" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <linearGradient id={k('holo')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffc15f" stopOpacity="0" /><stop offset=".38" stopColor="#ffd98a" stopOpacity=".3" /><stop offset=".5" stopColor="#8ff6ff" stopOpacity=".28" /><stop offset=".62" stopColor="#fff2a8" stopOpacity=".32" /><stop offset="1" stopColor="#ffe45f" stopOpacity="0" /></linearGradient>
        <clipPath id={k('clip')}>{outer({})}</clipPath>
        <filter id={k('inner')} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="2.2" result="b" /><feOffset dy="2.4" dx="0" in="b" result="o" /><feComposite in="o" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="sh" /><feFlood floodColor="#000" floodOpacity=".55" /><feComposite in2="sh" operator="in" /><feMerge><feMergeNode in="SourceGraphic" /><feMergeNode /></feMerge></filter>
      </defs>

      {/* halo (épique / légendaire) */}
      {!locked && pal.halo && !mini && <circle cx="50" cy="52" r="52" fill={pal.halo} opacity=".22" className="bdg-halo" />}
      {/* ailettes (rare), couronne (légendaire) */}
      {!locked && rarity === 'rare' && !mini && <g fill={`url(#${k('rim')})`} stroke={pal.shadow} strokeWidth="1"><path d={WING_L} /><path d={WING_R} /></g>}
      {rarity === 'legendary' && <path d={CROWN} transform={mini ? undefined : 'translate(0 -4)'} fill={locked ? pal.face[1] : '#FFD45A'} stroke={pal.shadow} strokeWidth="1.4" strokeLinejoin="round" />}

      {/* corps en relief : contour, face biseautée, ombre interne */}
      <g transform="translate(0 1.5)" opacity=".55">{outer({ fill: '#000' })}</g>
      {outer({ fill: `url(#${k('rim')})` })}
      <g transform="translate(50 52) scale(.86) translate(-50 -52)" filter={mini ? undefined : `url(#${k('inner')})`}>{outer({ fill: `url(#${k('face')})` })}</g>
      {!mini && <g clipPath={`url(#${k('clip')})`}>
        <ellipse cx="42" cy="26" rx="34" ry="20" fill={`url(#${k('gloss')})`} />
        {!locked && rarity === 'legendary' && <rect x="-10" y="-10" width="120" height="130" fill={`url(#${k('holo')})`} className="bdg-holo" style={{ mixBlendMode: 'screen' }} />}
        {!locked && <rect x="-60" y="-20" width="26" height="150" fill="#fff" opacity=".28" transform="rotate(20)" className="bdg-shine" />}
      </g>}
      {/* gemme (épique) */}
      {!locked && rarity === 'epic' && !mini && <polygon points="50,11 56,17 50,23 44,17" fill="#F4E4FF" stroke="#3B0F66" strokeWidth="1.2" />}
      {/* étoiles (légendaire) */}
      {!locked && rarity === 'legendary' && !mini && [[22, 80], [78, 80], [50, 92]].map(([x, y], i) => <polygon key={i} points={STAR(x, y, 5.5, 2.4)} fill="#FFE28F" stroke={pal.shadow} strokeWidth=".8" />)}

      {/* pictogramme (ombre portée + dessin) */}
      <g transform="translate(0 1.6)" opacity=".6"><Glyph p={pictogram} c={pal.shadow} ink={pal.shadow} simple={mini} /></g>
      <Glyph p={pictogram} c={pal.glyph} ink={locked ? '#0E1424' : pal.shadow} simple={mini} />

      {/* particules (légendaire) */}
      {!locked && rarity === 'legendary' && !mini && [[14, 30, 0], [86, 26, 1.1], [10, 62, 2.2], [92, 58, 0.6], [30, 6, 1.7], [70, 4, 2.8]].map(([x, y, d], i) => <circle key={i} cx={x} cy={y} r="1.8" fill="#FFD27A" className="bdg-spark" style={{ animationDelay: `${d}s` }} />)}

      {/* palier : chevrons + chiffre romain */}
      {showLevel && (
        <g>
          <rect x="34" y="96" width="32" height="14" rx="7" fill={locked ? '#151E34' : pal.rim[0]} stroke={locked ? '#2A3658' : pal.face[2]} strokeWidth="1.2" />
          <text x="50" y="106.5" textAnchor="middle" fontSize="10" fontWeight="900" fontFamily="system-ui, sans-serif" fill={locked ? '#55678f' : pal.face[2]}>{ROMAN[level!]}</text>
          {Array.from({ length: level! }, (_, i) => <path key={i} d={`M${50 - (level! - 1) * 5 + i * 10 - 4} 113 L${50 - (level! - 1) * 5 + i * 10} 117 L${50 - (level! - 1) * 5 + i * 10 + 4} 113`} fill="none" stroke={locked ? '#3A4A6E' : pal.face[1]} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />)}
        </g>
      )}
      {/* verrou */}
      {locked && (mini
        ? <Padlock cx={80} cy={86} s={0.95} fill="#8FA0C6" ink="#0B1222" />
        : <g><circle cx="82" cy="86" r="13" fill="#0B1222" stroke="#33426A" strokeWidth="1.5" /><Padlock cx={82} cy={88} s={0.62} fill="#8FA0C6" ink="#0B1222" /></g>)}
    </svg>
  )
}

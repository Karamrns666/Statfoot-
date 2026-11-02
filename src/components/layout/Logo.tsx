import { Link } from 'react-router-dom'
export function Logo({ to = '/', subtitle }: { to?: string; subtitle?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <svg viewBox="0 0 64 64" className="size-9 drop-shadow-[0_0_10px_rgb(34_211_238/.6)]" aria-hidden>
        <rect width="64" height="64" rx="16" fill="#0B1426" stroke="#22d3ee" strokeOpacity=".5" />
        <circle cx="32" cy="32" r="19" fill="none" stroke="#22d3ee" strokeWidth="4.5" />
        <path d="M32 19 L40 26 L37 37 H27 L24 26 Z" fill="#22d3ee" />
        <path d="M32 19 V13 M40 26 L46 23 M37 37 L41 43 M27 37 L23 43 M24 26 L18 23" stroke="#22d3ee" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <div className="leading-none">
        <div className="title-caps text-2xl"><span className="text-white">Stat</span><span className="text-neon neon-text">Foot</span></div>
        {subtitle && <div className="text-[10px] font-semibold uppercase tracking-[.2em] text-muted-foreground">{subtitle}</div>}
      </div>
    </Link>
  )
}

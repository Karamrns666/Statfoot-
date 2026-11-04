// Pictogrammes génériques (traits simples) pour les réseaux — sans reproduire les logos des marques.
import type { SVGProps } from 'react'
const base = (p: SVGProps<SVGSVGElement>) => ({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true, ...p })
export const IconInstagram = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r=".8" fill="currentColor" stroke="none" /></svg>
export const IconLinkedin = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10.5V16M8 7.6v.1M11.5 16v-5.5M11.5 13c0-1.7 1-2.6 2.3-2.6s2.2.9 2.2 2.6V16" /></svg>
export const IconWhatsapp = (p: SVGProps<SVGSVGElement>) => <svg {...base(p)}><path d="M4 20l1.2-3.6A8 8 0 1 1 8 19.1z" /><path d="M9.2 8.6c.2-.5.6-.6.9-.6h.4l.9 2-.6.8c.4 1 1.2 1.8 2.3 2.3l.8-.6 2 .9v.4c0 .3-.1.7-.6.9-.8.4-2.2.2-3.7-.9a8 8 0 0 1-2.6-3c-.6-1.2-.2-1.9-.2-2.2z" /></svg>

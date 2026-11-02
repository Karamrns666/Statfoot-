import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export function QrCode({ value, size = 160, className }: { value: string; size?: number; className?: string }) {
  const [src, setSrc] = useState('')
  useEffect(() => { QRCode.toDataURL(value, { width: size * 2, margin: 1, color: { dark: '#04163D', light: '#ffffff' } }).then(setSrc) }, [value, size])
  return src ? <img src={src} width={size} height={size} alt={`QR code : ${value}`} className={className} /> : <div style={{ width: size, height: size }} />
}
export const pitchSlug = (pitch?: string) => (pitch ?? 'tous').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

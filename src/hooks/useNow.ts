import { useEffect, useState } from 'react'
/** Re-render périodique (chrono live) */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t) }, [intervalMs])
  return now
}

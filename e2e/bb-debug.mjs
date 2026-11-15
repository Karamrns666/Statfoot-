// Diagnostic : premier panneau du billboard sur iPhone (WebKit), site en ligne
import { webkit, chromium, devices } from '@playwright/test'
import fs from 'node:fs'
fs.mkdirSync('bb-out', { recursive: true })
const ST = () => {
  const sl = [...document.querySelectorAll('.bb-slide')].map((e) => {
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e)
    const kids = [...e.querySelectorAll('img,div')].slice(0, 4).map((k) => { const kr = k.getBoundingClientRect(), kc = getComputedStyle(k); return `${k.tagName}${k.className.toString().slice(0, 30)}[${Math.round(kr.x)},${Math.round(kr.y)} ${Math.round(kr.width)}x${Math.round(kr.height)} op${kc.opacity} vis${kc.visibility} tr${kc.transform.slice(0, 30)} anim${kc.animationName}${k.tagName === 'IMG' ? ' ok' + k.complete + k.naturalWidth : ''}]` })
    return { cls: e.className.slice(-40), rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)], op: cs.opacity, clip: cs.clipPath, anim: cs.animationName, kids }
  })
  const p = document.querySelector('.bb-panel'); const pr = p?.getBoundingClientRect()
  return { sl, panel: pr && [Math.round(pr.x), Math.round(pr.y), Math.round(pr.width), Math.round(pr.height)], dot: [...document.querySelectorAll('[role=tab]')].findIndex((b) => b.getAttribute('aria-selected') === 'true') }
}
for (const [name, eng, dev] of [['iphone', webkit, devices['iPhone 13']], ['iphone-noMobile', webkit, { ...devices['iPhone 13'], isMobile: false, hasTouch: false, deviceScaleFactor: 1 }], ['ipad', webkit, devices['iPad (gen 7)']], ['chromium-iphone', chromium, devices['iPhone 13']]]) {
  const b = await eng.launch(); const p = await (await b.newContext({ ...dev, locale: 'fr-FR' })).newPage()
  await p.goto('https://www.ardentia-foot.com/?d=' + Date.now())
  await p.waitForSelector('.bb-slide', { timeout: 30000 }).catch(() => {})
  for (const ms of [300, 1500, 3000]) { await p.waitForTimeout(ms === 300 ? 300 : ms === 1500 ? 1200 : 1500); console.log(name, ms, JSON.stringify(await p.evaluate(ST))); await p.screenshot({ path: `bb-out/${name}-${ms}.png` }) }
  await b.close()
}

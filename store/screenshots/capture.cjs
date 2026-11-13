// Capture the raw Haddington Bible screens from the web export of the app, at the size of an iPhone.
// node capture.cjs <outDir> [baseUrl]
const { chromium } = require('playwright')
const OUT = process.argv[2]
const B = process.argv[3] ?? 'http://localhost:18190'
;(async () => {
  const b = await chromium.launch()
  const ctx = await b.newContext({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, serviceWorkers: 'block' })
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  const shot = async (n) => {
    await p.waitForTimeout(900)
    await p.screenshot({ path: `${OUT}/${n}.png` })
    console.log(n)
  }
  await p.goto(B + '/read/Ps/23', { waitUntil: 'networkidle' })
  await shot('chapter')
  await p.getByText('Ps.80.1', { exact: true }).first().click()
  await shot('reference')
  await p.goto(B + '/read/John/3', { waitUntil: 'networkidle' })
  await p.waitForTimeout(500)
  await p.getByText('Notes ↓').click()
  await shot('notes')
  await p.goto(B + '/', { waitUntil: 'networkidle' })
  await shot('contents')
  await b.close()
  if (errors.length) {
    console.error(errors.join('\n'))
    process.exit(1)
  }
})().catch((e) => {
  console.error(e.message)
  process.exit(1)
})

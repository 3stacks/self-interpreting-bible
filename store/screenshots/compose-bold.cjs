// Draws a bold set of store screenshots from a config file. The cards make one panorama.
//
//   NODE_PATH=<playwright and sharp> node compose-bold.cjs <config.json> <outDir> [--portrait <file>]
//
// Config: { raw: <dir>, statusBar: bool, play: bool,
//           palette: { loud, loudInk, mid, dark, pop },
//           cards: [{ shot, lines: [{ t, size, key }], tilt, dx,
//                     pops: [{ crop: [x, y, w, h], w, x, y, rot }],
//                     pills: [{ t, x, y, rot, dot, kind }] }] }
// A crop is in px of the raw screen. x is in design px from the left of the card (1320 wide).
// y is in design px from the top of the phone.
const { chromium } = require('playwright')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const [cfgPath, outArg] = process.argv.slice(2)
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const outRoot = path.resolve(outArg)
const rawDir = path.resolve(path.dirname(cfgPath), cfg.raw)
const fontUrl = (f) => pathToFileURL(path.join(__dirname, 'fonts', f)).href
const rawUrl = (f) => pathToFileURL(path.join(rawDir, f)).href

const CARD = 1320
const TARGETS = [
  { dir: 'ios', w: 1320, h: 2868, design: 2868, phone: 1000 },
  { dir: 'ios-6.3', w: 1206, h: 2622, design: 2868, phone: 1000 },
  ...(cfg.play ? [{ dir: 'play', w: 1080, h: 1920, design: 2347, phone: 900 }] : []),
]
const P = cfg.palette
const n = cfg.cards.length
// The first card and the last card are loud. One card in the middle is dark.
const scheme = (i) => {
  if (i === 0 || i === n - 1) return { bg: P.loud, ink: P.loudInk, key: P.loudInk, light: true }
  if (i === Math.floor(n / 2)) return { bg: P.dark, ink: '#ffffff', key: P.pop }
  return { bg: P.mid, ink: '#ffffff', key: P.pop }
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const check = (size, colour) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="${colour}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function html(t, bars) {
  const H = t.design
  const pw = t.phone
  const sbar = cfg.statusBar ? 0 : pw * 0.118
  const shotH = (pw * 2868) / 1320
  const screenH = Math.min(shotH + sbar, (pw * 2868) / 1320)
  const phoneTop = 900
  const x0 = (i) => i * CARD
  const py = (d) => Math.round(phoneTop + (d * (H - phoneTop)) / (2868 - phoneTop))
  const tops = [0.36, 0.5, 0.62, 0.74, 0.86]

  let out = ''
  cfg.cards.forEach((c, i) => {
    const s = scheme(i)
    out += `<div class="bg" style="left:${x0(i)}px;background:${s.bg}"></div>`
    out += `<div class="bar" style="left:${x0(i) + 60}px;top:${tops[i] * H}px;width:${CARD - 120}px;height:${H}px;background:${s.light ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'}"></div>`
  })
  cfg.cards.forEach((c, i) => {
    const left = x0(i) + (CARD - pw) / 2 + (c.dx || 0)
    const b = bars[i]
    out += `<div class="phone" style="left:${left}px;top:${phoneTop}px;width:${pw}px;height:${screenH}px;transform:rotate(${c.tilt}deg)"><div class="screen">
${cfg.statusBar ? '' : `<div class="sbar" style="height:${sbar}px;background:${b.bg};color:${b.ink};font-size:${pw * 0.044}px"><b>9:41</b><svg height="0.8em" viewBox="0 0 66 24" fill="currentColor"><rect x="0" y="14" width="5" height="8" rx="1.5"/><rect x="8" y="10" width="5" height="12" rx="1.5"/><rect x="16" y="6" width="5" height="16" rx="1.5"/><rect x="24" y="2" width="5" height="20" rx="1.5"/><rect x="38" y="4" width="26" height="16" rx="5"/></svg></div>`}
<img src="${rawUrl(c.shot)}"></div><i class="island"></i></div>`
  })
  cfg.cards.forEach((c, i) => {
    const s = scheme(i)
    const lines = c.lines
      .map((l) =>
        l.key
          ? `<em style="font-size:${l.size}px">${esc(l.t)}</em>`
          : `<span class="s" style="font-size:${l.size || 150}px">${esc(l.t)}</span>`,
      )
      .join('')
    out += `<h1 style="left:${x0(i) + 84}px;color:${s.ink};--key:${s.key}">${lines}</h1>`
    for (const p of c.pops || []) {
      const [cx, cy, cw, ch] = p.crop
      const k = p.w / cw
      out += `<div class="pop crop" style="left:${x0(i) + p.x}px;top:${py(p.y)}px;width:${p.w}px;height:${ch * k}px;transform:rotate(${p.rot || 0}deg);background-image:url(${rawUrl(c.shot)});background-size:${1320 * k}px auto;background-position:${-cx * k}px ${-cy * k}px"></div>`
    }
    for (const p of c.pills || []) {
      const kind = p.kind || 'white'
      const style =
        kind === 'pop'
          ? `background:${P.pop};color:${P.dark}`
          : kind === 'dark'
            ? `background:${P.dark};color:${P.pop}`
            : kind === 'loud'
              ? `background:${P.loud};color:${P.loudInk}`
              : `background:#fff;color:${P.dark}`
      const y = p.abs ? p.y : py(p.y)
      out += `<div class="pop pill${p.italic ? ' it' : ''}" style="left:${x0(i) + p.x}px;top:${y}px;transform:rotate(${p.rot || 0}deg);font-size:${p.size || 62}px;${style}">${p.dot ? `<i style="background:${p.dot}"></i>` : ''}${p.check ? check(70, 'currentColor') : ''}${esc(p.t)}</div>`
    }
  })
  if (cfg.chat) {
    const c = cfg.chat
    const portrait = process.argv.includes('--portrait')
      ? pathToFileURL(path.resolve(process.argv[process.argv.indexOf('--portrait') + 1])).href
      : ''
    out += `<div class="chat" style="left:${x0(c.card) + c.x}px;top:${py(c.y)}px">${portrait ? `<img class="avatar" src="${portrait}">` : ''}<div class="bubble"><p>${esc(c.t)}</p></div></div>`
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; font-style: normal; font-weight: 100 900; src: url(${fontUrl('Inter.ttf')}); }
@font-face { font-family: Inter; font-style: italic; font-weight: 100 900; src: url(${fontUrl('Inter-Italic.woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { width: ${CARD * n}px; height: ${H}px; position: relative; overflow: hidden; font-family: Inter, sans-serif; }
.bg { position: absolute; top: 0; width: ${CARD}px; height: ${H}px; }
.bar { position: absolute; border-radius: 90px 90px 0 0; }
h1 { position: absolute; top: 150px; width: ${CARD - 130}px; font-weight: 800; letter-spacing: -0.035em; line-height: 0.98; }
h1 .s { display: block; white-space: nowrap; }
h1 em { display: block; font-weight: 900; font-style: italic; letter-spacing: -0.055em; line-height: 0.95; color: var(--key); margin-left: -8px; white-space: nowrap; }
.phone { position: absolute; border-radius: 150px; background: #05070f; box-shadow: 0 0 0 22px #05070f, 0 0 0 26px rgba(255,255,255,0.18), 0 70px 140px rgba(5,7,15,0.45); }
.screen { width: 100%; height: 100%; border-radius: 128px; overflow: hidden; background: #fff; }
.screen img { width: 100%; display: block; }
.sbar { display: flex; align-items: flex-end; justify-content: space-between; padding: 0 9% 3.2%; font-weight: 700; }
.sbar span { display: flex; gap: 6px; align-items: center; }
.sbar span i { display: block; height: 0.62em; background: currentColor; border-radius: 6px; opacity: 0.9; }
.island { position: absolute; left: 35%; width: 30%; height: ${(pw * 0.046).toFixed(1)}px; top: ${(pw * 0.037).toFixed(1)}px; border-radius: 80px; background: #05070f; }
.pop { position: absolute; box-shadow: 0 40px 90px rgba(5,7,15,0.38); }
.crop { border-radius: 40px; border: 8px solid #fff; background-color: #fff; background-repeat: no-repeat; }
.pill { display: flex; align-items: center; gap: 28px; border-radius: 200px; padding: 32px 58px; font-weight: 800; white-space: nowrap; letter-spacing: -0.02em; }
.pill.it { font-style: italic; font-weight: 900; letter-spacing: -0.03em; }
.pill i { width: 52px; height: 52px; border-radius: 14px; display: block; }
.chat { position: absolute; display: flex; align-items: flex-end; gap: 30px; transform: rotate(-4deg); }
.avatar { width: 290px; height: 290px; border-radius: 50%; object-fit: cover; object-position: 50% 22%; border: 12px solid #fff; box-shadow: 0 24px 60px rgba(5,7,15,0.35); flex: none; }
.bubble { background: #fff; border-radius: 70px 70px 70px 18px; padding: 44px 54px; max-width: 640px; box-shadow: 0 40px 90px rgba(5,7,15,0.38); font-size: 52px; font-weight: 600; color: ${P.dark}; line-height: 1.25; }
</style></head><body>${out}</body></html>`
}

async function main() {
  // The status bar takes the colour of the top of each screen.
  const bars = []
  for (const c of cfg.cards) {
    const { data } = await sharp(path.join(rawDir, c.shot)).extract({ left: 6, top: 6, width: 4, height: 4 }).raw().toBuffer({ resolveWithObject: true })
    const [r, g, b] = data
    bars.push({ bg: `rgb(${r},${g},${b})`, ink: 0.299 * r + 0.587 * g + 0.114 * b > 140 ? '#0b1020' : '#ffffff' })
  }
  const browser = await chromium.launch()
  fs.mkdirSync(outRoot, { recursive: true })
  const tmp = path.join(outRoot, '.panorama.html')
  for (const t of TARGETS) {
    const page = await browser.newPage({ viewport: { width: CARD * n, height: t.design } })
    fs.writeFileSync(tmp, html(t, bars))
    await page.goto(pathToFileURL(tmp).href)
    await page.evaluate(() => document.fonts.ready)
    const shot = await page.screenshot({ type: 'png' })
    await page.close()
    const dir = path.join(outRoot, t.dir)
    fs.mkdirSync(dir, { recursive: true })
    const pano = await sharp(shot).resize(t.w * n, t.h, { fit: 'fill' }).flatten({ background: P.dark }).png().toBuffer()
    await sharp(pano).toFile(path.join(dir, 'panorama.png'))
    for (let i = 0; i < n; i++) {
      await sharp(pano).extract({ left: i * t.w, top: 0, width: t.w, height: t.h }).toFile(path.join(dir, `screenshot-${i + 1}.png`))
    }
    console.log(`${t.dir}: ${n} × ${t.w} × ${t.h}`)
  }
  fs.rmSync(tmp)
  await browser.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

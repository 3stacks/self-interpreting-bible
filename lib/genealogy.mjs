// Redraws the "Genealogy of the Patriarchs" grid as a lifespan chart: one bar per patriarch on a
// Year-of-the-World axis, so overlapping lives (who knew whom) read at a glance.

export function renderGenealogyChart(md) {
  const rows = md.split('\n').filter((l) => /^\|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const lives = new Map();
  let flood = null;
  for (const r of rows) {
    const [name, event, yw] = r;
    const year = event === 'Created' ? 0 : parseInt(yw, 10);
    if (!name || Number.isNaN(year)) continue;
    if (/deluge|flood/i.test(name + event)) { flood = year; continue; }
    const life = lives.get(name) ?? { name };
    if (/created|born/i.test(event)) life.born = year;
    if (/died|transl/i.test(event)) { life.died = year; life.translated = /transl/i.test(event); }
    lives.set(name, life);
  }
  const list = [...lives.values()].filter((l) => l.born != null && l.died != null);
  if (list.length < 5) return '';

  const max = Math.ceil(Math.max(...list.map((l) => l.died)) / 100) * 100;
  const W = 900, labelW = 104, padR = 16, rowH = 22, top = 34;
  const H = top + list.length * rowH + 28;
  const x = (y) => labelW + (y / max) * (W - labelW - padR);

  let svg = '';
  for (let t = 0; t <= max; t += 200) {
    svg += `<line x1="${x(t)}" x2="${x(t)}" y1="${top - 8}" y2="${H - 22}" class="g-grid"/>`;
    svg += `<text x="${x(t)}" y="${H - 6}" class="g-tick" text-anchor="middle">${t}</text>`;
  }
  if (flood != null) {
    svg += `<line x1="${x(flood)}" x2="${x(flood)}" y1="${top - 14}" y2="${H - 22}" class="g-flood"/>`;
    svg += `<text x="${x(flood) + 5}" y="${top - 18}" class="g-flood-label">The Flood, A.M. ${flood}</text>`;
  }
  list.forEach((l, i) => {
    const y = top + i * rowH;
    const age = l.died - l.born;
    svg += `<g class="g-row"><title>${l.name}: born A.M. ${l.born}, ${l.translated ? 'translated' : 'died'} A.M. ${l.died}, aged ${age}</title>`;
    svg += `<text x="${labelW - 8}" y="${y + 14}" class="g-name" text-anchor="end">${l.name}</text>`;
    svg += `<rect x="${x(l.born)}" y="${y + 4}" width="${Math.max(2, x(l.died) - x(l.born))}" height="${rowH - 8}" rx="2" class="g-bar${l.translated ? ' g-transl' : ''}"/>`;
    const inside = x(l.died) - x(l.born) > 44;
    svg += `<text x="${inside ? x(l.died) - 5 : x(l.died) + 5}" y="${y + 14.5}" class="g-age${inside ? ' in' : ''}" text-anchor="${inside ? 'end' : 'start'}">${age}</text></g>`;
  });

  return `<figure class="genealogy-chart">
  <div class="chart-scroll"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Lifespans of the patriarchs from Adam to Jacob by year of the world">${svg}</svg></div>
  <figcaption>Lifespans redrawn from the table below, by year of the world (A.M.). Bar labels give age at death. Enoch's bar marks his translation.</figcaption>
</figure>`;
}

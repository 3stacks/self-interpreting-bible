// Scripture popovers, page-scan viewer, table filters, the Bible reader and search.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage unavailable */ } },
  };
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // ---------- KJV data ----------
  const bookCache = {};
  const loadBook = (code) => (bookCache[code] ??= fetch(`kjv/${code}.json`).then((r) => r.json()));
  let booksMeta;
  const loadBooks = () => (booksMeta ??= fetch('kjv/books.json').then((r) => r.json()));

  // "Isa.9.6-7,9" → { code, ch, ranges: [[6,7],[9,9]] }
  function parseRef(id) {
    const [code, ch, vv] = id.split('.');
    const ranges = vv ? vv.split(',').map((p) => { const [a, b] = p.split('-').map(Number); return [a, b || a]; }) : null;
    return { code, ch: +ch, ranges };
  }

  // ---------- Popover ----------
  const pop = $('#popover');
  let hideTimer, showTimer, current;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  async function showPopover(a) {
    current = a;
    const { code, ch, ranges } = parseRef(a.dataset.ref);
    const [books, chapters] = await Promise.all([loadBooks(), loadBook(code)]);
    if (current !== a) return;
    const name = books.find((b) => b[0] === code)?.[1] ?? code;
    const verses = chapters[ch - 1] || [];
    let nums = [];
    if (ranges) for (const [x, y] of ranges) for (let v = x; v <= y; v++) nums.push(v);
    else nums = verses.map((_, i) => i + 1).slice(0, 5);
    const capped = nums.slice(0, 12);
    const label = `${name} ${ch}${ranges ? ':' + a.dataset.ref.split('.')[2].replace(/,/g, ', ') : ''}`;
    pop.innerHTML = `<h4>${esc(label)} · KJV</h4><div class="verses">${capped
      .map((v) => `<p><sup>${v}</sup>${esc(verses[v - 1] ?? '')}</p>`).join('')}${nums.length > capped.length || !ranges ? '<p>…</p>' : ''}</div>
      <a class="more" href="${a.getAttribute('href')}">Read ${esc(name)} ${ch}</a>`;
    pop.hidden = false;
    place(a);
  }
  function place(a) {
    const r = a.getBoundingClientRect();
    const pw = pop.offsetWidth, ph = pop.offsetHeight;
    let left = r.left + window.scrollX;
    left = Math.max(window.scrollX + 16, Math.min(left, window.scrollX + document.documentElement.clientWidth - pw - 16));
    let top = r.bottom + window.scrollY + 6;
    if (r.bottom + ph + 12 > innerHeight && r.top > ph + 12) top = r.top + window.scrollY - ph - 6;
    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
  }
  function hideSoon() { clearTimeout(showTimer); hideTimer = setTimeout(() => { pop.hidden = true; current = null; }, 180); }

  if (pop) {
    document.addEventListener('mouseover', (e) => {
      const a = e.target.closest('a.ref');
      if (a && finePointer) { clearTimeout(hideTimer); clearTimeout(showTimer); showTimer = setTimeout(() => showPopover(a), 140); }
      else if (e.target.closest('#popover')) clearTimeout(hideTimer);
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a.ref') || e.target.closest('#popover')) hideSoon();
    });
    document.addEventListener('focusin', (e) => { const a = e.target.closest('a.ref'); if (a) showPopover(a); });
    // On touch screens the first tap previews the passage; the link inside the popover opens the chapter.
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a.ref');
      if (a && !finePointer && current !== a) { e.preventDefault(); showPopover(a); return; }
      if (!e.target.closest('#popover') && !a) { pop.hidden = true; current = null; }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { pop.hidden = true; current = null; } });
  }

  // ---------- Contents toggle (narrow screens) ----------
  const tocBtn = $('.toc-toggle'), toc = $('#toc');
  tocBtn?.addEventListener('click', () => {
    const open = toc.classList.toggle('open');
    tocBtn.setAttribute('aria-expanded', String(open));
  });

  // ---------- Page-scan viewer ----------
  const dlg = $('#scan-viewer');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.scan-btn');
    if (!b) return;
    $('#scan-img').src = b.dataset.scan;
    $('#scan-label').textContent = `${b.dataset.label} · original scan`;
    dlg.showModal();
  });
  $('#scan-close')?.addEventListener('click', () => dlg.close());
  dlg?.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  // ---------- Filters on long tables ----------
  $$('.section .table-wrap').forEach((wrap, i) => {
    const rows = $$('tbody tr', wrap);
    if (rows.length < 20) return;
    const tools = document.createElement('div');
    tools.className = 'table-tools';
    tools.innerHTML = `<label for="filter-${i}">Filter rows</label><input id="filter-${i}" type="search" placeholder="Word, name or year"><span aria-live="polite"></span>`;
    wrap.before(tools);
    const input = $('input', tools), count = $('span', tools);
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      for (const r of rows) {
        const hit = !q || r.textContent.toLowerCase().includes(q);
        r.hidden = !hit;
        shown += hit;
      }
      count.textContent = q ? `${shown} of ${rows.length} rows` : '';
    });
  });

  // ---------- Bible reader ----------
  if (document.body.classList.contains('bible')) {
    const selB = $('#rb'), selC = $('#rc');
    let backlinks;
    const loadBacklinks = () => (backlinks ??= fetch('backlinks.json').then((r) => r.json()));

    async function render() {
      const books = await loadBooks();
      const h = decodeURIComponent(location.hash.slice(1)) || store.get('sib:last') || 'Gen.1';
      let [code, ch, v] = h.split('.');
      const meta = books.find((b) => b[0] === code) || books[0];
      code = meta[0];
      ch = Math.min(Math.max(+ch || 1, 1), meta[2]);
      store.set('sib:last', `${code}.${ch}`);
      selB.value = code;
      selC.innerHTML = Array.from({ length: meta[2] }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('');
      selC.value = String(ch);
      $('#reader-title').textContent = `${meta[1]} ${ch}`;
      document.title = `${meta[1]} ${ch} · The Self-Interpreting Bible`;

      const verses = (await loadBook(code))[ch - 1];
      // Highlight the verse range stored by a popover link ("Isa.9.6") or a plain chapter.
      const target = +v || 0;
      $('#reader-text').innerHTML = verses.map((t, i) => `<p id="v${i + 1}"${i + 1 === target ? ' class="hl"' : ''}><sup>${i + 1}</sup>${esc(t)}</p>`).join('');
      if (target) $(`#v${target}`)?.scrollIntoView({ block: 'center' }); else window.scrollTo(0, 0);

      const idx = books.findIndex((b) => b[0] === code);
      const prev = ch > 1 ? [code, ch - 1, meta[1]] : idx > 0 ? [books[idx - 1][0], books[idx - 1][2], books[idx - 1][1]] : null;
      const next = ch < meta[2] ? [code, ch + 1, meta[1]] : idx < books.length - 1 ? [books[idx + 1][0], 1, books[idx + 1][1]] : null;
      $('#reader-pager').innerHTML =
        (prev ? `<a class="prev" href="#${prev[0]}.${prev[1]}"><span>Previous</span>${esc(prev[2])} ${prev[1]}</a>` : '<span></span>') +
        (next ? `<a class="next" href="#${next[0]}.${next[1]}"><span>Next</span>${esc(next[2])} ${next[1]}</a>` : '<span></span>');

      const bl = await loadBacklinks();
      const annotated = bl.annotated?.[code]?.includes(ch);
      $('#reader-annotated').innerHTML = annotated
        ? `<a href="genesis-${ch}.html">Read ${esc(meta[1])} ${ch} with Brown’s margin and notes →</a>` : '';
      const hits = bl.refs[`${code}.${ch}`] || [];
      $('#cited').innerHTML = hits.length
        ? `<h2>Cited in this edition</h2><ul>${hits.map(([slug, id, ref]) => {
          const vv = ref.split('.')[2];
          return `<li><a href="${slug}.html#${id}">${esc(bl.titles[slug])}</a><span>${vv ? `verse ${esc(vv.replace(/,/g, ', '))}` : 'whole chapter'}</span></li>`;
        }).join('')}</ul>`
        : '<h2>Cited in this edition</h2><p>Nothing transcribed so far cites this chapter.</p>';
    }
    selB.addEventListener('change', () => { location.hash = `${selB.value}.1`; });
    selC.addEventListener('change', () => { location.hash = `${selB.value}.${selC.value}`; });
    addEventListener('hashchange', render);
    render();
  }

  // ---------- Annotated chapters: margin on/off ----------
  const marginBox = $('#show-margin');
  if (marginBox) {
    const apply = () => { $('.scripture').classList.toggle('no-margin', !marginBox.checked); store.set('sib:margin', marginBox.checked ? '1' : '0'); };
    if (store.get('sib:margin') === '0') marginBox.checked = false;
    marginBox.addEventListener('change', apply);
    apply();
  }

  // ---------- Search ----------
  if (document.body.classList.contains('search')) {
    const input = $('#q'), list = $('#search-results'), count = $('#search-count');
    let index;
    fetch('search-index.json').then((r) => r.json()).then((d) => { index = d; run(); });
    function run() {
      if (!index) return;
      const q = input.value.trim().toLowerCase();
      store.set('sib:q', input.value);
      if (q.length < 2) { list.innerHTML = ''; count.textContent = `${index.docs.length.toLocaleString()} rows and paragraphs indexed.`; return; }
      const terms = q.split(/\s+/);
      const hits = index.docs.filter(([, , t]) => { const l = t.toLowerCase(); return terms.every((w) => l.includes(w)); });
      count.textContent = `${hits.length} match${hits.length === 1 ? '' : 'es'}`;
      const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
      list.innerHTML = hits.slice(0, 200).map(([slug, id, t]) => {
        const l = t.toLowerCase(), at = Math.max(0, l.indexOf(terms[0]) - 80);
        const snip = (at ? '…' : '') + t.slice(at, at + 260) + (t.length > at + 260 ? '…' : '');
        return `<li><a href="${slug}.html#${id}">${esc(index.titles[slug])}</a><p>${esc(snip).replace(re, '<mark>$1</mark>')}</p></li>`;
      }).join('');
    }
    input.value = store.get('sib:q') || '';
    input.addEventListener('input', run);
    $('#search-form').addEventListener('submit', (e) => e.preventDefault());
  }
  // ---------- Years: B.C. as printed, or Anno Mundi ----------
  // Ussher's reckoning, as the book pairs them (A.M. 130 = B.C. 3874): A.M. = 4004 − B.C., and A.D. 1 = A.M. 4004.
  // Year columns are found by their headings. Where a table prints A.M. beside B.C., the B.C. column is hidden instead.
  const main = $('main');
  const toAM = (n, era) => (era === 'ad' ? 4003 + n : Math.max(1, 4004 - n));
  const conv = (n, era) => `<span class="era-conv" title="${n} ${era === 'ad' ? 'A.D.' : 'B.C.'} as printed">${toAM(n, era)}</span>`;
  const saved = new Map(); // element → original innerHTML
  const keep = (el) => { if (!saved.has(el)) saved.set(el, el.innerHTML); };
  const textNodes = (el) => {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement.closest('a, .era-conv, script, .popover, .mdate.has-am') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
    });
    const out = [];
    while (w.nextNode()) out.push(w.currentNode);
    return out;
  };
  const swapText = (node, html) => {
    if (html === esc(node.data)) return;
    const t = document.createElement('template');
    t.innerHTML = html;
    node.replaceWith(t.content);
  };
  // A year cell: every number is a year ("599-8" is 599–598); skip ordinals ("3d of Saul") and book numbers ("1 Kings").
  const NUM = /(\d{1,4})(?:-(\d{1,4}))?(?!\d|st\b|nd\b|rd\b|th\b|d\b|\s+[A-Z][a-z])/g;
  const yearCell = (td, era) => {
    keep(td);
    for (const node of textNodes(td)) {
      swapText(node, esc(node.data)
        .replace(/Before Christ|B\.\s?C\./g, 'A.M.')
        .replace(NUM, (m, a, b) => {
          if (!b) return conv(+a, era);
          const full = b.length < a.length ? a.slice(0, a.length - b.length) + b : b;
          return `${conv(+a, era)}-${conv(+full, era)}`;
        }));
    }
  };
  // Running text: "B.C. 1491", "B. C. 1491 and 1451", "Written B.C. 1049 to 1016".
  const INLINE = /B\.\s?C\.\s?(\d{1,4})((?:,?\s*(?:to|and|or|-|–)\s*\d{1,4})*)/g;
  const proseNode = (node) => {
    if (!INLINE.test(node.data)) return;
    INLINE.lastIndex = 0;
    keep(node.parentElement);
    swapText(node, esc(node.data).replace(INLINE, (m, a, rest) =>
      `A.M. ${conv(+a, 'bc')}${rest.replace(/\d{1,4}/g, (n) => conv(+n, 'bc'))}`));
  };
  const IS_BC = /before christ|\bB\.\s?C\.?/i, IS_AM = /year of the world|\bA\.\s?M\./i, IS_AD = /^year\.?$/i;
  const toAMView = () => {
    if (!main) return 0;
    let changed = 0;
    for (const table of $$('table', main)) {
      const heads = $$('thead th', table);
      const kind = heads.map((th) => (IS_AM.test(th.textContent) ? 'am' : IS_BC.test(th.textContent) ? 'bc' : IS_AD.test(th.textContent.trim()) ? 'ad' : ''));
      if (!kind.some((k) => k === 'bc' || k === 'ad')) continue;
      const hasAM = kind.includes('am');
      kind.forEach((k, i) => {
        if (!k || k === 'am') return;
        const th = heads[i];
        if (hasAM) { th.classList.add('era-hide'); return; }
        keep(th);
        th.textContent = th.textContent.replace(/Dates in Years Before Christ/i, 'Dates in Years of the World')
          .replace(/Before Christ\.?|^Year\.?$/i, 'Year of the World').replace(/\bB\.\s?C\./, 'A.M.');
      });
      for (const tr of $$('tbody tr', table)) {
        const cells = [...tr.children];
        kind.forEach((k, i) => {
          const td = cells[i];
          if (!td || !k || k === 'am') return;
          if (hasAM) { td.classList.add('era-hide'); return; }
          // Marker rows switch the column between B.C. and A.D. (First Century tables).
          const t = td.textContent.trim();
          if (/^before christ\.?$/i.test(t)) { kind[i] = k = 'bc'; tr.classList.add('era-hide'); return; }
          if (/^year of our lord\.?$/i.test(t)) { kind[i] = k = 'ad'; tr.classList.add('era-hide'); return; }
          if (/\d/.test(t)) { yearCell(td, k); changed++; }
        });
      }
      if (hasAM) changed++;
    }
    for (const node of textNodes(main)) {
      if (!node.parentElement.closest('.era-hide') && !saved.has(node.parentElement.closest('td, th'))) proseNode(node);
    }
    changed += $$('.era-conv', main).length;
    return changed;
  };
  const toPrinted = () => {
    for (const [el, html] of saved) if (el.isConnected) el.innerHTML = html;
    saved.clear();
    $$('.era-hide', main || document).forEach((el) => el.classList.remove('era-hide'));
  };
  const eraBtns = $$('.era-toggle button');
  const setEra = (era) => {
    toPrinted();
    $('.era-note')?.remove();
    if (era === 'am' && toAMView() && main) {
      const note = document.createElement('p');
      note.className = 'era-note';
      note.innerHTML = 'Years are shown <b>Anno Mundi</b>, from the Creation, converted on Ussher’s reckoning (A.M. = 4004 − B.C.). They are approximate. Hover a year to see the date as printed.';
      ($('h1', main)?.closest('header') || $('h1', main))?.after(note);
    }
    document.documentElement.dataset.era = era;
    eraBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.era === era)));
    store.set('sib:era', era);
  };
  eraBtns.forEach((b) => b.addEventListener('click', () => setEra(b.dataset.era)));
  if (store.get('sib:era') === 'am') setEra('am');
  // ---------- Corrections ----------
  // Served by serve.mjs, the site can take corrections: "Edit mode" puts a ✎ on every block that
  // knows its source lines (data-src), and saving writes the transcription and rebuilds.
  // On a static host with no API, ✎ opens the source file on GitHub instead (data-repo on <html>).
  const repo = document.documentElement.dataset.repo, branch = document.documentElement.dataset.branch || 'main';
  const scanFor = (file) => `scans/${file.split('/').pop().replace(/\.md$/, '.png')}`;
  let apiOk = false;
  const editBtn = $('#edit-toggle');
  const setEditing = (on) => {
    document.body.classList.toggle('editing', on);
    editBtn?.setAttribute('aria-pressed', String(on));
    if (on) $$('[data-src]').forEach((el) => {
      // In a table row the ✎ goes in the last cell.
      const host = el.tagName === 'TR' ? el.lastElementChild : el;
      if (!host || $(':scope > .fix-btn', host)) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fix-btn';
      b.textContent = '✎';
      b.title = 'Correct this transcription';
      host.append(b);
    });
    store.set('sib:editing', on ? '1' : '0');
  };
  fetch('api/ping').then((r) => r.ok && r.json()).then((j) => { apiOk = !!j?.ok; }).catch(() => {}).finally(() => {
    if (!apiOk && !repo) return;
    if (editBtn) editBtn.hidden = false;
    // The proofing list is for correcting, so its ✎ buttons are always on.
    if (store.get('sib:editing') === '1' || document.body.classList.contains('proofing')) setEditing(true);
  });
  editBtn?.addEventListener('click', () => setEditing(!document.body.classList.contains('editing')));

  const fixDlg = $('#fix-dialog');
  let fixParts = null, fixEl = null;
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('.fix-btn');
    if (!b) return;
    e.preventDefault();
    fixEl = b.closest('[data-src]');
    const src = fixEl.dataset.src;
    if (!apiOk) {
      const file = src.split(':')[0];
      window.open(`https://github.com/${repo}/edit/${branch}/transcription/${file}`, '_blank', 'noopener');
      return;
    }
    const r = await fetch(`api/source?src=${encodeURIComponent(src)}`).then((x) => x.json());
    if (r.error) { fixEl.title = r.error; return; }
    fixParts = r.parts;
    $('#fix-status').textContent = '';
    $('#fix-note').value = '';
    $('#fix-current').textContent = fixEl.innerText.replace(/✎\s*$/, '').trim();
    $('#fix-parts').innerHTML = fixParts.map((p, i) => `
      <div class="fix-part">
        <div class="fix-meta"><span>${esc(p.file)} · line ${p.start}${p.end > p.start ? `–${p.end}` : ''}</span>
          <button type="button" class="scan-btn" data-scan="${scanFor(p.file)}" data-label="${esc(p.file)}">View page scan</button></div>
        <textarea id="fix-text-${i}" rows="${Math.min(14, Math.max(3, Math.ceil(p.text.length / 70)))}" spellcheck="false">${esc(p.text)}</textarea>
      </div>`).join('');
    fixDlg.showModal();
    $('#fix-text-0')?.focus();
  });
  $('#fix-cancel')?.addEventListener('click', () => fixDlg.close());
  $('#fix-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const parts = fixParts.map((p, i) => ({ file: p.file, start: p.start, end: p.end, original: p.text, text: $(`#fix-text-${i}`).value }));
    if (parts.every((p) => p.text === p.original)) { $('#fix-status').textContent = 'Nothing has changed.'; return; }
    $('#fix-status').textContent = 'Saving and rebuilding…';
    $('#fix-save').disabled = true;
    try {
      const r = await fetch('api/correct', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ parts, note: $('#fix-note').value }) }).then((x) => x.json());
      if (r.error) throw new Error(r.error);
      $('#fix-status').textContent = 'Saved. Reloading…';
      const id = fixEl.id || fixEl.closest('[id]')?.id;
      location.replace(`${location.pathname}${id ? `#${id}` : ''}`);
      location.reload();
    } catch (err) {
      $('#fix-status').textContent = err.message;
    } finally {
      $('#fix-save').disabled = false;
    }
  });

  // Proofing page: recent corrections, when the API is there.
  const recent = $('#recent-fixes');
  if (recent) fetch('api/log').then((r) => r.json()).then(({ corrections }) => {
    if (!corrections?.length) return;
    recent.hidden = false;
    $('ol', recent).innerHTML = corrections.map((c) => `<li><time>${esc(new Date(c.at).toLocaleString('en-AU'))}</time>${c.note ? ` <em>${esc(c.note)}</em>` : ''}${c.changes.map((ch) => `
      <div class="diff"><span class="fix-meta">${esc(ch.file)} · line ${ch.start}</span><del>${esc(ch.before)}</del><ins>${esc(ch.after)}</ins></div>`).join('')}</li>`).join('');
  }).catch(() => {});
})();

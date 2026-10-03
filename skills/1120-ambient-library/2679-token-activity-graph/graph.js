// Pinned fork of https://bentossell.com/token-activity/graph.js (upstream sha256 88db9e8a780f1a22e3e3c4c21abfb11e2f83171d488359187f3b151fb6a486eb, 2026-09-29).
// Only change: removed the remote DATA_URL / data-src fetch fallback. Re-review upstream before re-pinning.
// token activity graph. mounts into every [data-token-activity] element.
// data: daily.json published hourly from the mac mini, merged from both machines.
(() => {
  // apps are read from the data, so the same file draws anyone's logs. Known apps keep their colour; others take the next spare.
  let APPS = [];
  const COLORS = { claude: '#d97757', codex: '#10a37f', pi: '#8b5cf6', factory: '#2f6bff', bb: '#d4a017' };
  const SPARE = ['#e05d8a', '#0f9b9b', '#7cb342', '#c026d3', '#a0522d', '#0ea5c9', '#64748b'];
  function appsIn(data) {
    const set = new Set(); for (const d of Object.values(data.days || {})) for (const a of Object.keys(d)) set.add(a);
    const list = [...set]; let k = 0;
    for (const a of list) if (!COLORS[a]) COLORS[a] = SPARE[k++ % SPARE.length];
    return list;
  }
  const CELL = 10, GAP = 2, LEFT = 24, TOP = 14, SCELL = 8, SLEFT = 66, ROWGAP = 12, MLEFT = 0;
  const MPAL = ['#0f9b9b', '#e05d8a', '#4f46e5', '#7cb342', '#f59e0b', '#0ea5c9', '#a0522d', '#c026d3', '#64748b'];
  const OTHER = '#9ba4b1', TOPN = MPAL.length, BW = 10, BH = 90;
  const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const fmt = (n) => n >= 1e9 ? (n / 1e9).toFixed(n < 1e10 ? 2 : 1) + 'B' : n >= 1e6 ? (n / 1e6).toFixed(n < 1e7 ? 1 : 0) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'k' : String(Math.round(n));
  const money = (n) => n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : '$' + n.toFixed(n < 10 ? 2 : 0);
  const total = (r) => r.in + r.out + r.cr + r.cw;
  const metricOf = (r, m) => m === 'output' ? r.out : m === 'cost' ? r.cost : total(r);
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  function calendar(data) {
    const end = new Date(); end.setHours(0, 0, 0, 0);
    // start in January: no data exists before the first month, so do not pad the left side
    const first = Object.keys(data.days || {}).sort()[0];
    const start = new Date(first ? Number(first.slice(0, 4)) : end.getFullYear(), 0, 1);
    const weeks = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const row = (d.getDay() + 6) % 7;
      if (row === 0 || !weeks.length) weeks.push([]);
      weeks[weeks.length - 1].push({ date: iso(d), d: new Date(d), row });
    }
    return weeks;
  }
  const label = (date) => { const d = new Date(date + 'T00:00'); return dayName[d.getDay()] + ' ' + d.getDate() + ' ' + monName[d.getMonth()]; };
  function shader(values) {
    const nz = values.filter(v => v > 0).sort((a, b) => a - b);
    const q = [0.2, 0.4, 0.6, 0.8].map(p => nz[Math.floor(p * (nz.length - 1))] || 0);
    const op = [0.22, 0.42, 0.62, 0.82, 1];
    return (v) => v <= 0 ? 0 : op[q.filter(t => v > t).length];
  }

  const CSS = `
:root{--z-tooltip:300}
.ta{--ta-muted:var(--muted,#6b7280);--ta-ink:var(--ink,#202126);--ta-paper:var(--paper,#fbfdfd);--ta-cell:color-mix(in srgb,var(--ink,#202126) 8%,transparent);font:12px/1.5 var(--mono,"SFMono-Regular",Consolas,"Liberation Mono",monospace);font-variant-numeric:tabular-nums;color:var(--ta-ink)}
.ta .ta-head { display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap }
.ta .ta-head.ta-left-empty > div:first-child{display:none}
.ta .ta-head p{margin:0;color:var(--ta-muted)}
.ta .ta-title{font-weight:600;color:inherit;text-decoration:none}
.ta a.ta-title:hover{text-decoration:underline;text-underline-offset:3px}
.ta .ta-toggle{display:flex;gap:6px}
.ta button{all:unset;cursor:pointer;color:var(--ta-muted);display:inline-block;padding:11px 2px;border-radius:3px;transition:color .15s ease-out,transform .15s ease-out}
.ta button:hover{color:var(--ta-ink)}
.ta button:active{transform:scale(.96)}
.ta button:focus-visible{outline:2px solid var(--ta-ink);outline-offset:2px}
@media (pointer:coarse){.ta button{padding:12px 8px}}
@media (prefers-reduced-motion:reduce){.ta button{transition:none}}
.ta .ta-toggle button.on{color:var(--ta-ink);text-decoration:underline;text-underline-offset:3px}
.ta .ta-apps{display:flex;gap:10px;margin:0 0 8px;flex-wrap:wrap;align-items:baseline}
.ta .ta-apps button b{font-weight:600}
.ta .ta-apps button.dim{opacity:.45}
.ta .ta-apps .sw{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px}
.ta .ta-split{margin-left:auto}
.ta .ta-split.on{color:var(--ta-ink);text-decoration:underline;text-underline-offset:3px}
.ta .ta-scroll{overflow-x:auto;padding-bottom:4px}
.ta svg{display:block}
.ta .ta-axis{fill:var(--ta-muted);font-size:10px}
.ta .ta-foot{margin-top:8px;color:var(--ta-muted);display:flex;gap:16px;flex-wrap:wrap}
.ta .ta-foot b{color:var(--ta-ink);font-weight:600}
.ta .ta-foot .ta-late{color:color-mix(in srgb,#ef4444 60%,var(--ta-ink))}
.ta .ta-models{margin-top:24px}
.ta .ta-models p{margin:0 0 6px;color:var(--ta-muted)}
.ta-tip{position:fixed;display:none;pointer-events:none;background:var(--ink,#202126);color:var(--paper,#fbfdfd);padding:5px 8px;border-radius:4px;font:11px/1.45 var(--mono,"SFMono-Regular",Consolas,monospace);white-space:nowrap;z-index:var(--z-tooltip,300)}
`;

  let tipEl;
  function tip(el) {
    if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'ta-tip'; document.body.appendChild(tipEl); }
    const show = (c, x, y) => {
      tipEl.innerHTML = c.dataset.tip; tipEl.style.display = 'block';
      const w = tipEl.offsetWidth; let left = x + 12; if (left + w > innerWidth - 8) left = x - w - 12;
      tipEl.style.left = Math.max(8, left) + 'px'; tipEl.style.top = (y + 14) + 'px';
    };
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const c = e.target.closest('[data-tip]'); if (!c) { tipEl.style.display = 'none'; return; }
      show(c, e.clientX, e.clientY);
    });
    el.addEventListener('pointerleave', () => tipEl.style.display = 'none');
    el.addEventListener('pointerdown', (e) => {
      const c = e.target.closest('[data-tip]'); if (!c) return;
      show(c, e.clientX, e.clientY);
      clearTimeout(el._taTimer); el._taTimer = setTimeout(() => tipEl.style.display = 'none', 3000);
    });
  }

  function mount(root, data) {
    APPS = appsIn(data);
    const linkTitle = root.dataset.tokenActivity === 'link';
    const state = { metric: 'tokens', only: null, split: false };
    root.classList.add('ta');
    root.innerHTML = `<div class="ta-head"><div>${linkTitle ? '<a class="ta-title" href="/token-activity/">token activity</a>' : '<span class="ta-title">token activity</span>'}<p class="ta-sub"></p></div><div class="ta-toggle"><button data-m="tokens" class="on" aria-pressed="true">tokens</button><button data-m="output" aria-pressed="false">output only</button><button data-m="cost" aria-pressed="false">cost</button></div></div><div class="ta-apps"></div><div class="ta-scroll"></div><div class="ta-foot"></div><div class="ta-models"><p></p><div class="ta-scroll"></div></div>`;
    const $ = (s) => root.querySelector(s);
    const weeks = calendar(data);
    // drop leading weeks with no data so both charts share the same left edge
    while (weeks.length && !weeks[0].some(c => data.days[c.date])) weeks.shift();
    const days = weeks.flat();
    const range = days.length ? `${label(days[0].date)} to ${label(days[days.length - 1].date)}` : '';
    const unit = (v) => state.metric === 'cost' ? money(v) : fmt(v);
    const val = (c, a) => data.days[c.date]?.[a] ? metricOf(data.days[c.date][a], state.metric) : 0;
    const tipFor = (c, apps) => {
      const parts = apps.filter(a => val(c, a) > 0).sort((a, b) => val(c, b) - val(c, a)).map(a => `<span style="color:${COLORS[a]}">■</span> ${a} ${unit(val(c, a))}`).join('<br>');
      const s = apps.reduce((x, a) => x + val(c, a), 0);
      return esc(s > 0 ? `<b>${label(c.date)}</b> · ${unit(s)}<br>${parts}` : `${label(c.date)} · nothing`);
    };
    const monthLabels = (left, cell, y) => { let s = '', last = -1; weeks.forEach((w, i) => { const m = w[0].d.getMonth(); if (m !== last && w[0].d.getDate() <= 7) { s += `<text class="ta-axis" x="${left + i * (cell + GAP)}" y="${y}">${monName[m]}</text>`; last = m; } }); return s; };

    $('.ta-toggle').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; state.metric = b.dataset.m; for (const x of b.parentNode.children) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); } render(); };
    $('.ta-apps').onclick = (e) => {
      if (e.target.closest('.ta-split')) { state.split = !state.split; state.only = null; render(); return; }
      const b = e.target.closest('button[data-app]'); if (!b) return;
      state.only = state.only === b.dataset.app ? null : b.dataset.app; state.split = false; render();
    };
    tip($('.ta-scroll'));
    tip($('.ta-models .ta-scroll'));

    // model rows for a day, limited to the apps in view
    const modelRows = (c, apps) => { const out = []; const byApp = data.models?.[c.date] || {}; for (const a of apps) for (const [m, r] of Object.entries(byApp[a] || {})) out.push([m, metricOf(r, state.metric)]); return out; };
    function renderModels(apps) {
      const tot = {}; for (const c of days) for (const [m, v] of modelRows(c, apps)) tot[m] = (tot[m] || 0) + v;
      const ranked = Object.entries(tot).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      const top = ranked.slice(0, TOPN).map(([m]) => m);
      const col = (m) => m === 'other' ? OTHER : MPAL[top.indexOf(m)];
      const wk = weeks.map(w => { const o = {}; for (const c of w) for (const [m, v] of modelRows(c, apps)) { const k = top.includes(m) ? m : 'other'; o[k] = (o[k] || 0) + v; } return o; });
      const max = Math.sqrt(Math.max(1, ...wk.map(o => Object.values(o).reduce((a, b) => a + b, 0))));
      const W = MLEFT + weeks.length * (BW + GAP);
      let s = `<svg role="img" aria-label="${esc('tokens by model per week, ' + range)}" width="${W}" height="${BH + 14}" viewBox="0 0 ${W} ${BH + 14}">`;
      const order = [...top, 'other'];
      wk.forEach((o, i) => {
        const t = Object.values(o).reduce((a, b) => a + b, 0); if (!t) return;
        const scale = Math.sqrt(t) / max * BH / t; let y = BH;
        const parts = order.filter(m => o[m]).map(m => `<span style="color:${col(m)}">■</span> ${m} ${unit(o[m])}`).join('<br>');
        const t2 = esc(`<b>week of ${label(weeks[i][0].date)}</b> · ${unit(t)}<br>${parts}`);
        for (const m of order) { if (!o[m]) continue; const h = o[m] * scale; y -= h; s += `<rect x="${MLEFT + i * (BW + GAP)}" y="${y.toFixed(1)}" width="${BW}" height="${h.toFixed(1)}" fill="${col(m)}" data-tip="${t2}"/>`; }
      });
      s += monthLabels(MLEFT, BW, BH + 11) + '</svg>';
      $('.ta-models p').textContent = ranked.length ? 'by model' : '';
      const g = $('.ta-models .ta-scroll'); g.innerHTML = ranked.length ? s : ''; g.scrollLeft = g.scrollWidth;
    }

    function render() {
      const { metric, only, split } = state;
      const tot = {}; for (const a of APPS) tot[a] = days.reduce((x, c) => x + val(c, a), 0);
      const order = [...APPS].sort((a, b) => tot[b] - tot[a]);
      $('.ta-apps').innerHTML = order.map(a => `<button data-app="${a}" aria-pressed="${only === a}" class="${only && only !== a ? 'dim' : ''}"><span class="sw" style="background:${COLORS[a]}"></span><b style="color:var(--ta-ink)">${a}</b> ${unit(tot[a])}</button>`).join('') + `<button class="ta-split ${split ? 'on' : ''}" aria-pressed="${split}">${split ? 'combine' : 'split'}</button>`;
      $('.ta-sub').textContent = only ? `${only} only. click again for every app.` : '';
      $('.ta-head').classList.toggle('ta-left-empty', !linkTitle && !$('.ta-sub').textContent);
      let s;
      if (!split) {
        const apps = only ? [only] : APPS;
        const sums = days.map(c => apps.reduce((x, a) => x + val(c, a), 0));
        const sumsByDate = {}; days.forEach((c, i) => { sumsByDate[c.date] = sums[i]; });
        const shade = shader(sums);
        const W = LEFT + weeks.length * (CELL + GAP), H = TOP + 7 * (CELL + GAP);
        s = `<svg role="img" aria-label="${esc((only || 'all apps') + ' ' + metric + ' by day, ' + range)}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` + monthLabels(LEFT, CELL, 9);
        weeks.forEach((w, i) => { for (const c of w) {
          const v = sumsByDate[c.date] || 0;
          let top = only; if (!only) { let tv = 0; for (const a of APPS) { const x = val(c, a); if (x > tv) { tv = x; top = a; } } }
          s += `<rect rx="2" x="${LEFT + i * (CELL + GAP)}" y="${TOP + c.row * (CELL + GAP)}" width="${CELL}" height="${CELL}" fill="${v > 0 ? COLORS[top] : 'var(--ta-cell)'}" opacity="${v > 0 ? shade(v).toFixed(2) : 1}" data-tip="${tipFor(c, apps)}"/>`;
        } });
        [0, 2, 4].forEach(r => s += `<text class="ta-axis" x="0" y="${TOP + r * (CELL + GAP) + 9}">${dayName[(r + 1) % 7]}</text>`);
        s += '</svg>';
      } else {
        const shade = shader(APPS.flatMap(a => days.map(c => val(c, a))));
        const blockH = 7 * (SCELL + GAP);
        const W = SLEFT + weeks.length * (SCELL + GAP), H = 12 + APPS.length * (blockH + ROWGAP);
        s = `<svg role="img" aria-label="${esc('tokens by app and day, ' + range)}" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` + monthLabels(SLEFT, SCELL, 8);
        order.forEach((a, ai) => {
          const y0 = 12 + ai * (blockH + ROWGAP);
          const active = days.filter(c => val(c, a) > 0).length;
          s += `<text x="0" y="${y0 + 10}" font-weight="600" font-size="11" fill="var(--ta-ink)">${a}</text><text class="ta-axis" x="0" y="${y0 + 22}">${unit(tot[a])}</text><text class="ta-axis" x="0" y="${y0 + 34}">${active} days</text>`;
          weeks.forEach((w, i) => { for (const c of w) {
            const v = val(c, a);
            s += `<rect rx="2" x="${SLEFT + i * (SCELL + GAP)}" y="${y0 + c.row * (SCELL + GAP)}" width="${SCELL}" height="${SCELL}" fill="${v > 0 ? COLORS[a] : 'var(--ta-cell)'}" opacity="${v > 0 ? shade(v).toFixed(2) : 1}" data-tip="${tipFor(c, [a])}"/>`;
          } });
        });
        s += '</svg>';
      }
      const g = $('.ta-scroll'); g.innerHTML = s; g.scrollLeft = g.scrollWidth;
      const apps = only ? [only] : APPS;
      const tokens = days.reduce((x, c) => x + apps.reduce((y, a) => y + (data.days[c.date]?.[a] ? total(data.days[c.date][a]) : 0), 0), 0);
      const cost = days.reduce((x, c) => x + apps.reduce((y, a) => y + (data.days[c.date]?.[a]?.cost || 0), 0), 0);
      const activeDays = days.filter(c => apps.some(a => val(c, a) > 0)).length;
      // streak counts through yesterday when today has no data yet
      let i = days.length - 1; if (!apps.some(a => val(days[i], a) > 0)) i--;
      let streak = 0; for (; i >= 0 && apps.some(a => val(days[i], a) > 0); i--) streak++;
      renderModels(apps);
      // freshness comes from the newest day of data, not the publish time, so a stalled source is visible
      const newest = Object.keys(data.days || {}).sort().pop() || null;
      const today = iso(new Date());
      const fresh = newest ? (newest === today ? 'today' : label(newest)) : null;
      const late = newest ? (new Date(today + 'T00:00') - new Date(newest + 'T00:00')) / 864e5 > 1 : false;
      $('.ta-foot').innerHTML = `<span><b>${fmt(tokens)}</b> tokens</span><span><b>${money(cost)}</b> at list price</span><span><b>${activeDays}</b> active days</span><span><b>${streak}</b> day streak</span>${fresh ? `<span class="${late ? 'ta-late' : ''}">data to <b>${fresh}</b></span>` : ''}`;
    }
    render();
  }

  function init() {
    const roots = document.querySelectorAll('[data-token-activity]');
    if (!roots.length) return;
    if (!document.getElementById('ta-css')) { const st = document.createElement('style'); st.id = 'ta-css'; st.textContent = CSS; document.head.appendChild(st); }
    // inline data wins: a script tag with type="application/json" and id="token-activity-data"
    const inline = document.getElementById('token-activity-data');
    if (inline) { try { const data = JSON.parse(inline.textContent); roots.forEach(r => mount(r, data)); return; } catch (e) {} }
    // pinned fork: no remote fallback — missing or broken inline data must fail visibly, never draw someone else's usage.
    roots.forEach(r => { r.classList.add('ta'); r.innerHTML = '<p style="color:#c0392b;margin:0">token activity data missing or invalid: no #token-activity-data JSON block.</p>'; });
  }
  window.tokenActivityInit = init;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
